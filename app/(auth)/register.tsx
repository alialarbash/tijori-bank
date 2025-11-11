import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";

const register = () => {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  return (
    <View>
      <View></View>
      <View>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={pickImage}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: 150, height: 150, borderRadius: 100 }}
            />
          ) : (
            <Text style={{ color: "#000", fontSize: 16 }}>
              Upload Profile Image
            </Text>
          )}
        </TouchableOpacity>
        <TextInput
          placeholder="Name"
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#000",
            padding: 10,
            borderRadius: 10,
          }}
        />

        <TextInput
          placeholder="Password"
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#000",
            padding: 10,
            borderRadius: 10,
          }}
        />
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => {}}>
          <Text> Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default register;

const styles = StyleSheet.create({});
