export const darkColors = {
  bg: "#07111C",
  bg2: "#0C1A2A",
  card: "#122133",
  card2: "#173049",
  cardAlt: "#173049",
  line: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.08)",
  text: "#F8FAFC",
  muted: "#94A3B8",
  primary: "#F15A24",
  primary2: "#FF8C42",
  orange: "#F15A24",
  accent: "#FF8C42",
  navy: "#0F172A",
  navy2: "#132033",
  success: "#34D399",
  green: "#34D399",
  warn: "#FBBF24",
  yellow: "#FBBF24",
  danger: "#F87171",
  red: "#F87171",
  white: "#FFFFFF",
};

export const lightColors = {
  bg: "#F3F6FA",
  bg2: "#FFFFFF",
  card: "#FFFFFF",
  card2: "#EEF2F7",
  cardAlt: "#EEF2F7",
  line: "rgba(15,23,42,0.08)",
  border: "rgba(15,23,42,0.1)",
  text: "#0F172A",
  muted: "#64748B",
  primary: "#F15A24",
  primary2: "#E85A28",
  orange: "#F15A24",
  accent: "#E85A28",
  navy: "#E8EEF5",
  navy2: "#DDE5F0",
  success: "#059669",
  green: "#059669",
  warn: "#D97706",
  yellow: "#D97706",
  danger: "#DC2626",
  red: "#DC2626",
  white: "#FFFFFF",
};

/** @deprecated Prefer useTheme().colors — kept for modules that still import statically. */
export const colors = darkColors;

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 };
export const spacing = space;
export const radius = { sm: 10, md: 14, lg: 20 };

export function getColors(mode) {
  return mode === "light" ? lightColors : darkColors;
}

export function buildNavTheme(palette, isDark) {
  return {
    dark: isDark,
    colors: {
      primary: palette.primary,
      background: palette.bg,
      card: palette.bg2,
      text: palette.text,
      border: palette.border,
      notification: palette.primary,
    },
  };
}

export const navTheme = buildNavTheme(darkColors, true);
