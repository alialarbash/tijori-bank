import UserInfo from "../types/UserInfo";
import instance from ".";

const login = async (userInfo: UserInfo) => {
  const { data } = await instance.post(
    "/mini-project/api/auth/login",
    userInfo
  );
  return data;
};

const register = async (userInfo: UserInfo, image: string) => {
  const formData = new FormData();
  formData.append("username", userInfo.username);
  formData.append("password", userInfo.password);
  formData.append("image", {
    uri: image,
    name: "image",
    type: "image/jpeg",
  } as any);
  const { data } = await instance.post(
    "/mini-project/api/auth/register",
    formData
  );
  return data;
};

const me = async () => {
  const { data } = await instance.get("/mini-project/api/auth/me");
  return data;
};

const getAllUsers = async () => {
  const { data } = await instance.get("/mini-project/api/auth/users");
  return data;
};
const getUserById = async (userId: string) => {
  const { data } = await instance.get(`/mini-project/api/auth/user/${userId}`);
  return data;
};
const updateUser = async (image: string) => {
  const formData = new FormData();
  formData.append("image", {
    uri: image,
    name: "image",
    type: "image/jpeg",
  } as any);

  const { data } = await instance.put(
    `/mini-project/api/auth/profile`,
    formData
  );
  return data;
};

export { login, register, me, getAllUsers, getUserById, updateUser };
