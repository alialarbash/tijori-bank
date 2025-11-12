import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Animated,
} from "react-native";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllUsers } from "../../../../api/auth";
import { transferBalance } from "../../../../api/transactions";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

// Search Icon
const SearchIcon = ({ color = "#D8A75F" }: { color?: string }) => (
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

// Arrow Right Icon (Transfer)
const ArrowRightIcon = ({ color = "#F5F1E8" }: { color?: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="12"
      y1="5"
      x2="19"
      y2="12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="12"
      y1="19"
      x2="19"
      y2="12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Check Icon (Ok)
const CheckIcon = ({ color = "#F5F1E8" }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// X Icon (Close) - Larger and bolder
const XIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
      stroke="#C9B99A"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
      stroke="#C9B99A"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </Svg>
);

// Skeleton Loader Component
const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonCircle, { opacity }]} />
      <View style={styles.skeletonContent}>
        <Animated.View
          style={[styles.skeletonLine, { width: "60%", opacity }]}
        />
        <Animated.View
          style={[styles.skeletonLine, { width: "40%", marginTop: 8, opacity }]}
        />
      </View>
      <View style={styles.skeletonRight}>
        <Animated.View style={[styles.skeletonLine, { width: 80, opacity }]} />
        <Animated.View
          style={[styles.skeletonLine, { width: 60, marginTop: 8, opacity }]}
        />
      </View>
    </View>
  );
};

// Small Vault Icon for Empty State
const SmallVaultIcon = () => (
  <Svg width="64" height="64" viewBox="0 0 32 32" fill="none">
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

const ITEMS_PER_PAGE = 50;

const accounts = () => {
  const [search, setSearch] = useState<string>("");
  const [transferInputs, setTransferInputs] = useState<{
    [key: string]: { show: boolean; amount: string };
  }>({});
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [startIndex, setStartIndex] = useState<number>(0);
  const [endIndex, setEndIndex] = useState<number>(ITEMS_PER_PAGE);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;

    const searchLower = search.toLowerCase();
    return users.filter(
      (user: any) =>
        user.username?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower.replace("@", ""))
    );
  }, [users, search]);

  // Displayed users (pagination)
  const displayedUsers = useMemo(() => {
    if (!filteredUsers) return [];
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  // Reset pagination when search changes
  useEffect(() => {
    setStartIndex(0);
    setEndIndex(ITEMS_PER_PAGE);
  }, [search]);

  // Animation refs for list items
  const fadeAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const slideAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize animations for displayed users
  useEffect(() => {
    if (displayedUsers) {
      displayedUsers.forEach((user: any, index: number) => {
        const userId = user._id || user.id;
        if (!fadeAnims[userId]) {
          fadeAnims[userId] = new Animated.Value(0);
          slideAnims[userId] = new Animated.Value(20);
          scaleAnims[userId] = new Animated.Value(1);
        }
      });

      // Animate items with stagger
      displayedUsers.forEach((user: any, index: number) => {
        const userId = user._id || user.id;
        Animated.parallel([
          Animated.timing(fadeAnims[userId], {
            toValue: 1,
            duration: 300,
            delay: index * 40,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnims[userId], {
            toValue: 0,
            duration: 300,
            delay: index * 40,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [displayedUsers]);

  // Handle scroll to load more (when reaching bottom)
  const handleLoadMore = () => {
    if (filteredUsers && endIndex < filteredUsers.length) {
      // Add more items at the bottom
      const newEndIndex = Math.min(
        endIndex + ITEMS_PER_PAGE,
        filteredUsers.length
      );
      // Remove from top to keep only 50 items visible
      const newStartIndex = Math.max(0, newEndIndex - ITEMS_PER_PAGE);
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    }
  };

  // Handle scroll to load previous (when scrolling up near top)
  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const scrollThreshold = 200; // Load previous when 200px from top

    // Load previous items when scrolling up near the top
    if (scrollPosition < scrollThreshold && startIndex > 0) {
      // Add items at the top
      const newStartIndex = Math.max(0, startIndex - ITEMS_PER_PAGE);
      // Remove from bottom to keep only 50 items visible
      const newEndIndex = Math.min(
        filteredUsers?.length || ITEMS_PER_PAGE,
        startIndex + ITEMS_PER_PAGE
      );
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    }
  };

  const { mutate: transfer, isPending: isTransferring } = useMutation({
    mutationKey: ["transfer"],
    mutationFn: ({ value, username }: { value: number; username: string }) =>
      transferBalance(value, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Reset transfer input for all users
      setTransferInputs({});
      setErrorMessage("");
    },
    onError: (error: any) => {
      console.error("Transfer error:", error);
      setErrorMessage(
        error?.response?.data?.message || error.message || "Transfer failed"
      );
    },
  });

  const handleTransferPress = (userId: string) => {
    setTransferInputs((prev) => ({
      ...prev,
      [userId]: {
        show: !prev[userId]?.show,
        amount: prev[userId]?.amount || "",
      },
    }));
    setErrorMessage("");
  };

  const handleCloseTransfer = (userId: string) => {
    setTransferInputs((prev) => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
    setErrorMessage("");
  };

  const handleTransfer = (user: any) => {
    const userId = user._id || user.id;
    const amountValue = parseFloat(transferInputs[userId]?.amount || "0");

    if (!amountValue || amountValue <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    transfer({ value: amountValue, username: user.username });
  };

  const handleCardPress = (user: any) => {
    const userId = user._id || user.id;
    router.push(`/(accounts)/${userId}`);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getImageUri = (imagePath: string | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `https://react-bank-project.eapi.joincoded.com/${imagePath}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Accounts</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or @username..."
            placeholderTextColor="#C9B99A80"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Accounts List */}
      {isLoading ? (
        <FlatList
          data={Array.from({ length: 5 })}
          renderItem={() => <SkeletonCard />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={displayedUsers}
          renderItem={({ item: user }) => {
            const userId = user._id || user.id;
            const showInput = transferInputs[userId]?.show || false;
            const amountValue = transferInputs[userId]?.amount || "";
            const imageUri = getImageUri(user.image);

            return (
              <Animated.View
                style={[
                  styles.accountItemContainer,
                  {
                    opacity: fadeAnims[userId] || 1,
                    transform: [
                      { translateY: slideAnims[userId] || 0 },
                      { scale: scaleAnims[userId] || 1 },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.accountCard,
                    showInput && styles.accountCardConnected,
                  ]}
                  onPress={() => handleCardPress(user)}
                  activeOpacity={0.9}
                  onPressIn={() => {
                    if (scaleAnims[userId]) {
                      Animated.spring(scaleAnims[userId], {
                        toValue: 0.98,
                        useNativeDriver: true,
                      }).start();
                    }
                  }}
                  onPressOut={() => {
                    if (scaleAnims[userId]) {
                      Animated.spring(scaleAnims[userId], {
                        toValue: 1,
                        useNativeDriver: true,
                      }).start();
                    }
                  }}
                >
                  {/* Profile Image */}
                  <View style={styles.profileImageContainer}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Text style={styles.profileImagePlaceholderText}>
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.username || "Unknown User"}
                    </Text>
                    <Text style={styles.userUsername} numberOfLines={1}>
                      @{user.username || "unknown"}
                    </Text>
                  </View>

                  {/* Balance and Transfer Button */}
                  <View style={styles.balanceTransferContainer}>
                    <View style={styles.balanceContainer}>
                      <Text style={styles.balanceAmount}>
                        {formatAmount(user.balance || 0)}
                      </Text>
                      <View style={styles.currencyCapsule}>
                        <Text style={styles.currencyText}>KWD</Text>
                      </View>
                    </View>

                    {!showInput && (
                      <TouchableOpacity
                        style={styles.transferButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleTransferPress(userId);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.transferButtonText}>Transfer</Text>
                        <ArrowRightIcon />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Transfer Input - Outside the card */}
                {showInput && (
                  <View style={styles.transferInputWrapper}>
                    <View style={styles.transferInputRow}>
                      <TextInput
                        style={styles.transferInput}
                        placeholder="Enter amount"
                        placeholderTextColor="#C9B99A80"
                        value={amountValue}
                        onChangeText={(text) => {
                          setTransferInputs((prev) => ({
                            ...prev,
                            [userId]: {
                              show: true,
                              amount: text,
                            },
                          }));
                        }}
                        keyboardType="numeric"
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => handleCloseTransfer(userId)}
                      >
                        <XIcon />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.okButton}
                        onPress={() => handleTransfer(user)}
                        disabled={isTransferring}
                      >
                        <CheckIcon color="#F5F1E8" />
                        <Text style={styles.okButtonText}>Ok</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            );
          }}
          keyExtractor={(user: any) => user._id || user.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <SmallVaultIcon />
              <Text style={styles.emptyStateText}>No accounts found</Text>
              <Text style={styles.emptyStateSubtext}>
                {search
                  ? "Try adjusting your search"
                  : "No accounts available at the moment"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default accounts;

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
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F5F1E8",
    fontFamily: "Playfair Display",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E2030",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: "#F5F1E8",
    fontSize: 14,
    fontFamily: "Inter",
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#A63A2433",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A63A2466",
  },
  errorText: {
    color: "#F5F1E8",
    fontSize: 14,
    fontFamily: "Inter",
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E2030",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 16,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountCardConnected: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#D8A75F",
    marginRight: 16,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0C1A26",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlaceholderText: {
    color: "#D8A75F",
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "Playfair Display",
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F5F1E8",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: "#C9B99A",
    fontFamily: "Inter",
  },
  balanceTransferContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D8A75F",
    fontFamily: "IBM Plex Mono",
  },
  currencyCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8A75F",
    backgroundColor: "#D8A75F11",
  },
  currencyText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D8A75F",
    fontFamily: "IBM Plex Mono",
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2AA7A1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  transferButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5F1E8",
    fontFamily: "Inter",
  },
  accountItemContainer: {
    marginBottom: 16,
  },
  transferInputWrapper: {
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  transferInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0E2030",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D8A75F33",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transferInput: {
    flex: 1,
    backgroundColor: "#0C1A26",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    color: "#F5F1E8",
    fontSize: 14,
    fontFamily: "Inter",
  },
  closeButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  okButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2AA7A1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  okButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5F1E8",
    fontFamily: "Inter",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F5F1E8",
    fontFamily: "Playfair Display",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#C9B99A",
    fontFamily: "Inter",
    textAlign: "center",
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E2030",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 16,
    marginBottom: 16,
  },
  skeletonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D8A75F33",
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
    marginRight: 12,
  },
  skeletonRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: "#D8A75F33",
  },
});
