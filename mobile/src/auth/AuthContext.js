import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTenantInfo, getUserProfile, loginUser, setPresence } from "../api";
import { setUnauthorizedHandler } from "../api/client";
import { getDefaultTenantDomain } from "../config";
import { apiError } from "../utils";

const AuthContext = createContext(null);

async function persistSchoolDomain(domain, schoolName) {
  const next = (domain || "").trim();
  if (next) await AsyncStorage.setItem("schoolDomain", next);
  if (schoolName) await AsyncStorage.setItem("schoolName", String(schoolName));
}

async function loadSchoolLogo(domain) {
  const next = (domain || "").trim();
  if (!next) return null;
  try {
    const info = await getTenantInfo({ domain: next });
    const logo = info.data?.branding?.logo || null;
    if (logo) await AsyncStorage.setItem("schoolLogo", logo);
    else await AsyncStorage.removeItem("schoolLogo");
    return logo;
  } catch {
    return AsyncStorage.getItem("schoolLogo");
  }
}

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [schoolDomain, setSchoolDomain] = useState(null);
  const [schoolName, setSchoolName] = useState(null);
  const [schoolLogo, setSchoolLogo] = useState(null);

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
    await AsyncStorage.multiRemove(["token", "refreshToken", "user", "schoolLogo"]);
    setTokenState(null);
    setUserState(null);
    setSchoolLogo(null);
    // Keep schoolDomain so the next login still hits the right school if needed;
    // platform default is used when missing.
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUserState(null);
    });
    (async () => {
      try {
        const [savedToken, savedUser, savedDomain, savedSchoolName, savedLogo] = await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("schoolDomain"),
          AsyncStorage.getItem("schoolName"),
          AsyncStorage.getItem("schoolLogo"),
        ]);
        if (savedDomain) setSchoolDomain(savedDomain);
        if (savedSchoolName) setSchoolName(savedSchoolName);
        if (savedLogo) setSchoolLogo(savedLogo);
        if (savedToken) {
          setTokenState(savedToken);
          if (savedUser) setUserState(JSON.parse(savedUser));
          try {
            const res = await getUserProfile();
            await persistUser(res.data);
            if (res.data?.role !== "superadmin" && res.data?.school_domain) {
              await persistSchoolDomain(res.data.school_domain, res.data.school_name);
              setSchoolDomain(res.data.school_domain);
              if (res.data.school_name) setSchoolName(res.data.school_name);
              const logo = await loadSchoolLogo(res.data.school_domain);
              if (logo) setSchoolLogo(logo);
            } else {
              setSchoolLogo(null);
            }
          } catch {
            /* keep cached user until 401 handler */
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async ({ username, password }) => {
    // Authenticate on the platform host; school is resolved from the user account.
    await AsyncStorage.setItem("schoolDomain", getDefaultTenantDomain());
    const res = await loginUser({ username, password });
    const access = res.data?.access;
    const refresh = res.data?.refresh;
    if (!access) throw new Error("Login did not return an access token.");
    await AsyncStorage.setItem("token", access);
    if (refresh) await AsyncStorage.setItem("refreshToken", refresh);

    const detectedDomain = (res.data?.school_domain || "").trim();
    const detectedName = res.data?.school_name || null;
    if (detectedDomain) {
      await persistSchoolDomain(detectedDomain, detectedName);
      setSchoolDomain(detectedDomain);
      if (detectedName) setSchoolName(detectedName);
    }

    setTokenState(access);
    const profile = await getUserProfile();
    const profileDomain = (profile.data?.school_domain || detectedDomain || "").trim();
    const profileName = profile.data?.school_name || detectedName;
    if (profile.data?.role !== "superadmin" && profileDomain) {
      await persistSchoolDomain(profileDomain, profileName);
      setSchoolDomain(profileDomain);
      if (profileName) setSchoolName(profileName);
      const logo = await loadSchoolLogo(profileDomain);
      setSchoolLogo(logo);
    } else {
      setSchoolLogo(null);
    }
    await persistUser(profile.data);
    return profile.data;
  };

  const value = useMemo(
    () => ({
      ready,
      user,
      token,
      role: user?.role || "",
      schoolDomain,
      schoolName,
      schoolLogo,
      login,
      logout,
      setUser: persistUser,
      loginError: apiError,
    }),
    [ready, user, token, schoolDomain, schoolName, schoolLogo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
