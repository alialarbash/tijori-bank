import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import AuthContext from "../context/AuthContext";
import { getToken, getRememberMe } from "../api/storage";

export default function RootLayout() {
  const queryClient = new QueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const shouldRemember = await getRememberMe();
      setRememberMe(shouldRemember);

      if (shouldRemember) {
        const token = await getToken();
        if (token) {
          setIsAuthenticated(true);
        }
      }
    };
    checkAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
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
