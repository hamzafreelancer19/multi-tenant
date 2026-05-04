import axios from "axios";
import { handleMockRequest } from "./mockData";
import { isDemoMode } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
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
    
    // 1. Priority: Domain from localStorage (for single-domain testing like Vercel)
    const storedDomain = localStorage.getItem("schoolDomain");
    
    // 2. Fallback: Actual hostname (for production with subdomains)
    config.headers["X-Tenant-Domain"] = storedDomain || window.location.hostname;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally – attempt refresh OR redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginRequest = originalRequest.url?.includes("token/");
      
      // If it's not a login request, try to refresh
      if (!isLoginRequest) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          try {
            // Attempt to get a new access token
            const res = await axios.post("/api/token/refresh/", { refresh: refreshToken });
            const { access } = res.data;

            if (access) {
              localStorage.setItem("token", access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout and redirect
            console.error("Token refresh failed:", refreshError);
          }
        }
      }

      // If refresh failed or no refresh token, logout and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      
      if (window.location.pathname !== "/" && !isLoginRequest) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
