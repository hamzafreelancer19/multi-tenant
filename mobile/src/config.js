import Constants from "expo-constants";
import { Platform } from "react-native";

const RAILWAY = "https://multi-tenant-production.up.railway.app/api";

/** Platform host used before login; school domain is set from the token response. */
export function getDefaultTenantDomain() {
  const extra = Constants.expoConfig?.extra || {};
  return (
    process.env.EXPO_PUBLIC_TENANT_DOMAIN ||
    extra.tenantDomain ||
    "localhost"
  )
    .toString()
    .trim();
}

/** True when host is the shared Classora platform (not a school subdomain). */
export function isPlatformTenantDomain(domain) {
  const host = String(domain || "")
    .trim()
    .toLowerCase()
    .split(":")[0];
  return !host || host === "localhost" || host === "127.0.0.1";
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
