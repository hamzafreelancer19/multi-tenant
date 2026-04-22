import axios from "axios";
import { handleMockRequest } from "./mockData";
import { isDemoMode } from "../store/authStore";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically on every request
api.interceptors.request.use(
  async (config) => {
    // INTERCEPT IF DEMO MODE
    if (isDemoMode()) {
      const mockResult = await handleMockRequest(config);
      config.adapter = () => Promise.resolve({
        data: mockResult.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
      return config;
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally – clear token & redirect to landing if not already there
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Only redirect if we aren't already on the landing page to avoid loops
      // AND don't redirect if it's the login request itself
      const isLoginRequest = error.config?.url?.includes("token/");
      if (window.location.pathname !== "/" && !isLoginRequest) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
