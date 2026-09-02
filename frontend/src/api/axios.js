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

    const hostname = window.location.hostname.toLowerCase();
    const isPlatformHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app");
    const storedDomain = localStorage.getItem("schoolDomain");

    // On a real school host, always use that host so the public landing resolves.
    // On the platform host, keep stored school domain for dashboard API scoping.
    config.headers["X-Tenant-Domain"] = isPlatformHost
      ? (storedDomain || hostname)
      : hostname;

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally – attempt refresh OR redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 503 && error.response?.data?.code === "maintenance") {
      const url = originalRequest?.url || "";
      const isPublicAuth =
        (url.includes("token/") && !url.includes("refresh")) ||
        url.includes("auth/google") ||
        url.includes("signup") ||
        url.includes("platform/status");
      if (!isPublicAuth) {
        let role = "";
        try {
          role = JSON.parse(localStorage.getItem("user") || "{}")?.role || "";
        } catch {
          role = "";
        }
        if (role !== "superadmin") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          const path = window.location.pathname;
          if (path !== "/" && path !== "/login" && path !== "/signup") {
            window.location.href = "/login?maintenance=1";
          }
        }
      }
      return Promise.reject(error);
    }

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
