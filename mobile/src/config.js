import Constants from "expo-constants";
import { Platform } from "react-native";

const RAILWAY = "https://multi-tenant-production-a3db.up.railway.app/api";

export function getDefaultTenantDomain() {
  return (process.env.EXPO_PUBLIC_TENANT_DOMAIN || "localhost").trim();
}

export function getApiOrigin() {
  const extra = Constants.expoConfig?.extra || {};
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || "").trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv.replace(/\/api$/, "");
  }
  if (extra.useRailway) return RAILWAY.replace(/\/api$/, "");

  const hostUri = Constants.expoConfig?.hostUri || "";
  const fromMetro = String(hostUri).match(/(\d+\.\d+\.\d+\.\d+)/);
  if (fromMetro) return `http://${fromMetro[1]}:8000`;

  // Android emulator reaches the host machine at 10.0.2.2, not localhost.
  if (Platform.OS === "android") return "http://10.0.2.2:8000";
  return "http://127.0.0.1:8000";
}

export function getApiBaseUrl() {
  const extra = Constants.expoConfig?.extra || {};
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv.endsWith("/api") ? fromEnv : `${fromEnv}/api`;
  return `${getApiOrigin()}/api`;
}

export const API_ORIGIN = getApiOrigin();
export const API_BASE = getApiBaseUrl();
export const RAILWAY_API = RAILWAY;
