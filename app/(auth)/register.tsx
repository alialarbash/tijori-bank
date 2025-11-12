import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useContext, useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import * as ImagePicker from "expo-image-picker";
import { registerApi } from "../../api/auth";
import { storeToken, setRememberMe } from "../../api/storage";
import AuthContext from "../../context/AuthContext";
import { useRouter } from "expo-router";
import Svg, { Rect, Circle, Line, Path } from "react-native-svg";

// Small Vault Icon for Header
const SmallVaultIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <Rect
      x="6"
      y="6"
      width="20"
      height="20"
      rx="2"
      stroke="#D8A75F"
      strokeWidth="1.5"
    />
    <Circle cx="16" cy="16" r="6" stroke="#D8A75F" strokeWidth="1.5" />
    <Circle cx="16" cy="16" r="2" fill="#D8A75F" />
    <Line x1="22" y1="16" x2="25" y2="16" stroke="#D8A75F" strokeWidth="1.5" />
  </Svg>
);

// Camera Icon Component
const CameraIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke="#D8A75F"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke="#D8A75F" strokeWidth="2" />
  </Svg>
);

// Plus Icon Component
const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
      stroke="#0E2030"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      stroke="#0E2030"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Eye Icon Component - open eye means password is hidden, slashed eye means password is visible
const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {visible ? (
      // Slashed eye (password is visible)
      <>
        <Path
          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
          stroke="#D8A75F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Line
          x1="1"
          y1="1"
          x2="23"
          y2="23"
          stroke="#D8A75F"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ) : (
      // Open eye (password is hidden)
      <>
        <Path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="#D8A75F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="3" stroke="#D8A75F" strokeWidth="2" />
      </>
    )}
  </Svg>
);

const registerSchema = Yup.object().shape({
  username: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

const register = () => {
  const router = useRouter();
  const { setIsAuthenticated, setRememberMe: setRememberMeContext } =
    useContext(AuthContext);
  const [image, setImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const imageScaleAnim = useRef(new Animated.Value(1)).current;

  // Set rememberMe to true by default for register
  useEffect(() => {
    setRememberMeContext(true);
    setRememberMe(true);
  }, []);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: registerSchema,
    onSubmit: (values) => {
      if (!image) {
        setErrorMessage("Please upload a profile image");
        return;
      }
      mutate();
    },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["register"],
    mutationFn: () => {
      if (!image) {
        throw new Error("Profile image is required");
      }
      return registerApi(
        { username: formik.values.username, password: formik.values.password },
        image
      );
    },
    onSuccess: async (data) => {
      try {
        console.log("Registration successful:", data);

        // Store token first
        if (data?.token) {
          await storeToken(data.token);
        } else {
          console.error("No token in response:", data);
          setErrorMessage("Registration successful but no token received");
          return;
        }

        // Update rememberMe
        await setRememberMe(true);
        setRememberMeContext(true);

        // Update authentication state
        setIsAuthenticated(true);

        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          router.replace("/");
        }, 100);
      } catch (error) {
        console.error("Error in onSuccess:", error);
        setErrorMessage("An error occurred during registration");
      }
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";
      setErrorMessage(message);
      setIsAuthenticated(false);
    },
  });

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Permission to access camera roll is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1], // Square aspect for circular image
      quality: 0.8,
    });

    if (result.canceled) {
      setErrorMessage("Please select a profile image to continue");
      return;
    }

    if (!result.assets || !result.assets[0]) {
      setErrorMessage("No image was selected. Please try again.");
      return;
    }

    setImage(result.assets[0].uri);
    setErrorMessage("");

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
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleImagePress = () => {
    pickImage();
    // Bounce animation on press
    Animated.sequence([
      Animated.spring(imageScaleAnim, {
        toValue: 0.95,
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
  };

  const handleSubmit = () => {
    setErrorMessage("");

    // Check for image first
    if (!image) {
      setErrorMessage("Please upload a profile image");
      return;
    }

    // Validate form
    formik.validateForm().then((errors) => {
      if (Object.keys(errors).length === 0) {
        mutate();
      } else {
        // Show form validation errors
        if (formik.errors.username) {
          setErrorMessage(formik.errors.username);
        } else if (formik.errors.password) {
          setErrorMessage(formik.errors.password);
        } else if (formik.errors.confirmPassword) {
          setErrorMessage(formik.errors.confirmPassword);
        } else {
          setErrorMessage("Please fill in all fields correctly");
        }
      }
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1650728670975-062f36a97c1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLdXdhaXQlMjBoZXJpdGFnZSUyMGJ1aWxkaW5nfGVufDF8fHx8MTc2Mjc4NDI4NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SmallVaultIcon />
            <Text style={styles.logoText}>Tijori</Text>
          </View>
        </View>

        {/* Card Container */}
        <View style={styles.cardWrapper}>
          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.card}>
              {/* Profile Image Upload */}
              <View style={styles.profileImageContainer}>
                <Animated.View
                  style={[
                    styles.profileImageWrapper,
                    { transform: [{ scale: imageScaleAnim }] },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleImagePress}
                    style={styles.profileImageTouchable}
                    activeOpacity={0.8}
                  >
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <CameraIcon size={32} />
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.plusIconOverlay}>
                    <View style={styles.plusIconContainer}>
                      <PlusIcon size={14} />
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* Welcome Text */}
              <Text style={styles.welcomeText}>Create Your Tijori</Text>

              {/* Error Message */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form */}
              <View style={styles.form}>
                {/* Username Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={[
                      styles.input,
                      formik.touched.username &&
                        formik.errors.username &&
                        styles.inputError,
                      formik.values.username && styles.inputFocused,
                    ]}
                    placeholder="Choose a username"
                    placeholderTextColor="#C9B99A80"
                    value={formik.values.username}
                    onChangeText={(text) => {
                      formik.setFieldValue("username", text);
                      setErrorMessage("");
                    }}
                    onBlur={formik.handleBlur("username")}
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        formik.touched.password &&
                          formik.errors.password &&
                          styles.inputError,
                        formik.values.password && styles.inputFocused,
                      ]}
                      placeholder="Create a strong password"
                      placeholderTextColor="#C9B99A80"
                      value={formik.values.password}
                      onChangeText={(text) => {
                        formik.setFieldValue("password", text);
                        setErrorMessage("");
                      }}
                      onBlur={formik.handleBlur("password")}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButtonContainer}
                      activeOpacity={0.7}
                    >
                      <EyeIcon visible={showPassword} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        formik.touched.confirmPassword &&
                          formik.errors.confirmPassword &&
                          styles.inputError,
                        formik.values.confirmPassword && styles.inputFocused,
                      ]}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#C9B99A80"
                      value={formik.values.confirmPassword}
                      onChangeText={(text) => {
                        formik.setFieldValue("confirmPassword", text);
                        setErrorMessage("");
                      }}
                      onBlur={formik.handleBlur("confirmPassword")}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeButtonContainer}
                      activeOpacity={0.7}
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Create Account Button */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.createAccountButton,
                      isPending && styles.createAccountButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <ActivityIndicator color="#0C1A26" />
                    ) : (
                      <Text style={styles.createAccountButtonText}>
                        Create Account
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/login")}
            >
              Sign In
            </Text>
          </Text>
          <Text style={styles.securityText}>
            Your information is safe inside your Tijori
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1A26",
    position: "relative",
  },
  heroSection: {
    height: "35%",
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12, 26, 38, 0.55)",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    fontSize: 24,
    color: "#D8A75F",
    fontWeight: "600",
  },
  cardWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  cardContainer: {
    width: "100%",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  card: {
    backgroundColor: "#0E2030",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8A75F33",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileImageWrapper: {
    position: "relative",
    width: 120,
    height: 120,
  },
  profileImageTouchable: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#D8A75F",
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
  plusIconOverlay: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D8A75F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0E2030",
    zIndex: 10,
    elevation: 10,
  },
  plusIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 28,
    color: "#F5F1E8",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "600",
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
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#C9B99A",
  },
  input: {
    backgroundColor: "#0C1A26",
    borderWidth: 1,
    borderColor: "#D8A75F33",
    borderRadius: 12,
    padding: 16,
    color: "#F5F1E8",
    fontSize: 16,
  },
  inputFocused: {
    borderColor: "#D8A75F",
    shadowColor: "#D8A75F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButtonContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
  createAccountButton: {
    backgroundColor: "#D8A75F",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  createAccountButtonDisabled: {
    opacity: 0.7,
  },
  createAccountButtonText: {
    color: "#0C1A26",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  footerText: {
    fontSize: 14,
    color: "#C9B99A",
    textAlign: "center",
  },
  footerLink: {
    color: "#2AA7A1",
    fontWeight: "600",
  },
  securityText: {
    fontSize: 12,
    color: "#C9B99A80",
    textAlign: "center",
  },
});
