import React, { useCallback, useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  approvePlan,
  approveSchool,
  deleteSchool,
  getPlatformUsers,
  getSchools,
  rejectPlan,
  rejectSchool,
  updateSchool,
} from "../api";
import { Badge, EmptyState, ErrorText, LoadingBlock, Screen, SearchBar } from "../components/ui";
import { radius } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import { apiError, asList, displayName, mediaUrl } from "../utils";

function schoolInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function SchoolsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [menuSchool, setMenuSchool] = useState(null);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeDomain, setActiveDomain] = useState("");

  const load = async () => {
    try {
      const [s, u, domain] = await Promise.all([
        getSchools(),
        getPlatformUsers().catch(() => ({ data: [] })),
        AsyncStorage.getItem("schoolDomain"),
      ]);
      setSchools(asList(s.data));
      setUsers(asList(u.data));
      setActiveDomain(domain || "");
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load schools."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const stats = useMemo(() => {
    const pendingSchool = schools.filter((s) =>
      String(s.status || "").toLowerCase().includes("pending")
    ).length;
    const pendingPlan = schools.filter((s) =>
      String(s.plan_status || "").toLowerCase().includes("pending")
    ).length;
    const active = schools.filter(
      (s) => String(s.plan_status || "").toLowerCase() === "active"
    ).length;
    return {
      total: schools.length,
      pending: pendingSchool + pendingPlan,
      active,
      admins: users.length,
    };
  }, [schools, users]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return schools.filter((s) => {
      const hay = [s.name, s.domain, s.plan_type, s.status, s.plan_status]
        .join(" ")
        .toLowerCase();
      if (needle && !hay.includes(needle)) return false;
      if (filter === "Pending") {
        return (
          String(s.status || "").toLowerCase().includes("pending") ||
          String(s.plan_status || "").toLowerCase().includes("pending")
        );
      }
      if (filter === "Active") {
        return String(s.plan_status || "").toLowerCase() === "active";
      }
      return true;
    });
  }, [schools, q, filter]);

  const closeMenu = () => setMenuSchool(null);

  const runAction = async (school, fn, okMsg) => {
    if (!school) return;
    closeMenu();
    setBusyId(school.id);
    setError("");
    setToast("");
    try {
      await fn(school);
      setToast(okMsg);
      await load();
    } catch (err) {
      setError(apiError(err, "Action failed."));
    } finally {
      setBusyId(null);
    }
  };

  const menuActions = useMemo(() => {
    if (!menuSchool) return [];
    const s = menuSchool;
    const items = [];
    if (s.domain) {
      items.push({
        key: "tenant",
        icon: "swap-horizontal-outline",
        label: activeDomain === s.domain ? "Active tenant" : "Use tenant",
        tone: "navy",
        onPress: () =>
          runAction(
            s,
            async () => {
              await AsyncStorage.setItem("schoolDomain", s.domain);
              setActiveDomain(s.domain);
            },
            `Tenant set to ${s.domain}`
          ),
      });
    }
    items.push(
      {
        key: "approve-school",
        icon: "checkmark-circle-outline",
        label: "Approve school",
        tone: "success",
        onPress: () => runAction(s, () => approveSchool(s.id), `${s.name} approved`),
      },
      {
        key: "reject-school",
        icon: "close-circle-outline",
        label: "Reject school",
        tone: "danger",
        onPress: () => runAction(s, () => rejectSchool(s.id), `${s.name} rejected`),
      },
      {
        key: "approve-plan",
        icon: "diamond-outline",
        label: "Approve plan",
        tone: "primary",
        onPress: () => runAction(s, () => approvePlan(s.id), `Plan approved for ${s.name}`),
      },
      {
        key: "reject-plan",
        icon: "ban-outline",
        label: "Reject plan",
        tone: "danger",
        onPress: () => runAction(s, () => rejectPlan(s.id), `Plan rejected for ${s.name}`),
      },
      {
        key: "deactivate",
        icon: "pause-circle-outline",
        label: "Deactivate plan",
        tone: "navy",
        onPress: () =>
          runAction(
            s,
            () => updateSchool(s.id, { plan_status: "Inactive" }),
            `${s.name} plan deactivated`
          ),
      },
      {
        key: "delete",
        icon: "trash-outline",
        label: "Delete school",
        tone: "danger",
        onPress: () => runAction(s, () => deleteSchool(s.id), `${s.name} deleted`),
      }
    );
    return items;
  }, [menuSchool, activeDomain]);

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Loading tenants…" />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={load}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Text style={styles.kicker}>Platform</Text>
      <Text style={styles.pageTitle}>Schools</Text>
      <Text style={styles.pageSub}>Approve tenants & plans from the Actions menu.</Text>

      <View style={styles.statRow}>
        <View style={[styles.stat, styles.statOrange]}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Tenants</Text>
        </View>
        <View style={[styles.stat, styles.statGold]}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.stat, styles.statGreen]}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.admins}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
      </View>

      {!!activeDomain && (
        <View style={styles.activeTenant}>
          <Ionicons name="link-outline" size={16} color={colors.primary} />
          <Text style={styles.activeTenantText} numberOfLines={1}>
            Active tenant: <Text style={styles.activeTenantStrong}>{activeDomain}</Text>
          </Text>
        </View>
      )}

      <SearchBar value={q} onChangeText={setQ} placeholder="Search school, domain, plan…" />

      <View style={styles.filters}>
        {["All", "Pending", "Active"].map((key) => {
          const on = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filterChip, on && styles.filterChipOn]}
            >
              <Text style={[styles.filterText, on && styles.filterTextOn]}>{key}</Text>
            </Pressable>
          );
        })}
      </View>

      <ErrorText>{error}</ErrorText>
      {!!toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {filtered.length ? (
        filtered.map((s) => {
          const logoUrl = mediaUrl(s.logo_url || s.logo);
          const busy = busyId === s.id;
          const planLabel = s.plan_type && s.plan_type !== "None" ? s.plan_type : "No plan";
          return (
            <View key={s.id} style={styles.row}>
              <View style={styles.avatar}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{schoolInitials(s.name)}</Text>
                )}
              </View>

              <View style={styles.rowMeta}>
                <Text style={styles.schoolName} numberOfLines={1}>
                  {s.name || "Untitled school"}
                </Text>
                <Text style={styles.schoolDomain} numberOfLines={1}>
                  {s.domain || "No domain"} · {planLabel}
                </Text>
                <View style={styles.badgeRow}>
                  <Badge status={s.status || "—"} label={s.status || "—"} />
                  <Badge status={s.plan_status || "Inactive"} label={s.plan_status || "—"} />
                </View>
              </View>

              <Pressable
                onPress={() => setMenuSchool(s)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.actionsBtn,
                  pressed && { opacity: 0.88 },
                  busy && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.actionsBtnText}>{busy ? "…" : "Actions"}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </Pressable>
            </View>
          );
        })
      ) : (
        <EmptyState title="No schools found" text="Try another filter or search." />
      )}

      <Modal visible={!!menuSchool} transparent animationType="fade" onRequestClose={closeMenu}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <View style={styles.menuCard}>
            <View style={styles.menuHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuKicker}>Actions</Text>
                <Text style={styles.menuTitle} numberOfLines={1}>
                  {menuSchool?.name || "School"}
                </Text>
              </View>
              <Pressable onPress={closeMenu} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            {menuActions.map((item) => {
              const danger = item.tone === "danger";
              const success = item.tone === "success";
              const color = danger
                ? colors.danger
                : success
                ? colors.success
                : item.tone === "primary"
                ? colors.primary
                : colors.text;
              return (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.card2 }]}
                >
                  <Ionicons name={item.icon} size={18} color={color} />
                  <Text style={[styles.menuItemText, { color }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      <View style={styles.adminsHead}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        <Text style={styles.adminsTitle}>School admins</Text>
        <Text style={styles.adminsCount}>{users.length}</Text>
      </View>

      {users.length ? (
        users.slice(0, 30).map((u) => (
          <View key={u.id} style={styles.adminRow}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>
                {schoolInitials(displayName(u) || u.username || "?")}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminName} numberOfLines={1}>
                {displayName(u) || u.username}
              </Text>
              <Text style={styles.adminEmail} numberOfLines={1}>
                {u.email || u.role || "—"}
              </Text>
            </View>
            <Badge status={u.role || "admin"} label={u.role || "admin"} />
          </View>
        ))
      ) : (
        <EmptyState text="No school admins yet." />
      )}
    </Screen>
  );
}

function makeStyles(colors, isDark) {
  return StyleSheet.create({
    glowTop: {
      position: "absolute",
      top: -50,
      right: -40,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: "rgba(241,90,36,0.14)",
    },
    glowBottom: {
      position: "absolute",
      bottom: 120,
      left: -60,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: isDark ? "rgba(23,48,73,0.75)" : "rgba(241,90,36,0.06)",
    },
    kicker: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    pageTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    pageSub: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 6,
      marginBottom: 16,
      lineHeight: 20,
    },
    statRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    stat: {
      width: "23%",
      flexGrow: 1,
      minWidth: 72,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    statOrange: { borderColor: "rgba(241,90,36,0.3)" },
    statGold: { borderColor: "rgba(251,191,36,0.35)" },
    statGreen: { borderColor: "rgba(52,211,153,0.3)" },
    statValue: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
    },
    statLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 2,
    },
    activeTenant: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(241,90,36,0.1)",
      borderColor: "rgba(241,90,36,0.25)",
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    activeTenantText: { color: colors.muted, fontSize: 13, flex: 1 },
    activeTenantStrong: { color: colors.primary, fontWeight: "800" },
    filters: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
    },
    filterChipOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
    filterTextOn: { color: "#fff" },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(52,211,153,0.12)",
      borderColor: "rgba(52,211,153,0.3)",
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    toastText: { color: colors.success, fontWeight: "700", fontSize: 13, flex: 1 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: "rgba(241,90,36,0.16)",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImg: { width: 44, height: 44, borderRadius: 14 },
    avatarText: { color: colors.primary, fontWeight: "900", fontSize: 15 },
    rowMeta: { flex: 1, minWidth: 0 },
    schoolName: { color: colors.text, fontSize: 14, fontWeight: "800" },
    schoolDomain: { color: colors.muted, fontSize: 11, fontWeight: "600", marginTop: 2 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 5 },
    actionsBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(241,90,36,0.12)",
      borderColor: "rgba(241,90,36,0.28)",
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    actionsBtnText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
      padding: 16,
    },
    menuCard: {
      backgroundColor: colors.bg2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      maxHeight: "75%",
    },
    menuHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line,
    },
    menuKicker: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    menuTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 2 },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
    },
    menuItemText: { flex: 1, fontSize: 14, fontWeight: "700" },
    adminsHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 14,
      marginBottom: 12,
    },
    adminsTitle: { color: colors.text, fontSize: 18, fontWeight: "800", flex: 1 },
    adminsCount: {
      color: colors.muted,
      fontWeight: "800",
      fontSize: 13,
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      overflow: "hidden",
    },
    adminRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.bg2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 12,
      marginBottom: 8,
    },
    adminAvatar: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    adminAvatarText: { color: colors.primary, fontWeight: "800", fontSize: 13 },
    adminName: { color: colors.text, fontWeight: "800", fontSize: 14 },
    adminEmail: { color: colors.muted, fontSize: 12, marginTop: 2 },
  });
}
