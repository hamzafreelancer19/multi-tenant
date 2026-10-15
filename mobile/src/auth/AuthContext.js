import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile, loginUser, setPresence } from "../api";
import { setUnauthorizedHandler } from "../api/client";
import { getDefaultTenantDomain } from "../config";
import { apiError } from "../utils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);

  const persistUser = async (next) => {
    setUserState(next);
    if (next) await AsyncStorage.setItem("user", JSON.stringify(next));
    else await AsyncStorage.removeItem("user");
  };

  const logout = async () => {
    try {
      const t = await AsyncStorage.getItem("token");
      if (t) await setPresence(false);
    } catch {
      /* still clear */
    }
    await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
    setTokenState(null);
    setUserState(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUserState(null);
    });
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("user"),
        ]);
        if (savedToken) {
          setTokenState(savedToken);
          if (savedUser) setUserState(JSON.parse(savedUser));
          try {
            const res = await getUserProfile();
            await persistUser(res.data);
          } catch {
            /* keep cached user until 401 handler */
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async ({ username, password, schoolDomain }) => {
    const domain = (schoolDomain || "").trim() || getDefaultTenantDomain();
    await AsyncStorage.setItem("schoolDomain", domain);
    const res = await loginUser({ username, password });
    const access = res.data?.access;
    const refresh = res.data?.refresh;
    if (!access) throw new Error("Login did not return an access token.");
    await AsyncStorage.setItem("token", access);
    if (refresh) await AsyncStorage.setItem("refreshToken", refresh);
    if (res.data?.school_domain) {
      await AsyncStorage.setItem("schoolDomain", res.data.school_domain);
    }
    setTokenState(access);
    const profile = await getUserProfile();
    await persistUser(profile.data);
    return profile.data;
  };

  const value = useMemo(
    () => ({
      ready,
      user,
      token,
      role: user?.role || "",
      login,
      logout,
      setUser: persistUser,
      loginError: apiError,
    }),
    [ready, user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
