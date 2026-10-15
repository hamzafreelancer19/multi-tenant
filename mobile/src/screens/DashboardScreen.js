import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { rootNavigate } from "../navigation/rootNav";
import { useAuth } from "../auth/AuthContext";
import { getActivities, getDashboardStats, getEnrollments, getStudents, acceptEnrollment, rejectEnrollment } from "../api";
import { Badge, Card, EmptyState, ErrorText, Hero, LoadingBlock, PrimaryButton, Screen, StatRow } from "../components/ui";
import { apiError, asList, displayName, greeting, isSchoolAdmin, money } from "../utils";

export default function DashboardScreen() {
  const { user, role } = useAuth();
  const navigation = { navigate: rootNavigate };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [recent, setRecent] = useState([]);
  const [pending, setPending] = useState([]);

  const load = async () => {
    setError("");
    try {
      const [s, a] = await Promise.all([getDashboardStats(), getActivities()]);
      setStats(s.data || {});
      setActivities(asList(a.data).slice(0, 8));
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

      <Hero kicker="Activity" title="Latest updates" />
      {activities.length ? activities.map((a, i) => (
        <Card key={a.id || i}>
          <Hero kicker={a.name} title={a.action} subtitle={a.created_at} />
        </Card>
      )) : <EmptyState title="No activity yet" text="Actions across the school will show up here." />}
    </Screen>
  );
}
