import { Redirect, Stack } from "expo-router";
import AuthContext from "../../context/AuthContext";
import { useContext } from "react";

export default function StackLayout() {
  const { isAuthenticated } = useContext(AuthContext);
  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
