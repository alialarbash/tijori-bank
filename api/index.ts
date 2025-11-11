import axios from "axios";
import { getToken } from "./storage";

const instance = axios.create({
  baseURL: "https://react-bank-project.eapi.joincoded.com",
});

instance.interceptors.request.use(async (request) => {
  const token = await getToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

export default instance;
