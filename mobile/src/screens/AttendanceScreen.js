import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import {
  bulkMarkAttendance,
  bulkMarkTeacherAttendance,
  getAttendance,
  getClasses,
  getMyTeacherProfile,
  getStudents,
  getTeacherAttendance,
  getTeachers,
} from "../api";
import { ChipSelect, EmptyState, ErrorText, Field, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar, StatRow } from "../components/ui";
import { Card } from "../components/ui";
import { apiError, asList, classLabel, isSchoolAdmin, todayISO, unique } from "../utils";
import { useTheme } from "../theme/ThemeContext";

const STATUSES = ["Present", "Absent", "Late", "Leave"];

function Register({ people, marks, setMarks, keyName, titleOf, metaOf }) {
  return people.map((p) => (
    <Card key={p.id}>
      <Hero kicker={metaOf(p)} title={titleOf(p)} />
      <ChipSelect
        label="Status"
        value={marks[p.id] || ""}
        options={STATUSES}
        onChange={(v) => setMarks((prev) => ({ ...prev, [p.id]: v }))}
      />
    </Card>
  ));
}

export default function AttendanceScreen() {
  const { role } = useAuth();
  const { colors } = useTheme();
  const adminMode = isSchoolAdmin(role);
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [people, setPeople] = useState([]);
  const [marks, setMarks] = useState({});
  const [classFilter, setClassFilter] = useState("All");
  const [incharge, setIncharge] = useState([]);
  const [classOptions, setClassOptions] = useState([]);

  const load = async () => {
    setError("");
    try {
      if (adminMode) {
        const [tRes, aRes] = await Promise.all([getTeachers(), getTeacherAttendance({ date })]);
        const teachers = asList(tRes.data).filter((t) => (t.status || "Active") === "Active");
        setPeople(teachers);
        const next = {};
        asList(aRes.data).forEach((row) => { next[row.teacher] = row.status; });
        setMarks(next);
      } else {
        const [sRes, aRes, cRes, pRes] = await Promise.all([
          getStudents(),
          getAttendance({ date }),
          getClasses().catch(() => ({ data: [] })),
          getMyTeacherProfile().catch(() => ({ data: null })),
        ]);
        const scope = pRes?.data?.classroom_scope || {};
        const inc = asList(scope.incharge_classes);
        setIncharge(inc);
        const labels = unique([...asList(cRes.data).map(classLabel), ...asList(sRes.data).map((s) => s.class_name)]);
        const allowed = inc.length ? labels.filter((l) => inc.includes(l)) : labels;
        setClassOptions(["All", ...allowed]);
        const students = asList(sRes.data).filter((s) => (s.status || "Active") === "Active")
          .filter((s) => !inc.length || inc.includes(s.class_name));
        setPeople(students);
        const next = {};
        asList(aRes.data).forEach((row) => { next[row.student] = row.status; });
        setMarks(next);
      }
    } catch (err) {
      setError(apiError(err, "Could not load attendance."));
      setPeople([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [date, adminMode]));

  const visible = useMemo(() => people.filter((p) => {
    const blob = [p.name, p.class_name, p.subject, p.roll_no].join(" ").toLowerCase();
    const matchQ = !q.trim() || blob.includes(q.toLowerCase());
    const matchC = adminMode || classFilter === "All" || p.class_name === classFilter;
    return matchQ && matchC;
  }), [people, q, classFilter, adminMode]);

  const counts = visible.reduce((acc, p) => {
    const st = marks[p.id];
    if (st && acc[st] != null) acc[st] += 1;
    else acc.Unmarked += 1;
    return acc;
  }, { Present: 0, Absent: 0, Late: 0, Leave: 0, Unmarked: 0 });

  const save = async () => {
    const records = visible.filter((p) => marks[p.id]).map((p) => (
      adminMode
        ? { teacher_id: p.id, status: marks[p.id], remarks: "", date }
        : { student_id: p.id, status: marks[p.id], remarks: "", date }
    ));
    if (!records.length) return setError("Mark at least one person before saving.");
    setSaving(true);
    try {
      if (adminMode) await bulkMarkTeacherAttendance(records);
      else await bulkMarkAttendance(records);
      setError("");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save attendance."));
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const next = { ...marks };
    visible.forEach((p) => { next[p.id] = status; });
    setMarks(next);
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero
        kicker={adminMode ? "Staff" : "Class register"}
        title={adminMode ? "Teacher attendance" : "Class attendance"}
        subtitle={adminMode ? "Mark faculty for the selected date." : (incharge.length ? `Incharge classes: ${incharge.join(", ")}` : "Students in your classes.")}
      />
      <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <SearchBar value={q} onChangeText={setQ} />
      {!adminMode && classOptions.length > 1 && (
        <ChipSelect label="Class" value={classFilter} options={classOptions} onChange={setClassFilter} />
      )}
      <StatRow items={[
        { label: "Present", value: counts.Present, tone: "green" },
        { label: "Absent", value: counts.Absent, tone: "navy" },
        { label: "Late / leave", value: counts.Late + counts.Leave, tone: "gold" },
        { label: "Unmarked", value: counts.Unmarked, tone: "orange" },
      ]} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {STATUSES.map((s) => (
          <PrimaryButton key={s} title={`All ${s}`} tone="navy" onPress={() => markAll(s)} />
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      {visible.length ? (
        <Register
          people={visible}
          marks={marks}
          setMarks={setMarks}
          titleOf={(p) => p.name}
          metaOf={(p) => adminMode ? (p.subject || p.designation) : (p.class_name || p.roll_no)}
        />
      ) : <EmptyState text="No people to mark for this filter." />}
      <PrimaryButton title={saving ? "Saving…" : "Save register"} onPress={save} disabled={saving} />
      <View style={{ height: 8, backgroundColor: colors.bg }} />
    </Screen>
  );
}
