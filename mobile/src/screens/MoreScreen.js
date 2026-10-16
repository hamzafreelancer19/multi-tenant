import React, { useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";
import { MenuRow, MenuSection, Screen } from "../components/ui";
import { displayName, isSchoolAdmin, mediaUrl, roleLabel } from "../utils";
import { rootNavigate } from "../navigation/rootNav";
import { useTheme } from "../theme/ThemeContext";
import { radius } from "../theme";

function withLast(items) {
  return items.map((item, i) => ({ ...item, last: i === items.length - 1 }));
}

function initialsOf(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function MoreScreen() {
  const { user, role, logout, schoolLogo, schoolName } = useAuth();
  const { colors, isDark, setMode } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const navigation = { navigate: rootNavigate };
  const admin = isSchoolAdmin(role);
  const teacher = role === "teacher";
  const parent = role === "parent";
  const student = role === "student";
  const accountant = role === "accountant";
  const superadmin = role === "superadmin";
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const icon = (name, color = colors.primary) => (
    <Ionicons name={name} size={18} color={color} />
  );

  const quickActions = useMemo(() => {
    const go = (name) => () => navigation.navigate(name);
    if (admin) {
      return [
        { title: "Teachers", icon: "people-outline", onPress: go("Teachers") },
        { title: "Classes", icon: "albums-outline", onPress: go("Classes") },
        { title: "Notices", icon: "megaphone-outline", onPress: go("Notices") },
        { title: "Chat", icon: "chatbubbles-outline", onPress: go("Chat") },
      ];
    }
    if (teacher) {
      return [
        { title: "Students", icon: "people-outline", onPress: go("Students") },
        { title: "Exams", icon: "clipboard-outline", onPress: go("Exams") },
        { title: "Timetable", icon: "calendar-outline", onPress: go("Timetable") },
        { title: "Chat", icon: "chatbubbles-outline", onPress: go("Chat") },
      ];
    }
    if (parent) {
      return [
        { title: "Child", icon: "person-outline", onPress: go("ParentProfile") },
        { title: "Fees", icon: "card-outline", onPress: go("ParentFees") },
        { title: "Exams", icon: "clipboard-outline", onPress: go("ParentExams") },
        { title: "Chat", icon: "chatbubbles-outline", onPress: go("Chat") },
      ];
    }
    if (student) {
      return [
        { title: "Fees", icon: "card-outline", onPress: go("Fees") },
        { title: "Homework", icon: "document-text-outline", onPress: go("Assignments") },
        { title: "Timetable", icon: "calendar-outline", onPress: go("Timetable") },
        { title: "Chat", icon: "chatbubbles-outline", onPress: go("Chat") },
      ];
    }
    if (accountant) {
      return [
        { title: "Fees", icon: "card-outline", onPress: go("Fees") },
        { title: "Notices", icon: "megaphone-outline", onPress: go("Notices") },
        { title: "Chat", icon: "chatbubbles-outline", onPress: go("Chat") },
        { title: "Profile", icon: "person-circle-outline", onPress: go("Profile") },
      ];
    }
    if (superadmin) {
      return [
        { title: "Schools", icon: "business-outline", onPress: go("Schools") },
        { title: "Plans", icon: "diamond-outline", onPress: go("Plans") },
        { title: "Admins", icon: "shield-checkmark-outline", onPress: go("PlatformUsers") },
        { title: "Settings", icon: "settings-outline", onPress: go("PlatformSettings") },
      ];
    }
    return [];
  }, [admin, teacher, parent, student, accountant, superadmin]);

  const sections = useMemo(() => {
    const go = (name) => () => navigation.navigate(name);

    if (admin) {
      return [
        {
          title: "Academics",
          items: withLast([
            { title: "Teachers", subtitle: "Faculty & portal logins", icon: icon("people"), onPress: go("Teachers") },
            { title: "Classes", subtitle: "Sections & subjects", icon: icon("albums"), onPress: go("Classes") },
            { title: "Admission requests", subtitle: "Review enrollments", icon: icon("person-add"), onPress: go("Enrollments") },
            { title: "Exams", subtitle: "Schedules & marks", icon: icon("clipboard"), onPress: go("Exams") },
            { title: "Homework", subtitle: "Assignments", icon: icon("document-text"), onPress: go("Assignments") },
            { title: "Timetable", subtitle: "Weekly periods", icon: icon("calendar"), onPress: go("Timetable") },
          ]),
        },
        {
          title: "School ops",
          items: withLast([
            { title: "Notices", subtitle: "Announcements", icon: icon("megaphone"), onPress: go("Notices") },
            { title: "Library", subtitle: "Books & issues", icon: icon("library"), onPress: go("Library") },
            { title: "Staff & payroll", subtitle: "Employees", icon: icon("briefcase"), onPress: go("Staff") },
            { title: "Inventory", subtitle: "Stock & logs", icon: icon("cube"), onPress: go("Inventory") },
            { title: "Transport", subtitle: "Routes & vehicles", icon: icon("bus"), onPress: go("Transport") },
            { title: "Chat", subtitle: "Messages", icon: icon("chatbubbles"), onPress: go("Chat") },
          ]),
        },
        {
          title: "Account",
          items: withLast([
            { title: "Subscription", subtitle: "Plan & billing", icon: icon("diamond"), onPress: go("Subscription") },
            { title: "School settings", subtitle: "School profile", icon: icon("settings"), onPress: go("Settings") },
            { title: "Profile", subtitle: "Your account", icon: icon("person-circle"), onPress: go("Profile") },
          ]),
        },
      ];
    }

    if (teacher) {
      return [
        {
          title: "Classroom",
          items: withLast([
            { title: "Students", subtitle: "Your classes", icon: icon("people"), onPress: go("Students") },
            { title: "Exams", subtitle: "Marks & papers", icon: icon("clipboard"), onPress: go("Exams") },
            { title: "Timetable", subtitle: "Your schedule", icon: icon("calendar"), onPress: go("Timetable") },
            { title: "Notices", subtitle: "Announcements", icon: icon("megaphone"), onPress: go("Notices") },
            { title: "Class admissions", subtitle: "Pending requests", icon: icon("person-add"), onPress: go("Enrollments") },
            { title: "Chat", subtitle: "Messages", icon: icon("chatbubbles"), onPress: go("Chat") },
          ]),
        },
        {
          title: "Account",
          items: withLast([
            { title: "Profile", subtitle: "Your account", icon: icon("person-circle"), onPress: go("Profile") },
          ]),
        },
      ];
    }

    if (parent) {
      return [
        {
          title: "Your child",
          items: withLast([
            { title: "Child profile", subtitle: "Details & class", icon: icon("person"), onPress: go("ParentProfile") },
            { title: "Exams", subtitle: "Results", icon: icon("clipboard"), onPress: go("ParentExams") },
            { title: "Timetable", subtitle: "Weekly schedule", icon: icon("calendar"), onPress: go("ParentTimetable") },
            { title: "Notices", subtitle: "School updates", icon: icon("megaphone"), onPress: go("ParentNotices") },
            { title: "Library", subtitle: "Books issued", icon: icon("library"), onPress: go("ParentLibrary") },
            { title: "Chat", subtitle: "Messages", icon: icon("chatbubbles"), onPress: go("Chat") },
          ]),
        },
        {
          title: "Account",
          items: withLast([
            { title: "Profile", subtitle: "Your account", icon: icon("person-circle"), onPress: go("Profile") },
          ]),
        },
      ];
    }

    if (student) {
      return [
        {
          title: "School",
          items: withLast([
            { title: "Notices", subtitle: "Announcements", icon: icon("megaphone"), onPress: go("Notices") },
            { title: "Timetable", subtitle: "Your periods", icon: icon("calendar"), onPress: go("Timetable") },
            { title: "Library", subtitle: "Books", icon: icon("library"), onPress: go("Library") },
            { title: "Chat", subtitle: "Messages", icon: icon("chatbubbles"), onPress: go("Chat") },
          ]),
        },
        {
          title: "Account",
          items: withLast([
            { title: "Profile", subtitle: "Your account", icon: icon("person-circle"), onPress: go("Profile") },
          ]),
        },
      ];
    }

    if (accountant) {
      return [
        {
          title: "Office",
          items: withLast([
            { title: "Notices", subtitle: "Announcements", icon: icon("megaphone"), onPress: go("Notices") },
            { title: "Chat", subtitle: "Messages", icon: icon("chatbubbles"), onPress: go("Chat") },
          ]),
        },
        {
          title: "Account",
          items: withLast([
            { title: "Profile", subtitle: "Your account", icon: icon("person-circle"), onPress: go("Profile") },
          ]),
        },
      ];
    }

    if (superadmin) {
      return [
        {
          title: "Platform",
          items: withLast([
            { title: "Dashboard", subtitle: "Overview", icon: icon("grid"), onPress: go("Dashboard") },
            { title: "Schools", subtitle: "Tenants", icon: icon("business"), onPress: go("Schools") },
            { title: "Plans", subtitle: "Subscriptions", icon: icon("card"), onPress: go("Plans") },
            { title: "School admins", subtitle: "Platform users", icon: icon("shield-checkmark"), onPress: go("PlatformUsers") },
            { title: "Platform settings", subtitle: "Global config", icon: icon("settings"), onPress: go("PlatformSettings") },
          ]),
        },
        {
          title: "Account",
          items: withLast([
            { title: "Profile", subtitle: "Your account", icon: icon("person-circle"), onPress: go("Profile") },
          ]),
        },
      ];
    }

    return [
      {
        title: "Account",
        items: withLast([
          { title: "Profile", subtitle: "Your account", icon: icon("person-circle"), onPress: go("Profile") },
        ]),
      },
    ];
  }, [admin, teacher, parent, student, accountant, superadmin, colors]);

  const accountSection = sections.find((s) => s.title === "Account");
  const mainSections = sections.filter((s) => s.title !== "Account");
  const profileName = displayName(user) || "User";
  const logoUri = mediaUrl(schoolLogo);
  const schoolLabel = schoolName || user?.school_name || user?.school_domain || "Classora";

  return (
    <Screen>
      <Text style={styles.kicker}>More</Text>
      <Text style={styles.pageTitle}>Menu</Text>
      <Text style={styles.pageSub}>Shortcuts, settings, and your account.</Text>

      <Pressable
        onPress={() => navigation.navigate(parent ? "ParentProfile" : "Profile")}
        style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.94 }]}
      >
        <View style={styles.avatarWrap}>
          {logoUri && !superadmin ? (
            <Image source={{ uri: logoUri }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{initialsOf(profileName) || "?"}</Text>
          )}
        </View>
        <View style={styles.profileMeta}>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{roleLabel(role)}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {profileName}
          </Text>
          <Text style={styles.school} numberOfLines={1}>
            {schoolLabel}
          </Text>
        </View>
        <View style={styles.profileArrow}>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Pressable>

      {quickActions.length > 0 ? (
        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <Pressable
              key={item.title}
              onPress={item.onPress}
              style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.themeCard}>
        <View style={styles.themeLeft}>
          <View style={styles.themeIcon}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.themeTitle}>Appearance</Text>
            <Text style={styles.themeSub}>{isDark ? "Dark mode" : "Light mode"}</Text>
          </View>
        </View>
        <Pressable onPress={() => setThemeOpen(true)} style={styles.themeBtn}>
          <Text style={styles.themeBtnText}>Change</Text>
          <Ionicons name="chevron-down" size={14} color={colors.primary} />
        </Pressable>
      </View>

      <Modal visible={themeOpen} transparent animationType="fade" onRequestClose={() => setThemeOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setThemeOpen(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Appearance</Text>
            {[
              { key: "light", label: "Light", icon: "sunny-outline" },
              { key: "dark", label: "Dark", icon: "moon-outline" },
            ].map((opt) => {
              const active = (opt.key === "dark") === isDark;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    setMode(opt.key);
                    setThemeOpen(false);
                  }}
                  style={[styles.modalOption, active && styles.modalOptionOn]}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? colors.primary : colors.muted} />
                  <Text style={[styles.modalOptionText, active && { color: colors.primary }]}>{opt.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {mainSections.map((section) => (
        <MenuSection key={section.title} title={section.title}>
          {section.items.map((item) => (
            <MenuRow
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              last={item.last}
              grouped
              onPress={item.onPress}
            />
          ))}
        </MenuSection>
      ))}

      {accountSection ? (
        <MenuSection title="Account">
          {accountSection.items.map((item) => (
            <MenuRow
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              last={item.last}
              grouped
              onPress={item.onPress}
            />
          ))}
        </MenuSection>
      ) : null}

      <Pressable
        onPress={logout}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.88 }]}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.red} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </Screen>
  );
}

function makeStyles(colors, isDark) {
  return StyleSheet.create({
    kicker: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    pageTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    pageSub: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 4,
      marginBottom: 16,
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      marginBottom: 14,
    },
    avatarWrap: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: "rgba(241,90,36,0.14)",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    avatarImg: { width: 58, height: 58, borderRadius: 18 },
    avatarText: {
      color: colors.primary,
      fontWeight: "900",
      fontSize: 18,
    },
    profileMeta: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      marginRight: 8,
    },
    roleChip: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(241,90,36,0.12)",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 4,
    },
    roleChipText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    name: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    school: {
      color: colors.muted,
      marginTop: 2,
      fontSize: 13,
      fontWeight: "600",
    },
    profileArrow: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    quickItem: {
      width: "23%",
      flexGrow: 1,
      minWidth: 72,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    quickIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "rgba(241,90,36,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    quickLabel: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    themeCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 12,
      marginBottom: 18,
    },
    themeLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    themeIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "rgba(241,90,36,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    themeTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
    themeSub: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: "600" },
    themeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(241,90,36,0.12)",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    themeBtnText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: 28,
    },
    modalCard: {
      backgroundColor: colors.bg2,
      borderRadius: 18,
      padding: 16,
      zIndex: 1,
      borderWidth: 1,
      borderColor: colors.line,
    },
    modalTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 17,
      marginBottom: 10,
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 13,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginTop: 4,
    },
    modalOptionOn: {
      backgroundColor: "rgba(241,90,36,0.12)",
    },
    modalOptionText: {
      flex: 1,
      color: colors.text,
      fontWeight: "700",
      fontSize: 15,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 4,
      marginBottom: 12,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(248,113,113,0.35)",
      backgroundColor: isDark ? "rgba(248,113,113,0.08)" : "rgba(220,38,38,0.06)",
    },
    logoutText: {
      color: colors.red,
      fontWeight: "800",
      fontSize: 15,
    },
  });
}
