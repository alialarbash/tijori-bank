import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import React, { useContext, useEffect, useState, useRef } from "react";
import AuthContext from "../../../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { me, updateUser } from "../../../api/auth";
import * as ImagePicker from "expo-image-picker";
import { deleteToken, setRememberMe } from "../../../api/storage";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Line } from "react-native-svg";

// Settings Icon
const SettingsIcon = ({ color = "#D8A75F" }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Path
      d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Pencil Icon
const PencilIcon = ({ color = "#F5F1E8" }: { color?: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Sign Out Icon
const SignOutIcon = ({ color = "#D8A75F" }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="16"
      y1="17"
      x2="21"
      y2="12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="21"
      y1="12"
      x2="16"
      y2="7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const profile = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setIsAuthenticated } = useContext(AuthContext);
  const { setRememberMe: setRememberMeContext } = useContext(AuthContext);
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: me,
  });

  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageScaleAnim] = useState(new Animated.Value(1));
  const [cardFadeAnim] = useState(new Animated.Value(0));
  const [cardSlideAnim] = useState(new Animated.Value(50));

  const { mutate: updateImage, isPending: isUpdating } = useMutation({
    mutationKey: ["updateImage"],
    mutationFn: (image: string) => updateUser(image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setOriginalImage(selectedImage);
      setSelectedImage(null);
    },
    onError: (error: any) => {
      console.error("Update error:", error);
    },
  });

  useEffect(() => {
    if (data?.image) {
      const imagePath = data.image;
      const baseURL = "https://react-bank-project.eapi.joincoded.com";
      const fullImageUrl = imagePath.startsWith("http")
        ? imagePath
        : `${baseURL}/${imagePath}`;
      setImage(fullImageUrl);
      setOriginalImage(fullImageUrl);
    }
  }, [data]);

  // Card entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImageUri = result.assets[0].uri;
      setSelectedImage(newImageUri);

      // Bounce animation on image selection
      Animated.sequence([
        Animated.spring(imageScaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 100,
          friction: 3,
        }),
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 3,
        }),
      ]).start();
    }
  };

  const handleSave = () => {
    if (selectedImage) {
      updateImage(selectedImage);
    }
  };

  const handleSignOut = async () => {
    deleteToken();
    setIsAuthenticated(false);
    setRememberMeContext(false);
    await setRememberMe(false);
    router.replace("/(auth)/login");
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const displayImage = selectedImage || image;
  const hasImageChanged =
    selectedImage !== null && selectedImage !== originalImage;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D8A75F" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <SettingsIcon />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <Animated.View
        style={[
          styles.profileCard,
          {
            opacity: cardFadeAnim,
            transform: [
              {
                translateY: cardSlideAnim,
              },
            ],
          },
        ]}
      >
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Animated.View
            style={[
              styles.profileImageWrapper,
              { transform: [{ scale: imageScaleAnim }] },
            ]}
          >
            {displayImage ? (
              <Image
                source={{ uri: displayImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {data?.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.pencilButton}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <View style={styles.pencilButtonInner}>
                <PencilIcon />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Username */}
        <Text style={styles.username}>{data?.username || "User"}</Text>

        {/* Balance Label */}
        <Text style={styles.balanceLabel}>My Tijori Balance</Text>

        {/* Balance Amount */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>
            {formatAmount(data?.balance || 0)}
          </Text>
          <View style={styles.currencyCapsule}>
            <Text style={styles.currencyText}>KWD</Text>
          </View>
        </View>

        {/* Save Button (only shown when image is changed) */}
        {hasImageChanged && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#0C1A26" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <SignOutIcon />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1A26",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0C1A26",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F5F1E8",
    fontFamily: "Playfair Display",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    backgroundColor: "#0E2030",
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#0E2030",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 32,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImageContainer: {
    marginBottom: 24,
    position: "relative",
  },
  profileImageWrapper: {
    position: "relative",
    width: 140,
    height: 140,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#D8A75F",
  },
  profileImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#D8A75F",
    backgroundColor: "#0C1A26",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#D8A75F",
  },
  pencilButton: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2AA7A1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0E2030",
    zIndex: 10,
    elevation: 10,
  },
  pencilButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F5F1E8",
    marginBottom: 8,
    fontFamily: "Playfair Display",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#C9B99A",
    marginBottom: 12,
    fontFamily: "Inter",
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
    backgroundColor: "#C9B99A33",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8A75F33",
  },
  currencyText: {
    fontSize: 12,
    color: "#F5F1E8",
    fontWeight: "600",
    fontFamily: "Inter",
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#D8A75F",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#0C1A26",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8A75F",
    backgroundColor: "transparent",
  },
  signOutText: {
    color: "#D8A75F",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter",
  },
});
