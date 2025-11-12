import { StyleSheet } from "react-native";
import React from "react";
import { Stack, Tabs } from "expo-router";

const TabLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="accounts"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[userId]"
        options={{
          title: "User Details",
        }}
      />
    </Stack>
  );
};

export default TabLayout;
