import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Animated,
  ScrollView,
  Keyboard,
} from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getTransactions } from "../../../api/transactions";
import { useQuery } from "@tanstack/react-query";
import Svg, { Path, Circle, Line } from "react-native-svg";

// Search Icon
const SearchIcon = ({ color = "#0C1A26" }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
    <Path
      d="m21 21-4.35-4.35"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Arrow Down Icon (Deposit)
const ArrowDownIcon = ({ color = "#2E6B45" }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="19"
      y1="12"
      x2="12"
      y2="19"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="5"
      y1="12"
      x2="12"
      y2="19"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Arrow Up Icon (Withdraw)
const ArrowUpIcon = ({ color = "#A63A24" }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Line
      x1="12"
      y1="19"
      x2="12"
      y2="5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="19"
      y1="12"
      x2="12"
      y2="5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="5"
      y1="12"
      x2="12"
      y2="5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Transfer Icon (Double Arrow)
const TransferIcon = ({ color = "#A63A24" }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Line
      x1="7"
      y1="17"
      x2="17"
      y2="7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="7"
      y1="7"
      x2="17"
      y2="17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const ITEMS_PER_PAGE = 50;

const history = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [displayedTransactions, setDisplayedTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  // Initialize with all transactions
  useEffect(() => {
    if (transactions && !isSearching) {
      const sorted = [...transactions].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFilteredTransactions(sorted);
      setDisplayedTransactions(sorted.slice(0, ITEMS_PER_PAGE));
    }
  }, [transactions, isSearching]);

  // Update displayed transactions when page changes
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    setDisplayedTransactions(filteredTransactions.slice(startIndex, endIndex));
  }, [currentPage, filteredTransactions]);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    if (!transactions) return;

    let filtered = [...transactions];

    // Filter by date range
    if (fromDate || toDate) {
      filtered = filtered.filter((t: any) => {
        const transactionDate = new Date(t.createdAt);
        if (fromDate && toDate) {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          return transactionDate >= from && transactionDate <= to;
        } else if (fromDate) {
          const from = new Date(fromDate);
          return transactionDate >= from;
        } else if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          return transactionDate <= to;
        }
        return true;
      });
    }

    // Filter by amount (exact match)
    if (amount) {
      const amountValue = parseFloat(amount.replace(/[^0-9.]/g, ""));
      if (!isNaN(amountValue)) {
        filtered = filtered.filter(
          (t: any) => Math.abs(Math.abs(t.amount) - amountValue) < 0.01
        );
      }
    }

    // Filter by transaction type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((t: any) => selectedTypes.includes(t.type));
    }

    // Sort by date (newest first)
    filtered.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredTransactions(filtered);
    setCurrentPage(1);
    setDisplayedTransactions(filtered.slice(0, ITEMS_PER_PAGE));
  }, [fromDate, toDate, amount, selectedTypes, transactions]);

  const toggleTypeFilter = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const handleLoadMore = () => {
    if (displayedTransactions.length < filteredTransactions.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${
      months[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionTitle = (transaction: any) => {
    if (transaction.type === "deposit") {
      return "Deposit";
    } else if (transaction.type === "withdraw") {
      return "Withdrawal";
    } else if (transaction.type === "transfer") {
      return transaction.toUsername
        ? `Sent to ${transaction.toUsername}`
        : "Transfer";
    }
    return "Transaction";
  };

  const getTransactionDetail = (transaction: any) => {
    if (transaction.type === "transfer" && transaction.toUsername) {
      return `to @${transaction.toUsername}`;
    }
    return formatDate(transaction.createdAt);
  };

  const renderTransaction = ({ item, index }: { item: any; index: number }) => {
    const isDeposit = item.type === "deposit";
    const isWithdraw = item.type === "withdraw";
    const isTransfer = item.type === "transfer";

    return (
      <View>
        <View style={styles.transactionItem}>
          <View
            style={[
              styles.transactionIcon,
              isDeposit ? styles.depositIcon : styles.withdrawIcon,
            ]}
          >
            {isDeposit ? (
              <ArrowDownIcon color={isDeposit ? "#2E6B45" : "#A63A24"} />
            ) : isTransfer ? (
              <TransferIcon color="#A63A24" />
            ) : (
              <ArrowUpIcon color="#A63A24" />
            )}
          </View>
          <View style={styles.transactionContent}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionTitle}>
                {getTransactionTitle(item)}
              </Text>
              <View style={styles.amountContainer}>
                <Text
                  style={[
                    styles.transactionAmount,
                    isDeposit ? styles.depositAmount : styles.withdrawAmount,
                  ]}
                >
                  {isDeposit ? "+" : "-"}
                  {formatAmount(Math.abs(item.amount))}
                </Text>
                <View style={styles.currencyCapsule}>
                  <Text style={styles.currencyText}>KWD</Text>
                </View>
              </View>
            </View>
            <View style={styles.transactionSubtitle}>
              <Text style={styles.transactionDate}>
                {formatDate(item.createdAt)}
              </Text>
              {isTransfer && item.toUsername && (
                <Text style={styles.transactionDetail}>
                  {getTransactionDetail(item)}
                </Text>
              )}
            </View>
          </View>
        </View>
        {index < displayedTransactions.length - 1 && (
          <View style={styles.divider} />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D8A75F" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  const ListEmptyComponent = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No transactions found</Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setFromDate("");
          setToDate("");
          setAmount("");
          setSelectedTypes([]);
          setIsSearching(false);
          if (transactions) {
            const sorted = [...transactions].sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            setFilteredTransactions(sorted);
            setDisplayedTransactions(sorted.slice(0, ITEMS_PER_PAGE));
            setCurrentPage(1);
          }
        }}
      >
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={true}
      >
        {/* Filter Card */}
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.filterCard}>
            {/* Date Inputs */}
            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>From</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor="#C9B99A80"
                  value={fromDate}
                  onChangeText={setFromDate}
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>To</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor="#C9B99A80"
                  value={toDate}
                  onChangeText={setToDate}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="e.g., 50 KWD"
                placeholderTextColor="#C9B99A80"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                blurOnSubmit={false}
              />
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsContainer}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  selectedTypes.includes("deposit")
                    ? styles.filterPillActive
                    : styles.filterPillInactive,
                  selectedTypes.includes("deposit") && styles.depositPill,
                ]}
                onPress={() => toggleTypeFilter("deposit")}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedTypes.includes("deposit") &&
                      styles.filterPillTextActive,
                  ]}
                >
                  Deposit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  selectedTypes.includes("withdraw")
                    ? styles.filterPillActive
                    : styles.filterPillInactive,
                  selectedTypes.includes("withdraw") && styles.withdrawPill,
                ]}
                onPress={() => toggleTypeFilter("withdraw")}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedTypes.includes("withdraw") &&
                      styles.filterPillTextActive,
                  ]}
                >
                  Withdraw
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  selectedTypes.includes("transfer")
                    ? styles.filterPillActive
                    : styles.filterPillInactive,
                  selectedTypes.includes("transfer") && styles.transferPill,
                ]}
                onPress={() => toggleTypeFilter("transfer")}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedTypes.includes("transfer") &&
                      styles.filterPillTextActive,
                  ]}
                >
                  Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              activeOpacity={0.8}
            >
              <SearchIcon />
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Transaction List */}
        {displayedTransactions.length > 0 ? (
          <View>
            {displayedTransactions.map((item, index) => (
              <View key={item.id?.toString() || index.toString()}>
                {renderTransaction({ item, index })}
              </View>
            ))}
            {displayedTransactions.length < filteredTransactions.length && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
              >
                <ActivityIndicator size="small" color="#D8A75F" />
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ListEmptyComponent />
        )}
      </ScrollView>
    </View>
  );
};

export default history;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1A26",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#C9B99A",
    fontSize: 16,
    fontFamily: "Inter",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F5F1E8",
    fontFamily: "Playfair Display",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  filterCard: {
    backgroundColor: "#0E2030",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 20,
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#C9B99A",
    marginBottom: 8,
    fontFamily: "Inter",
  },
  dateInput: {
    backgroundColor: "#0C1A26",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    color: "#F5F1E8",
    fontSize: 14,
    fontFamily: "Inter",
  },
  amountInputContainer: {
    marginBottom: 16,
  },
  amountInput: {
    backgroundColor: "#0C1A26",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    color: "#F5F1E8",
    fontSize: 14,
    fontFamily: "Inter",
  },
  filterPillsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    // Solid background
  },
  filterPillInactive: {
    borderWidth: 1,
    borderColor: "#D8A75F33",
    backgroundColor: "transparent",
  },
  depositPill: {
    backgroundColor: "#2E6B45",
  },
  withdrawPill: {
    backgroundColor: "#A63A24",
  },
  transferPill: {
    backgroundColor: "#A63A24",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C9B99A",
    fontFamily: "Inter",
  },
  filterPillTextActive: {
    color: "#F5F1E8",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D8A75F",
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchButtonText: {
    color: "#0C1A26",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter",
    textAlign: "center",
  },
  transactionItem: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  depositIcon: {
    backgroundColor: "#2E6B4520",
  },
  withdrawIcon: {
    backgroundColor: "#A63A2420",
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F5F1E8",
    fontFamily: "Inter",
    flex: 1,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "IBM Plex Mono",
  },
  depositAmount: {
    color: "#2E6B45",
  },
  withdrawAmount: {
    color: "#A63A24",
  },
  currencyCapsule: {
    backgroundColor: "#C9B99A33",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currencyText: {
    fontSize: 10,
    color: "#C9B99A",
    fontWeight: "600",
    fontFamily: "Inter",
  },
  transactionSubtitle: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  transactionDate: {
    fontSize: 12,
    color: "#C9B99A",
    fontFamily: "Inter",
  },
  transactionDetail: {
    fontSize: 12,
    color: "#C9B99A",
    fontFamily: "Inter",
  },
  divider: {
    height: 1,
    backgroundColor: "#D8A75F26",
    marginLeft: 76,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#C9B99A",
    marginBottom: 24,
    fontFamily: "Inter",
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8A75F",
    backgroundColor: "transparent",
  },
  resetButtonText: {
    color: "#D8A75F",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
  },
  loadMoreText: {
    color: "#D8A75F",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter",
  },
});
