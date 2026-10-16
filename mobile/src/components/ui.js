import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../api";
import { rootNavigate } from "../navigation/rootNav";
import { asList, badgeTone } from "../utils";

function useUiStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

function schoolInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function screenForNotification(note) {
  const path = String(note?.link_path || "").toLowerCase();
  const msg = String(note?.message || "").toLowerCase();
  if (path.includes("admission") || path.includes("enrollment") || msg.includes("admission") || msg.includes("enrollment")) {
    return "Enrollments";
  }
  const routes = [
    ["/parent/attendance", "ParentAttendance"],
    ["/parent/fees", "ParentFees"],
    ["/parent/exams", "ParentExams"],
    ["/parent/homework", "ParentHomework"],
    ["/parent/timetable", "ParentTimetable"],
    ["/parent/notices", "ParentNotices"],
    ["/parent/library", "ParentLibrary"],
    ["/parent/profile", "ParentProfile"],
    ["/platform-settings", "PlatformSettings"],
    ["/notices", "Notices"],
    ["/fees", "Fees"],
    ["/exams", "Exams"],
    ["/assignments", "Assignments"],
    ["/timetable", "Timetable"],
    ["/attendance", "Attendance"],
    ["/students", "Students"],
    ["/teachers", "Teachers"],
    ["/classes", "Classes"],
    ["/chat", "Chat"],
    ["/library", "Library"],
    ["/staff", "Staff"],
    ["/inventory", "Inventory"],
    ["/subscription", "Subscription"],
    ["/settings", "Settings"],
    ["/schools", "Schools"],
    ["/plans", "Plans"],
    ["/users", "PlatformUsers"],
  ];
  const match = routes.find(([prefix]) => path.includes(prefix));
  return match ? match[1] : null;
}

function AppHeader() {
  const navigation = useNavigation();
  const { user, role, schoolName, schoolLogo } = useAuth();
  const { colors } = useTheme();
  const styles = useUiStyles();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const name = role === "superadmin" ? "Classora" : (schoolName || user?.school_name || "Classora");
  const showLogo = role !== "superadmin" && !!(schoolName || user?.school_name);
  const navState = navigation.getState?.();
  const canGoBack = navState?.type === "stack" && navigation.canGoBack();

  const loadNotes = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotes(asList(res.data));
    } catch {
      setNotes([]);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadNotes();
    const timer = setInterval(loadNotes, 20000);
    return () => clearInterval(timer);
  }, [loadNotes]));

  const openNote = async (note) => {
    setOpen(false);
    try {
      await markNotificationAsRead(note.id);
    } catch {
      /* still leave the list */
    }
    setNotes((prev) => prev.filter((row) => row.id !== note.id));
    const screen = screenForNotification(note);
    if (screen) rootNavigate(screen);
  };

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotes([]);
    } catch {
      /* keep the list */
    }
  };

  return (
    <View style={styles.appHeader}>
      {canGoBack ? (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerIconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      ) : null}
      {showLogo ? (
        schoolLogo ? (
          <Image source={{ uri: schoolLogo }} style={styles.schoolMarkImg} />
        ) : (
          <View style={[styles.schoolMarkFallback, { backgroundColor: colors.primary }]}>
            <Text style={styles.schoolMarkInitials}>{schoolInitials(name)}</Text>
          </View>
        )
      ) : null}
      <Text style={styles.schoolMarkName} numberOfLines={1}>{name}</Text>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} style={styles.headerIconBtn}>
        <Ionicons name="notifications-outline" size={22} color={colors.text} />
        {notes.length > 0 ? (
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>{notes.length > 9 ? "9+" : notes.length}</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.notifBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.notifSheet}>
            <View style={styles.notifHead}>
              <Text style={styles.notifTitle}>Notifications</Text>
              {notes.length > 0 ? (
                <Pressable onPress={markAll}>
                  <Text style={styles.link}>Mark all read</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView style={styles.notifList} contentContainerStyle={{ paddingBottom: 8 }}>
              {notes.length ? notes.map((note) => (
                <Pressable key={note.id} onPress={() => openNote(note)} style={styles.notifRow}>
                  <Ionicons name="notifications" size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifMsg}>{note.message}</Text>
                    {!!note.created_at && (
                      <Text style={styles.statDesc}>
                        {new Date(note.created_at).toLocaleString("en-PK", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )) : (
                <Text style={styles.notifEmpty}>All caught up</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function Screen({ children, onRefresh, refreshing, title, subtitle, right, kicker }) {
  const { colors } = useTheme();
  const styles = useUiStyles();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        {title ? <Hero kicker={kicker} title={title} subtitle={subtitle} right={right} /> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Hero({ kicker, title, subtitle, right, compact }) {
  const styles = useUiStyles();
  return (
    <View style={[styles.hero, compact && styles.heroCompact]}>
      <View style={{ flex: 1 }}>
        {!!kicker && <Text style={[styles.kicker, compact && styles.kickerCompact]}>{kicker}</Text>}
        <Text style={compact ? styles.hCompact : styles.h1}>{title}</Text>
        {!!subtitle && <Text style={[styles.sub, compact && styles.subCompact]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function StatRow({ items }) {
  const styles = useUiStyles();
  return (
    <View style={styles.stats}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={item.onPress} style={[styles.stat, item.tone === "navy" && styles.statNavy, item.tone === "green" && styles.statGreen, item.tone === "gold" && styles.statGold]}>
          <Text style={styles.statLabel}>{item.label}</Text>
          <Text style={styles.statValue}>{item.value}</Text>
          {!!item.desc && <Text style={styles.statDesc}>{item.desc}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

export function Card({ children, onPress, style }) {
  const styles = useUiStyles();
  const Inner = (
    <View style={[styles.card, style]}>{children}</View>
  );
  if (onPress) return <Pressable onPress={onPress}>{Inner}</Pressable>;
  return Inner;
}

export function Badge({ status, label, text, tone }) {
  const styles = useUiStyles();
  const shown = text || label || status || "—";
  const mapped = tone === "ok" ? "on" : tone === "bad" ? "off" : tone === "orange" ? "warn" : tone === "muted" ? "off" : tone || badgeTone(status || label || text);
  return (
    <View style={[styles.badge, mapped === "on" && styles.badgeOn, mapped === "warn" && styles.badgeWarn, mapped === "off" && styles.badgeOff]}>
      <Text style={styles.badgeText}>{shown}</Text>
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, tone = "primary" }) {
  const { colors } = useTheme();
  const styles = useUiStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        tone === "navy" && { backgroundColor: colors.navy2 },
        tone === "danger" && { backgroundColor: colors.red },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}

export function SearchBar({ value, onChangeText, placeholder = "Search" }) {
  const { colors } = useTheme();
  const styles = useUiStyles();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      style={styles.search}
    />
  );
}

export function EmptyState({ title, text }) {
  const styles = useUiStyles();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title || "Nothing here yet"}</Text>
      <Text style={styles.emptyText}>{text || "Pull to refresh, or add a record."}</Text>
    </View>
  );
}

export function ErrorText({ children }) {
  const styles = useUiStyles();
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function LoadingBlock() {
  const { colors, isDark } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    );
    slide.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [slide]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-72, 200],
  });

  return (
    <View style={loadingStyles.wrap}>
      <View
        style={[
          loadingStyles.track,
          { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)" },
        ]}
      >
        <Animated.View
          style={[
            loadingStyles.bar,
            {
              backgroundColor: colors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  track: {
    width: "100%",
    maxWidth: 180,
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  bar: {
    width: 72,
    height: 4,
    borderRadius: 999,
  },
});

export function Field({ label, value, onChangeText, placeholder, secure, multiline, keyboardType }) {
  const { colors } = useTheme();
  const styles = useUiStyles();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value == null ? "" : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && { height: 90, textAlignVertical: "top" }]}
      />
    </View>
  );
}

export function ChipSelect({ label, value, options, onChange }) {
  const styles = useUiStyles();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(options || []).map((opt) => {
          const v = typeof opt === "object" ? opt.value : opt;
          const l = typeof opt === "object" ? opt.label : opt;
          const on = String(value) === String(v);
          return (
            <Pressable key={String(v)} onPress={() => onChange(v)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{l}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function FormModal({ visible, title, children, onClose, onSave, saving, error, hideSave }) {
  const styles = useUiStyles();
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}><Text style={styles.link}>Close</Text></Pressable>
          </View>
          <ScrollView>{children}</ScrollView>
          <ErrorText>{error}</ErrorText>
          {!hideSave && <PrimaryButton title={saving ? "Saving…" : "Save"} onPress={onSave} disabled={saving} />}
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmModal({ visible, title, text, onClose, onConfirm, confirmTitle = "Confirm" }) {
  const styles = useUiStyles();
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={[styles.sub, { marginVertical: 12 }]}>{text}</Text>
          <PrimaryButton title={confirmTitle} onPress={onConfirm} />
          <Pressable onPress={onClose} style={{ marginTop: 12, alignItems: "center" }}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function MenuRow({ title, subtitle, onPress, onLongPress, right, icon, danger, last, grouped }) {
  const styles = useUiStyles();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.menuRow,
        grouped ? styles.menuRowGrouped : styles.menuRowSolo,
        grouped && last && styles.menuRowLast,
        pressed && styles.menuRowPressed,
      ]}
    >
      {!!icon && (
        <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {!!subtitle && <Text style={styles.statDesc} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
      {!danger && <Text style={styles.chev}>›</Text>}
    </Pressable>
  );
}

export function MenuSection({ title, children }) {
  const styles = useUiStyles();
  return (
    <View style={styles.menuSection}>
      {!!title && <Text style={styles.menuSectionTitle}>{title}</Text>}
      <View style={styles.menuGroup}>{children}</View>
    </View>
  );
}

export const Row = MenuRow;
export const Title = Hero;
export const Empty = EmptyState;
export const Loading = LoadingBlock;
export const SearchField = SearchBar;

export function Stat({ label, value, hint, tone }) {
  const styles = useUiStyles();
  return (
    <View style={[styles.stat, { width: "48%" }, tone === "navy" && styles.statNavy, tone === "green" && styles.statGreen]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {!!hint && <Text style={styles.statDesc}>{hint}</Text>}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  const styles = useUiStyles();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Could not load</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {onRetry ? <PrimaryButton title="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

export function GhostButton({ title, onPress }) {
  const styles = useUiStyles();
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Text style={styles.chipText}>{title}</Text>
    </Pressable>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: 16, paddingBottom: 40 },
    hero: { flexDirection: "row", gap: 12, marginBottom: 16, alignItems: "flex-start" },
    heroCompact: { marginBottom: 0, gap: 8 },
    appHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.bg2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      zIndex: 20,
    },
    headerIconBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    notifBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: colors.red,
      alignItems: "center",
      justifyContent: "center",
    },
    notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
    notifBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-start",
      paddingTop: 72,
      paddingHorizontal: 16,
    },
    notifSheet: {
      backgroundColor: colors.bg2,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 420,
      padding: 14,
    },
    notifHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    notifTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
    notifList: { maxHeight: 340 },
    notifRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    notifMsg: { color: colors.text, fontSize: 14, fontWeight: "600" },
    notifEmpty: { color: colors.muted, textAlign: "center", paddingVertical: 24 },
    schoolMarkImg: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    schoolMarkFallback: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    schoolMarkInitials: { color: "#fff", fontWeight: "800", fontSize: 14 },
    schoolMarkName: { flex: 1, color: colors.text, fontWeight: "800", fontSize: 16 },
    kicker: { color: colors.primary, fontWeight: "800", letterSpacing: 1, fontSize: 11, textTransform: "uppercase" },
    kickerCompact: { fontSize: 10, letterSpacing: 0.4 },
    h1: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 4 },
    hCompact: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 2, lineHeight: 18 },
    sub: { color: colors.muted, marginTop: 6, lineHeight: 20 },
    subCompact: { fontSize: 12, marginTop: 2, lineHeight: 16 },
    stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
    stat: { backgroundColor: colors.card, borderRadius: 16, padding: 14, width: "48%", borderWidth: 1, borderColor: colors.border },
    statNavy: { backgroundColor: colors.navy2 },
    statGreen: { borderColor: "rgba(34,197,94,0.3)" },
    statGold: { borderColor: "rgba(232,184,109,0.35)" },
    statLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
    statValue: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 6 },
    statDesc: { color: colors.muted, fontSize: 12, marginTop: 4 },
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    badgeOn: { backgroundColor: "rgba(34,197,94,0.15)" },
    badgeWarn: { backgroundColor: "rgba(232,184,109,0.18)" },
    badgeOff: { backgroundColor: "rgba(248,113,113,0.15)" },
    badgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
    btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 8 },
    btnText: { color: colors.white, fontWeight: "800" },
    search: { backgroundColor: colors.card2, color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.border, fontSize: 13 },
    empty: { alignItems: "center", padding: 28 },
    emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
    emptyText: { color: colors.muted, marginTop: 6, textAlign: "center" },
    error: { color: colors.red, marginVertical: 8 },
    fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 6 },
    input: { backgroundColor: colors.navy, color: colors.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, fontSize: 13 },
    chip: { backgroundColor: colors.navy, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: colors.border },
    chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
    chipTextOn: { color: colors.white },
    modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: colors.bg2, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: "88%" },
    modalHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
    link: { color: colors.accent, fontWeight: "700" },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingVertical: 13,
      paddingHorizontal: 14,
    },
    menuRowSolo: {
      borderRadius: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuRowGrouped: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    menuRowLast: { borderBottomWidth: 0 },
    menuRowPressed: { backgroundColor: colors.card2 },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "rgba(241,90,36,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuIconDanger: { backgroundColor: "rgba(248,113,113,0.12)" },
    menuTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
    menuTitleDanger: { color: colors.red },
    menuSection: { marginBottom: 18 },
    menuSectionTitle: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 4,
    },
    menuGroup: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    chev: { color: colors.muted, fontSize: 22, marginLeft: 8, fontWeight: "300" },
  });
}
