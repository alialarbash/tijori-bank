import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import React, { useContext, useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { loginApi } from "../../api/auth";
import { storeToken, setRememberMe, getRememberMe } from "../../api/storage";
import AuthContext from "../../context/AuthContext";
import { useRouter } from "expo-router";
import Svg, { Rect, Circle, Line, Path } from "react-native-svg";

// Vault Icon Component
const VaultIcon = ({ size = 48 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect
      x="6"
      y="8"
      width="36"
      height="36"
      rx="2"
      stroke="#D8A75F"
      strokeWidth="1.5"
    />
    <Circle
      cx="24"
      cy="26"
      r="10"
      stroke="#D8A75F"
      strokeWidth="1.5"
      fill="none"
    />
    <Circle
      cx="24"
      cy="26"
      r="6"
      stroke="#D8A75F"
      strokeWidth="1.5"
      fill="none"
    />
    <Circle cx="24" cy="26" r="2" fill="#D8A75F" />
    <Line
      x1="34"
      y1="26"
      x2="39"
      y2="26"
      stroke="#D8A75F"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Circle cx="39" cy="26" r="1.5" fill="#D8A75F" />
    <Path
      d="M10 12 L10 10 L12 10"
      stroke="#D8A75F"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M38 12 L38 10 L36 10"
      stroke="#D8A75F"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 40 L10 42 L12 42"
      stroke="#D8A75F"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M38 40 L38 42 L36 42"
      stroke="#D8A75F"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="24" y1="16" x2="24" y2="18" stroke="#D8A75F" strokeWidth="1" />
    <Line x1="24" y1="34" x2="24" y2="36" stroke="#D8A75F" strokeWidth="1" />
    <Line x1="14" y1="26" x2="16" y2="26" stroke="#D8A75F" strokeWidth="1" />
  </Svg>
);

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

const loginSchema = Yup.object().shape({
  username: Yup.string().required("Email or phone is required"),
  password: Yup.string().required("Password is required"),
});

const login = () => {
  const router = useRouter();
  const { setIsAuthenticated, setRememberMe: setRememberMeContext } =
    useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false); // false = password hidden (open eye), true = password visible (slashed eye)
  const [rememberMe, setRememberMe] = useState(false); // Local state for checkbox
  const [errorMessage, setErrorMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      mutate();
    },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: () =>
      loginApi({
        username: formik.values.username,
        password: formik.values.password,
      }),
    onSuccess: async (data) => {
      // Always store token for current session
      await storeToken(data.token);

      // Update rememberMe preference in storage and context
      await setRememberMe(rememberMe);
      setRememberMeContext(rememberMe); // Update context state

      setIsAuthenticated(true);
      router.push("/");
    },
    onError: (error: any) => {
      console.log(error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid credentials. Please try again.";
      setErrorMessage(message);
      setIsAuthenticated(false);
    },
  });

  useEffect(() => {
    // Initialize rememberMe from storage
    const initRememberMe = async () => {
      const savedRememberMe = await getRememberMe();
      setRememberMe(savedRememberMe);
    };
    initRememberMe();

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

  const handleSubmit = () => {
    setErrorMessage("");
    formik.validateForm().then((errors) => {
      if (Object.keys(errors).length === 0) {
        mutate();
      } else {
        if (!formik.values.username) {
          setErrorMessage("Email or phone is required");
        } else if (!formik.values.password) {
          setErrorMessage("Password is required");
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Hero Image Section */}
      <View style={styles.heroSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1650563401244-12028cd7ee4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLdXdhaXQlMjBoZXJpdGFnZSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NjI3NzI0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
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
            {/* Vault Icon */}
            <View style={styles.vaultIconContainer}>
              <VaultIcon size={48} />
            </View>

            {/* Welcome Text */}
            <Text style={styles.welcomeText}>Welcome to Tijori</Text>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {/* Email/Phone Input */}
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
                  placeholder="Enter your username"
                  placeholderTextColor="#C9B99A80"
                  value={formik.values.username}
                  onChangeText={(text) => {
                    formik.setFieldValue("username", text);
                    setErrorMessage("");
                  }}
                  onBlur={formik.handleBlur("username")}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                    placeholder="Enter your password"
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

              {/* Remember Me */}
              <View style={styles.rememberMeContainer}>
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  style={styles.checkboxContainer}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.signInButton,
                    isPending && styles.signInButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={isPending}
                >
                  {isPending ? (
                    <ActivityIndicator color="#0C1A26" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In</Text>
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
          New to Tijori?{" "}
          <Text
            style={styles.footerLink}
            onPress={() => router.push("/register")}
          >
            Create account
          </Text>
        </Text>
        <Text style={styles.securityText}>
          Protected by enterprise-grade security
        </Text>
      </View>
    </View>
  );
};

export default login;

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
  vaultIconContainer: {
    alignItems: "center",
    marginBottom: 16,
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
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#D8A75F",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#D8A75F",
  },
  checkmark: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#0C1A26",
    fontSize: 12,
    fontWeight: "bold",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#F5F1E8",
  },
  signInButton: {
    backgroundColor: "#D8A75F",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: "#0C1A26",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 60,
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
