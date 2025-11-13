import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { Redirect, Stack } from "expo-router";
import AuthContext from "../../context/AuthContext";

const ProtextedLayout = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Redirect href="/login/" />;
  }
  return (
    <Stack>
      <Stack.Screen
        name="video-intro"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ProtextedLayout;
