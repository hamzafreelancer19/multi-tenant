import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { rootNavigate } from "../navigation/rootNav";
import { useAuth } from "../auth/AuthContext";
import { getActivities, getDashboardStats, getEnrollments, getStudents, acceptEnrollment, rejectEnrollment } from "../api";
import { Badge, Card, EmptyState, ErrorText, Hero, LoadingBlock, PrimaryButton, Screen, StatRow } from "../components/ui";
import { useTheme } from "../theme/ThemeContext";
import { apiError, asList, displayName, greeting, isSchoolAdmin, money, todayISO } from "../utils";

const ACTIVITY_LIST_HEIGHT = 220;

function isTodayActivity(item) {
  if (!item?.created_at) return false;
  const d = new Date(item.created_at);
  if (Number.isNaN(d.getTime())) return false;
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return key === todayISO();
}

export default function DashboardScreen() {
  const { user, role } = useAuth();
  const { colors } = useTheme();
  const navigation = { navigate: rootNavigate };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [recent, setRecent] = useState([]);
  const [pending, setPending] = useState([]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        activityBox: {
          height: ACTIVITY_LIST_HEIGHT,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.bg2,
          overflow: "hidden",
          marginBottom: 8,
        },
        activityScroll: {
          height: ACTIVITY_LIST_HEIGHT,
        },
        activityContent: {
          paddingHorizontal: 10,
          paddingTop: 8,
          paddingBottom: 10,
        },
        activityCard: {
          marginBottom: 8,
        },
      }),
    [colors]
  );

  const load = async () => {
    setError("");
    try {
      const [s, a] = await Promise.all([getDashboardStats(), getActivities()]);
      setStats(s.data || {});
      setActivities(asList(a.data).filter(isTodayActivity));
      if (role !== "superadmin") {
        try {
          const st = await getStudents();
          setRecent(asList(st.data).slice(0, 6));
        } catch {
          setRecent([]);
        }
        if (isSchoolAdmin(role)) {
          try {
            const en = await getEnrollments();
            setPending(asList(en.data).filter((e) => e.status === "PendingAdmin").slice(0, 5));
          } catch {
            setPending([]);
          }
        }
      }
    } catch (err) {
      setError(apiError(err, "Could not load dashboard."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [role]));

  const isSuper = stats.is_superadmin || role === "superadmin";
  const items = isSuper
    ? [
        { label: "Schools", value: stats.total_schools || 0, desc: `${stats.approved_schools || 0} approved`, tone: "orange" },
        { label: "Users", value: stats.total_users || 0, desc: "platform accounts", tone: "navy" },
        { label: "Pending", value: (stats.pending_schools || 0) + (stats.pending_plans || 0), desc: "schools & plans", tone: "gold" },
        { label: "Revenue", value: money(stats.plan_revenue || 0), desc: `${stats.active_plans || 0} active plans`, tone: "green" },
      ]
    : role === "accountant"
    ? [
        { label: "Paid fees", value: stats.fees_collected || 0, desc: "paid records", tone: "green" },
        { label: "Students", value: stats.students || 0, desc: "enrolled", tone: "orange" },
        { label: "Teachers", value: stats.teachers || 0, desc: "faculty", tone: "navy" },
        { label: "Attendance", value: stats.attendance ? `${stats.attendance}%` : "—", desc: "today", tone: "gold" },
      ]
    : role === "student"
    ? [
        { label: "Fees due", value: stats.fees_pending || stats.pending_fees || recent.length, desc: "your challans", tone: "gold" },
        { label: "Homework", value: stats.assignments || stats.homework || "—", desc: "class work", tone: "navy" },
        { label: "Attendance", value: stats.attendance ? `${stats.attendance}%` : "—", desc: "your rate", tone: "orange" },
        { label: "Notices", value: stats.notices || activities.length || "—", desc: "updates", tone: "green" },
      ]
    : [
        { label: "Students", value: stats.students || 0, desc: "enrolled", tone: "orange" },
        { label: "Teachers", value: stats.teachers || 0, desc: "faculty", tone: "navy" },
        { label: "Attendance", value: stats.attendance ? `${stats.attendance}%` : "—", desc: "teachers present", tone: "gold" },
        { label: "Paid fees", value: stats.fees_collected || 0, desc: "paid records", tone: "green" },
      ];

  const handleEnroll = async (id, action) => {
    try {
      if (action === "accept") await acceptEnrollment(id);
      else await rejectEnrollment(id);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not update admission."));
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load} refreshing={false}>
      <Hero
        kicker={new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting()}, ${displayName(user)}`}
        subtitle={isSuper ? "Platform overview." : `What’s happening at ${user?.school_name || "your school"} today.`}
      />
      <ErrorText>{error}</ErrorText>
      <StatRow items={items} />

      {isSchoolAdmin(role) && (
        <PrimaryButton title="Admission requests" onPress={() => navigation.navigate("Enrollments")} />
      )}

      {pending.length > 0 && (
        <>
          <Hero kicker="Admissions" title="Waiting for admin" />
          {pending.map((e) => (
            <Card key={e.id}>
              <Hero kicker={e.class_applying} title={e.student_name} subtitle={e.father_name} />
              <Badge status={e.status} label={e.status} />
              <PrimaryButton title="Accept" onPress={() => handleEnroll(e.id, "accept")} />
              <PrimaryButton title="Reject" tone="danger" onPress={() => handleEnroll(e.id, "reject")} />
            </Card>
          ))}
        </>
      )}

      {recent.length > 0 && role !== "student" && (
        <>
          <Hero kicker="Directory" title="Recent students" />
          {recent.map((s) => (
            <Card key={s.id} onPress={() => navigation.navigate("Students")}>
              <Hero kicker={s.class_name} title={s.name} subtitle={s.roll_no || s.father_name} />
            </Card>
          ))}
        </>
      )}
      {role === "student" && (
        <>
          <PrimaryButton title="My fees" onPress={() => navigation.navigate("Fees")} />
          <PrimaryButton title="Homework" tone="navy" onPress={() => navigation.navigate("Homework")} />
          <PrimaryButton title="Exams" tone="navy" onPress={() => navigation.navigate("Exams")} />
          <PrimaryButton title="Timetable" tone="navy" onPress={() => navigation.navigate("Timetable")} />
          <PrimaryButton title="Notices" tone="navy" onPress={() => navigation.navigate("Notices")} />
          <PrimaryButton title="Chat" tone="navy" onPress={() => navigation.navigate("Chat")} />
        </>
      )}

      <Hero kicker="Activity" title="Latest updates" subtitle="Today only · scroll inside" />
      {activities.length ? (
        <View style={styles.activityBox}>
          <ScrollView
            style={styles.activityScroll}
            contentContainerStyle={styles.activityContent}
            nestedScrollEnabled
            scrollEnabled
            showsVerticalScrollIndicator
            persistentScrollbar
            bounces={false}
            overScrollMode="always"
            keyboardShouldPersistTaps="handled"
          >
            {activities.map((a, i) => (
              <Card key={a.id || i} style={styles.activityCard}>
                <Hero
                  compact
                  kicker={a.name}
                  title={a.action}
                  subtitle={
                    a.created_at
                      ? new Date(a.created_at).toLocaleTimeString("en-PK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }
                />
              </Card>
            ))}
          </ScrollView>
        </View>
      ) : (
        <EmptyState title="No activity today" text="Today’s school actions will show up here." />
      )}
    </Screen>
  );
}
