import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildNavTheme, getColors } from "../theme";

const STORAGE_KEY = "appTheme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") setModeState(saved);
      })
      .finally(() => setReady(true));
  }, []);

  const setMode = useCallback(async (next) => {
    const value = next === "light" ? "light" : "dark";
    setModeState(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const colors = useMemo(() => getColors(mode), [mode]);
  const isDark = mode === "dark";
  const navTheme = useMemo(() => buildNavTheme(colors, isDark), [colors, isDark]);

  const value = useMemo(
    () => ({
      ready,
      mode,
      isDark,
      colors,
      navTheme,
      setMode,
      toggleTheme,
    }),
    [ready, mode, isDark, colors, navTheme, setMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
