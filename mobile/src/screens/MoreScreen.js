import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Screen>
      <Pressable
        onPress={() => navigation.navigate(parent ? "ParentProfile" : "Profile")}
        style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.96 }]}
      >
        <View style={styles.heroAccent} />
        <View style={styles.heroBody}>
          <View style={styles.heroTop}>
            <View style={styles.avatarStack}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{initialsOf(profileName) || "?"}</Text>
              </View>
              {logoUri && !superadmin ? (
                <Image source={{ uri: logoUri }} style={styles.schoolBadge} />
              ) : (
                <View style={[styles.schoolBadge, styles.schoolBadgeFallback]}>
                  <Ionicons name="school" size={12} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.hello}>{hello}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {profileName}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.roleChip}>
                  <Text style={styles.roleChipText}>{roleLabel(role)}</Text>
                </View>
                <Text style={styles.school} numberOfLines={1}>
                  {schoolLabel}
                </Text>
              </View>
            </View>
            <View style={styles.heroCta}>
              <Ionicons name="person" size={16} color={colors.primary} />
              <Text style={styles.heroCtaText}>Profile</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {quickActions.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Quick access</Text>
          <View style={styles.quickRow}>
            {quickActions.map((item, index) => (
              <Pressable
                key={item.title}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.quickCard,
                  index % 2 === 0 ? styles.quickCardA : styles.quickCardB,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.quickIcon, index % 2 === 0 ? styles.quickIconA : styles.quickIconB]}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={index % 2 === 0 ? colors.primary : colors.text}
                  />
                </View>
                <Text style={styles.quickLabel}>{item.title}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Preferences</Text>
      <View style={styles.prefCard}>
        <View style={styles.prefHead}>
          <View style={styles.themeIcon}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.themeTitle}>Theme</Text>
            <Text style={styles.themeSub}>Choose how Classora looks</Text>
          </View>
        </View>
        <View style={styles.segment}>
          {[
            { key: "light", label: "Light", icon: "sunny-outline" },
            { key: "dark", label: "Dark", icon: "moon-outline" },
          ].map((opt) => {
            const active = (opt.key === "dark") === isDark;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setMode(opt.key)}
                style={[styles.segmentBtn, active && styles.segmentBtnOn]}
              >
                <Ionicons name={opt.icon} size={15} color={active ? "#fff" : colors.muted} />
                <Text style={[styles.segmentText, active && styles.segmentTextOn]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
    heroCard: {
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: "hidden",
      marginBottom: 18,
    },
    heroAccent: {
      height: 4,
      backgroundColor: colors.primary,
    },
    heroBody: {
      padding: 16,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatarStack: {
      width: 58,
      height: 58,
    },
    userAvatar: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: "rgba(241,90,36,0.18)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(241,90,36,0.3)",
    },
    userAvatarText: {
      color: colors.primary,
      fontWeight: "900",
      fontSize: 18,
    },
    schoolBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 22,
      height: 22,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.card,
      backgroundColor: colors.primary,
      overflow: "hidden",
    },
    schoolBadgeFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    heroMeta: { flex: 1, minWidth: 0 },
    hello: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
    },
    name: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      marginTop: 2,
      letterSpacing: -0.3,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },
    roleChip: {
      backgroundColor: "rgba(241,90,36,0.14)",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    roleChipText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    school: {
      flex: 1,
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    heroCta: {
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: "rgba(241,90,36,0.12)",
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 10,
      minWidth: 64,
    },
    heroCtaText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "800",
    },
    sectionLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.9,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 2,
    },
    quickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 18,
    },
    quickCard: {
      width: "47%",
      flexGrow: 1,
      minWidth: 140,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
    quickCardA: {
      backgroundColor: isDark ? "rgba(241,90,36,0.1)" : "rgba(241,90,36,0.08)",
      borderColor: "rgba(241,90,36,0.28)",
    },
    quickCardB: {
      backgroundColor: colors.card,
      borderColor: colors.line,
    },
    quickIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    quickIconA: { backgroundColor: "rgba(241,90,36,0.18)" },
    quickIconB: { backgroundColor: colors.bg2 },
    quickLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: "800",
    },
    prefCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      marginBottom: 18,
    },
    prefHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    themeIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(241,90,36,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    themeTitle: { color: colors.text, fontWeight: "800", fontSize: 15 },
    themeSub: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: "600" },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.bg2,
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 11,
    },
    segmentBtnOn: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      color: colors.muted,
      fontWeight: "800",
      fontSize: 13,
    },
    segmentTextOn: {
      color: "#fff",
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
