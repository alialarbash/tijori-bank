import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import AuthContext from "../context/AuthContext";
import { getToken, getRememberMe, deleteToken } from "../api/storage";

export default function RootLayout() {
  const queryClient = new QueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize rememberMe from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const shouldRemember = await getRememberMe();
      setRememberMe(shouldRemember);
      setIsInitialized(true);

      if (shouldRemember) {
        // Only authenticate if rememberMe is true AND token exists
        const token = await getToken();
        if (token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        // If rememberMe is false, clear authentication and token
        setIsAuthenticated(false);
        await deleteToken();
      }
    };
    initializeAuth();
  }, []);

  // React to rememberMe changes from context (after initialization)
  useEffect(() => {
    if (!isInitialized) return; // Skip on initial mount

    const checkAuth = async () => {
      if (rememberMe) {
        // Only authenticate if rememberMe is true AND token exists
        const token = await getToken();
        if (token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        // If rememberMe is false, clear authentication and token
        setIsAuthenticated(false);
        await deleteToken();
      }
    };
    checkAuth();
  }, [rememberMe, isInitialized]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#0C1A26"
        translucent={false}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider
            value={{
              isAuthenticated,
              setIsAuthenticated,
              rememberMe,
              setRememberMe,
            }}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(protected)" />
              <Stack.Screen name="(auth)" />
            </Stack>
          </AuthContext.Provider>
        </QueryClientProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
