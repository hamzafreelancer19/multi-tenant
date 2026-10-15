import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { rootNavigate } from "../navigation/rootNav";
import { useAuth } from "../auth/AuthContext";
import {
  assignPeriodCover,
  clearPeriodCover,
  getCoverBoard,
  getFreeTeachers,
  getMyTeacherProfile,
} from "../api";
import {
  Card,
  EmptyState,
  ErrorText,
  Field,
  FormModal,
  Hero,
  LoadingBlock,
  MenuRow,
  PrimaryButton,
  Screen,
  StatRow,
} from "../components/ui";
import { apiError, asList, displayName, todayISO } from "../utils";

export default function TeacherHomeScreen() {
  const { user } = useAuth();
  const navigation = { navigate: rootNavigate };
  const [profile, setProfile] = useState(null);
  const [board, setBoard] = useState({ classes: [] });
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coverPick, setCoverPick] = useState(null);
  const [freeTeachers, setFreeTeachers] = useState([]);
  const [coverSaving, setCoverSaving] = useState(false);

  const load = async (nextDate = date) => {
    setError("");
    try {
      const [p, b] = await Promise.all([
        getMyTeacherProfile().catch(() => ({ data: null })),
        getCoverBoard({ date: nextDate }).catch(() => ({ data: { classes: [] } })),
      ]);
      setProfile(p.data && p.data.id ? p.data : null);
      setBoard(b.data || { classes: [] });
    } catch (err) {
      setError(apiError(err, "Could not load teacher portal."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const scope = profile?.classroom_scope || {};
  const classCards = asList(scope.classes);
  const assigned = scope.assigned_classes?.length ? scope.assigned_classes : asList(profile?.classes);
  const inchargeCount = (scope.incharge_classes || []).length;
  const studentTotal = useMemo(
    () => classCards.reduce((sum, item) => sum + (Number(item.student_count) || 0), 0),
    [classCards]
  );

  const openCover = async (period) => {
    setCoverPick(period);
    setFreeTeachers([]);
    setError("");
    try {
      const res = await getFreeTeachers(period.id, { date });
      setFreeTeachers(asList(res.data?.teachers || res.data));
    } catch (err) {
      setError(apiError(err, "Could not load free teachers."));
    }
  };

  const assignCover = async (teacherId) => {
    if (!coverPick) return;
    setCoverSaving(true);
    setError("");
    try {
      await assignPeriodCover(coverPick.id, { date, teacher: teacherId });
      setCoverPick(null);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not assign cover teacher."));
    } finally {
      setCoverSaving(false);
    }
  };

  const removeCover = async (period) => {
    setError("");
    try {
      await clearPeriodCover(period.id, { date });
      await load();
    } catch (err) {
      setError(apiError(err, "Could not clear cover."));
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={() => load()}>
      <Hero
        kicker="Teacher portal"
        title={displayName(user)}
        subtitle={`${profile?.subject || "Faculty"} · ${user?.school_name || "your school"}`}
      />
      <StatRow
        items={[
          { label: "Subject", value: profile?.subject || "—", desc: profile?.designation || "Faculty", tone: "orange" },
          { label: "Classes", value: assigned.length || "—", desc: `${inchargeCount} as incharge`, tone: "navy" },
          { label: "Students", value: classCards.length ? studentTotal : "—", desc: "in your classes", tone: "green" },
        ]}
      />
      <ErrorText>{error}</ErrorText>

      {classCards.length ? classCards.map((item) => (
        <Card key={item.label} onPress={() => navigation.navigate("Students")}>
          <Hero
            kicker={item.is_incharge ? "Class incharge" : "Subject teacher"}
            title={item.label}
            subtitle={`${item.student_count || 0} students${item.my_subjects?.length ? ` · ${item.my_subjects.join(", ")}` : ""}`}
          />
        </Card>
      )) : <EmptyState text="No class assignment found on this teacher profile." />}

      {inchargeCount > 0 ? (
        <>
          <Hero kicker="Cover board" title="Today’s periods" subtitle="Assign a free teacher when you are away." />
          <Field
            label="Period date (YYYY-MM-DD)"
            value={date}
            onChangeText={(v) => {
              setDate(v);
              if (/^\d{4}-\d{2}-\d{2}$/.test(v)) load(v);
            }}
          />
          {(board.classes || []).length ? (board.classes || []).map((c) => (
            <Card key={c.label}>
              <Hero kicker="Class" title={c.label} subtitle={`${(c.periods || []).length} periods`} />
              {(c.periods || []).map((period) => {
                const start = String(period.start_time || "").slice(0, 5);
                const end = String(period.end_time || "").slice(0, 5);
                const coverName = period.cover_teacher_name || period.cover_name;
                return (
                  <View key={period.id} style={{ marginTop: 8 }}>
                    <Hero
                      kicker={`${start}–${end}`}
                      title={period.subject || "Period"}
                      subtitle={
                        coverName
                          ? `Cover: ${coverName}`
                          : period.teacher_name
                          ? `Teacher: ${period.teacher_name}`
                          : "No teacher"
                      }
                    />
                    {coverName ? (
                      <PrimaryButton title="Clear cover" tone="danger" onPress={() => removeCover(period)} />
                    ) : (
                      <PrimaryButton title="Assign cover" tone="navy" onPress={() => openCover(period)} />
                    )}
                  </View>
                );
              })}
            </Card>
          )) : <EmptyState text="No periods on the cover board for this date." />}
        </>
      ) : (board.classes || []).slice(0, 3).map((c) => (
        <Card key={c.label}>
          <Hero kicker="Today" title={c.label} subtitle={`${(c.periods || []).length} periods`} />
        </Card>
      ))}

      <MenuRow title="Class attendance" subtitle="Mark today’s register" onPress={() => navigation.navigate("Attendance")} />
      <MenuRow title="Homework" onPress={() => navigation.navigate("Assignments")} />
      <MenuRow title="Exams & marks" onPress={() => navigation.navigate("Exams")} />
      <MenuRow title="Timetable" onPress={() => navigation.navigate("Timetable")} />
      <MenuRow title="Notices" onPress={() => navigation.navigate("Notices")} />
      <MenuRow title="Class admissions" onPress={() => navigation.navigate("Enrollments")} />
      <MenuRow title="Chat" onPress={() => navigation.navigate("Chat")} />

      <FormModal
        visible={!!coverPick}
        title="Assign cover teacher"
        onClose={() => setCoverPick(null)}
        onSave={() => {}}
        saving={coverSaving}
        error={error}
        hideSave
      >
        <Hero
          kicker={`${String(coverPick?.start_time || "").slice(0, 5)}–${String(coverPick?.end_time || "").slice(0, 5)}`}
          title={coverPick?.subject || "Period"}
          subtitle={coverPick?.class_name || ""}
        />
        {freeTeachers.length ? freeTeachers.map((t) => (
          <PrimaryButton
            key={t.id}
            title={t.name || `Teacher #${t.id}`}
            onPress={() => assignCover(t.id)}
            disabled={coverSaving}
          />
        )) : <EmptyState text="No free teachers for this period." />}
      </FormModal>
    </Screen>
  );
}
