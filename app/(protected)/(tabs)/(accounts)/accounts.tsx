import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, registerApi } from "../../../../api/auth";
import { transferBalance } from "../../../../api/transactions";
import { useRouter } from "expo-router";

const accounts = () => {
  const [search, setSearch] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });
  const { mutate: transfer } = useMutation({
    mutationKey: ["transfer"],
    mutationFn: ({ value, username }: { value: number; username: string }) =>
      transferBalance(value, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setAmount(0); // Reset amount after successful transfer
    },
    onError: (error: any) => {
      // Log the full error to see what's happening
      console.error("Transfer error:", error);

      // Show user-friendly error message
      alert(error.message);
    },
  });
  console.log(users);
  // const {mutate: addUser} = useMutation({
  //   mutationKey: ["addUser"],
  //   mutationFn: (user: UserInfo) => registerApi(user),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["users"] });
  //   },
  // });
  return (
    <ScrollView>
      <TextInput
        placeholder="search by name"
        onChangeText={(text) => setSearch(text)}
      />
      {users?.map((user: any) => (
        <View key={user.id}>
          <TouchableOpacity
            onPress={() => router.push(`/(accounts)/${user._id}`)}
          >
            <Text>{user.username}</Text>
            <Text>{user.balance}</Text>
          </TouchableOpacity>
          <TextInput
            placeholder="amount"
            onChangeText={(text) => setAmount(Number(text))}
            value={amount.toString()}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: "#000",
              padding: 10,
              borderRadius: 10,
            }}
          />
          <TouchableOpacity
            onPress={() => transfer({ value: amount, username: user.username })}
          >
            <Text>Transfer</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default accounts;

const styles = StyleSheet.create({});
