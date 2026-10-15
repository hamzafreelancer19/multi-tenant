import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, getDefaultTenantDomain } from "../config";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 25000,
});

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const storedDomain = await AsyncStorage.getItem("schoolDomain");
  config.headers["X-Tenant-Domain"] = storedDomain || getDefaultTenantDomain();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || "";

    if (status === 401 && !originalRequest._retry) {
      const isLogin = url.includes("token/") && !url.includes("refresh");
      if (!isLogin) {
        originalRequest._retry = true;
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            const refreshUrl = `${String(api.defaults.baseURL || "").replace(/\/$/, "")}/token/refresh/`;
            const res = await axios.post(refreshUrl, { refresh: refreshToken });
            const access = res.data?.access;
            if (access) {
              await AsyncStorage.setItem("token", access);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return api(originalRequest);
            }
          } catch {
            /* fall through to logout */
          }
        }
        await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
        if (unauthorizedHandler) unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
