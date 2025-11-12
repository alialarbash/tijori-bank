import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserById } from "../../../../api/auth";
import { useLocalSearchParams } from "expo-router";

const userId = () => {
  const { userId } = useLocalSearchParams();
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId as string),
  });
  return (
    <View>
      <Text>{user?.username}</Text>
      <Text>{user?.balance}</Text>
    </View>
  );
};

export default userId;

const styles = StyleSheet.create({});
