import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { me } from "../../../api/auth";
import {
  depositBalance,
  getTransactions,
  withdrawBalance,
} from "../../../api/transactions";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

// Corner Decoration SVG
const CornerDecoration = () => (
  <Svg width="60" height="60" viewBox="0 0 60 60">
    <Path
      d="M30 10 L40 30 L30 50 L20 30 Z"
      fill="none"
      stroke="#D8A75F"
      strokeWidth="1"
    />
    <Circle
      cx="30"
      cy="30"
      r="8"
      stroke="#D8A75F"
      strokeWidth="1"
      fill="none"
    />
  </Svg>
);

// Small Vault Icon for Header
const SmallVaultIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <Rect
      x="6"
      y="6"
      width="20"
      height="20"
      rx="2"
      stroke="#D8A75F"
      strokeWidth="1.5"
      fill="none"
    />
    <Circle
      cx="16"
      cy="16"
      r="6"
      stroke="#D8A75F"
      strokeWidth="1.5"
      fill="none"
    />
    <Circle cx="16" cy="16" r="2" fill="#D8A75F" />
    <Line x1="22" y1="16" x2="25" y2="16" stroke="#D8A75F" strokeWidth="1.5" />
  </Svg>
);

// Arrow Down Icon (Deposit)
const ArrowDownIcon = ({ color = "#F5F1E8" }: { color?: string }) => (
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
const ArrowUpIcon = ({ color = "#0C1A26" }: { color?: string }) => (
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

// Check Icon (Ok)
const CheckIcon = ({ color = "#F5F1E8" }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// X Icon (Close)
const XIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
      stroke="#C9B99A"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
      stroke="#C9B99A"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const index = () => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>("");
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [showWithdrawInput, setShowWithdrawInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const slideAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: me,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  // Get last 3 transactions (newest first)
  const recentTransactions = transactions
    ? [...transactions]
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3)
    : [];

  // Calculate percentage change
  const calculatePercentageChange = () => {
    if (!transactions || !user?.balance)
      return { percentage: 0, hasChange: false };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // Sort all transactions by date (oldest first)
    const sortedTransactions = [...transactions].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate original balance at start of month by working backwards
    // Start with current balance and reverse all transactions from this month
    let originalBalance = user.balance;

    // Reverse all transactions from this month to get the original balance
    const thisMonthTransactions = sortedTransactions.filter((t: any) => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startOfMonth;
    });

    // Work backwards: subtract deposits and add withdrawals to get original balance
    thisMonthTransactions.forEach((t: any) => {
      if (t.type === "deposit") {
        originalBalance -= t.amount;
      } else if (t.type === "withdraw") {
        originalBalance += t.amount;
      } else if (t.type === "transfer") {
        // For transfers, we need to check if it's incoming or outgoing
        // This depends on the API structure - assuming it's always outgoing for now
        originalBalance += t.amount;
      }
    });

    // Calculate net change
    const netChange = user.balance - originalBalance;

    // If original balance is 0 or negative, handle edge cases
    if (originalBalance <= 0) {
      if (netChange > 0) {
        // Had no balance, now have balance - show as 100% increase
        return { percentage: 100, hasChange: true };
      } else if (netChange < 0) {
        // Had balance, now have less - show as decrease
        return { percentage: -100, hasChange: true };
      }
      return { percentage: 0, hasChange: false };
    }

    // Calculate percentage change: (net change / original balance) * 100
    const percentage = (netChange / originalBalance) * 100;
    return { percentage, hasChange: true };
  };

  const { percentage: percentageChange, hasChange } =
    calculatePercentageChange();

  const { mutate: deposit, isPending: isDepositing } = useMutation({
    mutationKey: ["deposit"],
    mutationFn: (value: number) => depositBalance(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAmount("");
      setShowDepositInput(false);
      setErrorMessage("");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Deposit failed. Please try again.";
      setErrorMessage(message);
    },
  });

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationKey: ["withdraw"],
    mutationFn: (value: number) => withdrawBalance(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAmount("");
      setShowWithdrawInput(false);
      setErrorMessage("");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Withdrawal failed. Please try again.";
      setErrorMessage(message);
    },
  });

  const handleDepositPress = () => {
    if (showDepositInput) {
      // Validate and submit
      const numAmount = parseFloat(amount);
      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        setErrorMessage("Please enter a valid amount greater than 0");
        return;
      }
      deposit(numAmount);
    } else {
      setShowDepositInput(true);
      setShowWithdrawInput(false);
      setErrorMessage("");
    }
  };

  const handleWithdrawPress = () => {
    if (showWithdrawInput) {
      // Validate and submit
      const numAmount = parseFloat(amount);
      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        setErrorMessage("Please enter a valid amount greater than 0");
        return;
      }
      if (numAmount > (user?.balance || 0)) {
        setErrorMessage("Insufficient balance");
        return;
      }
      withdraw(numAmount);
    } else {
      setShowWithdrawInput(true);
      setShowDepositInput(false);
      setErrorMessage("");
    }
  };

  const handleCloseInput = () => {
    setShowDepositInput(false);
    setShowWithdrawInput(false);
    setAmount("");
    setErrorMessage("");
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{user?.username || "User"}</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon}>
          <SmallVaultIcon />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.balanceContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cornerDecorationContainer}>
            <CornerDecoration />
          </View>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {formatAmount(user?.balance || 0)}
            </Text>
            <View style={styles.currencyCapsule}>
              <Text style={styles.currencyText}>KWD</Text>
            </View>
          </View>
          {hasChange && (
            <View style={styles.percentageContainer}>
              <Text
                style={[
                  styles.percentageText,
                  percentageChange > 0
                    ? styles.percentagePositive
                    : styles.percentageNegative,
                ]}
              >
                {percentageChange > 0 ? "+" : ""}
                {percentageChange.toFixed(1)}% this month
              </Text>
              <Text
                style={[
                  styles.percentageArrow,
                  percentageChange > 0
                    ? styles.percentagePositive
                    : styles.percentageNegative,
                ]}
              >
                {percentageChange > 0 ? "↑" : "↓"}
              </Text>
            </View>
          )}
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.depositButton,
              showDepositInput && styles.actionButtonActive,
            ]}
            onPress={handleDepositPress}
            disabled={isDepositing || isWithdrawing}
          >
            {showDepositInput ? (
              <View style={styles.buttonContent}>
                <CheckIcon color="#F5F1E8" />
                <Text style={styles.depositButtonText}>Ok</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <ArrowDownIcon color="#F5F1E8" />
                <Text style={styles.depositButtonText}>Deposit</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.withdrawButton,
              showWithdrawInput && styles.actionButtonActive,
            ]}
            onPress={handleWithdrawPress}
            disabled={isDepositing || isWithdrawing}
          >
            {showWithdrawInput ? (
              <View style={styles.buttonContent}>
                <CheckIcon color="#0C1A26" />
                <Text style={styles.withdrawButtonText}>Ok</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <ArrowUpIcon color="#0C1A26" />
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Input Field */}
        {(showDepositInput || showWithdrawInput) && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.amountInput,
                showDepositInput && styles.depositInput,
                showWithdrawInput && styles.withdrawInput,
                errorMessage && styles.inputError,
              ]}
              placeholder="Enter amount"
              placeholderTextColor="#C9B99A80"
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setErrorMessage("");
              }}
              autoFocus
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseInput}
            >
              <XIcon />
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction: any) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View
                  style={[
                    styles.transactionIcon,
                    transaction.type === "deposit"
                      ? styles.depositIcon
                      : styles.withdrawIcon,
                  ]}
                >
                  {transaction.type === "deposit" ? (
                    <ArrowDownIcon color="#2AA7A1" />
                  ) : (
                    <ArrowUpIcon color="#D8A75F" />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>
                    {transaction.type === "deposit"
                      ? "Deposit"
                      : transaction.type === "withdraw"
                      ? "Withdrawal"
                      : "Transfer"}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === "deposit"
                      ? styles.depositAmount
                      : styles.withdrawAmount,
                  ]}
                >
                  {transaction.type === "deposit" ? "+" : "-"}
                  {formatAmount(Math.abs(transaction.amount))}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noTransactionsText}>
              No recent transactions
            </Text>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1A26",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: "#C9B99A",
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#F5F1E8",
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8A75F",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0E2030",
  },
  balanceContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  balanceCard: {
    backgroundColor: "#0E2030",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 24,
    marginBottom: 20,
    position: "relative",
    overflow: "visible",
  },
  cornerDecorationContainer: {
    position: "absolute",
    top: -2,
    right: -2,
    zIndex: 10,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#C9B99A",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#F5F1E8",
    flex: 1,
  },
  currencyCapsule: {
    backgroundColor: "#C9B99A33",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currencyText: {
    fontSize: 12,
    color: "#F5F1E8",
    fontWeight: "600",
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "500",
  },
  percentagePositive: {
    color: "#2AA7A1",
  },
  percentageNegative: {
    color: "#FF6B6B",
  },
  percentageArrow: {
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonActive: {
    opacity: 0.9,
  },
  depositButton: {
    backgroundColor: "#2AA7A1",
  },
  withdrawButton: {
    backgroundColor: "#D8A75F",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  depositButtonText: {
    color: "#F5F1E8",
    fontSize: 16,
    fontWeight: "600",
  },
  withdrawButtonText: {
    color: "#0C1A26",
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#F5F1E8",
    backgroundColor: "#0C1A26",
    borderWidth: 2,
  },
  depositInput: {
    borderColor: "#2AA7A1",
  },
  withdrawInput: {
    borderColor: "#D8A75F",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0E2030",
    borderWidth: 1,
    borderColor: "#D8A75F33",
    justifyContent: "center",
    alignItems: "center",
  },
  recentActivityContainer: {
    marginTop: 8,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F1E8",
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D8A75F33",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  depositIcon: {
    backgroundColor: "#2AA7A133",
  },
  withdrawIcon: {
    backgroundColor: "#D8A75F33",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#F5F1E8",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#C9B99A",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  depositAmount: {
    color: "#2AA7A1",
  },
  withdrawAmount: {
    color: "#FF6B6B",
  },
  noTransactionsText: {
    fontSize: 14,
    color: "#C9B99A",
    textAlign: "center",
    paddingVertical: 20,
  },
});
