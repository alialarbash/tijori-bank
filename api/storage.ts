import AsyncStorage from "@react-native-async-storage/async-storage";

const storeToken = async (value: string) => {
  try {
    await AsyncStorage.setItem("token", value);
  } catch (error) {
    console.log(error);
  }
};

const getToken = async () => {
  try {
    return await AsyncStorage.getItem("token");
  } catch (error) {
    console.log(error);
  }
};

const deleteToken = async () => {
  try {
    await AsyncStorage.removeItem("token");
  } catch (error) {
    console.log(error);
  }
};

const getRememberMe = async () => {
  try {
    const value = await AsyncStorage.getItem("rememberMe");
    return value === "true";
  } catch (error) {
    console.log(error);
    return false;
  }
};

const setRememberMe = async (value: boolean) => {
  try {
    await AsyncStorage.setItem("rememberMe", value.toString());
  } catch (error) {
    console.log(error);
  }
};

export { storeToken, getToken, deleteToken, getRememberMe, setRememberMe };
