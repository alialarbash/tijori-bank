import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../../../../api/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

// Small Vault Icon
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

// Arrow Left Icon (Back)
const ArrowLeftIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Line
      x1="19"
      y1="12"
      x2="5"
      y2="12"
      stroke="#D8A75F"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="12"
      y1="5"
      x2="5"
      y2="12"
      stroke="#D8A75F"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="12"
      y1="19"
      x2="5"
      y2="12"
      stroke="#D8A75F"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Corner Decoration
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

const userId = () => {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Handle userId as array or string
  const userIdString = Array.isArray(userId) ? userId[0] : userId;

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user", userIdString],
    queryFn: () => getUserById(userIdString as string),
    enabled: !!userIdString,
  });

  useEffect(() => {
    if (user) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user]);

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D8A75F" />
          <Text style={styles.loadingText}>Loading account...</Text>
        </View>
      </View>
    );
  }

  if (isError || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Account not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeftIcon />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const imageUri = getImageUri(user.image);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeftIcon />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.cornerDecorationContainer}>
              <CornerDecoration />
            </View>

            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profileImage} />
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
              <Text style={styles.userName}>
                {user.username || "Unknown User"}
              </Text>
              <Text style={styles.userUsername}>
                @{user.username || "unknown"}
              </Text>
            </View>

            {/* Balance Section */}
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Account Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>
                  {formatAmount(user.balance || 0)}
                </Text>
                <View style={styles.currencyCapsule}>
                  <Text style={styles.currencyText}>KWD</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Account Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>{user.username || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account ID</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {user._id || user.id || "N/A"}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default userId;

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F1E8",
    fontFamily: "Playfair Display",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#D8A75F",
    fontSize: 16,
    fontFamily: "Inter",
    marginLeft: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  content: {
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "#0E2030",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  cornerDecorationContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    opacity: 0.3,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#D8A75F",
    marginBottom: 20,
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
    fontSize: 48,
    fontWeight: "600",
    fontFamily: "Playfair Display",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F5F1E8",
    fontFamily: "Playfair Display",
    marginBottom: 8,
  },
  userUsername: {
    fontSize: 16,
    color: "#C9B99A",
    fontFamily: "Inter",
  },
  balanceSection: {
    alignItems: "center",
    width: "100%",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#C9B99A",
    fontFamily: "Inter",
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#D8A75F",
    fontFamily: "IBM Plex Mono",
  },
  currencyCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8A75F",
    backgroundColor: "#D8A75F11",
  },
  currencyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D8A75F",
    fontFamily: "IBM Plex Mono",
  },
  detailsCard: {
    backgroundColor: "#0E2030",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5F1E8",
    fontFamily: "Playfair Display",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D8A75F15",
  },
  detailLabel: {
    fontSize: 14,
    color: "#C9B99A",
    fontFamily: "Inter",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5F1E8",
    fontFamily: "Inter",
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
});
