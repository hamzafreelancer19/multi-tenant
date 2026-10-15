import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createExam, deleteExam, getClasses, getExamResults, getExams, getStudents, saveExamResults, updateExam } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Badge, Card, ChipSelect, EmptyState, ErrorText, Field, FormModal, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar } from "../components/ui";
import { apiError, asList, classLabel, formatDate, isSchoolAdmin, todayISO, unique } from "../utils";

const TYPES = ["Midterm", "Final", "Monthly", "Quiz", "Other"];
const SUBJECTS = ["Mathematics", "English", "Urdu", "Physics", "Chemistry", "Biology", "Computer Science", "Islamiat", "Pakistan Studies", "General"];

export default function ExamsScreen() {
  const { role } = useAuth();
  const canManage = isSchoolAdmin(role) || role === "teacher";
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", class_name: "", exam_type: "Monthly", subject: "Mathematics", start_date: todayISO(), end_date: todayISO(), total_marks: "100", venue: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [marksExam, setMarksExam] = useState(null);
  const [marks, setMarks] = useState({});

  const load = async () => {
    try {
      const [e, s, c] = await Promise.all([getExams(), getStudents().catch(() => ({ data: [] })), getClasses().catch(() => ({ data: [] }))]);
      setExams(asList(e.data));
      setStudents(asList(s.data));
      setClasses(asList(c.data));
    } catch (err) {
      setError(apiError(err, "Could not load exams."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const classOptions = unique([...classes.map(classLabel), ...students.map((s) => s.class_name)]);
  const filtered = exams.filter((row) => [row.title, row.subject, row.class_name].join(" ").toLowerCase().includes(q.toLowerCase()));

  const save = async () => {
    if (!form.title.trim()) return setError("Title is required.");
    setSaving(true);
    try {
      const payload = { ...form, total_marks: Number(form.total_marks) || 100 };
      if (editingId) await updateExam(editingId, payload);
      else await createExam(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save exam."));
    } finally {
      setSaving(false);
    }
  };

  const openMarks = async (exam) => {
    setMarksExam(exam);
    try {
      const res = await getExamResults(exam.id);
      const next = {};
      asList(res.data?.results || res.data).forEach((r) => { next[r.student] = String(r.marks ?? r.obtained ?? ""); });
      setMarks(next);
    } catch {
      setMarks({});
    }
  };

  const saveMarks = async () => {
    const classStudents = students.filter((s) => (s.status || "Active") === "Active" && s.class_name === marksExam.class_name);
    const results = classStudents.filter((s) => marks[s.id] !== undefined && marks[s.id] !== "").map((s) => ({
      student: s.id,
      marks: Number(marks[s.id]) || 0,
    }));
    setSaving(true);
    try {
      await saveExamResults(marksExam.id, { subject: marksExam.subject || "General", total_marks: marksExam.total_marks || 100, results });
      setMarksExam(null);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Academics" title="Exams" subtitle="Schedule papers and enter marks." right={canManage ? <PrimaryButton title="Add" onPress={() => { setEditingId(null); setForm((f) => ({ ...f, class_name: classOptions[0] || "" })); setOpen(true); }} /> : null} />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>
      {filtered.length ? filtered.map((exam) => (
        <Card key={exam.id}>
          <Hero kicker={exam.class_name} title={exam.title} subtitle={`${exam.subject} · ${formatDate(exam.start_date)}`} />
          <Badge label={exam.exam_type} status="Pending" />
          {canManage ? (
            <>
              <PrimaryButton title="Enter marks" onPress={() => openMarks(exam)} />
              <PrimaryButton title="Edit" tone="navy" onPress={() => { setEditingId(exam.id); setForm({ ...exam, total_marks: String(exam.total_marks || 100) }); setOpen(true); }} />
              <PrimaryButton title="Delete" tone="danger" onPress={() => Alert.alert("Delete", `Delete ${exam.title}?`, [{ text: "Cancel" }, { text: "Delete", onPress: async () => { await deleteExam(exam.id); load(); } }])} />
            </>
          ) : null}
        </Card>
      )) : <EmptyState text="No exams yet." />}

      <FormModal visible={open && canManage} title={editingId ? "Edit exam" : "New exam"} onClose={() => setOpen(false)} onSave={save} saving={saving} error={error}>
        <Field label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <ChipSelect label="Class" value={form.class_name} options={classOptions} onChange={(v) => setForm({ ...form, class_name: v })} />
        <ChipSelect label="Type" value={form.exam_type} options={TYPES} onChange={(v) => setForm({ ...form, exam_type: v })} />
        <ChipSelect label="Subject" value={form.subject} options={SUBJECTS} onChange={(v) => setForm({ ...form, subject: v })} />
        <Field label="Start date" value={form.start_date} onChangeText={(v) => setForm({ ...form, start_date: v })} />
        <Field label="End date" value={form.end_date} onChangeText={(v) => setForm({ ...form, end_date: v })} />
        <Field label="Total marks" value={form.total_marks} onChangeText={(v) => setForm({ ...form, total_marks: v })} keyboardType="numeric" />
        <Field label="Venue" value={form.venue} onChangeText={(v) => setForm({ ...form, venue: v })} />
        <Field label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
      </FormModal>

      <FormModal visible={!!marksExam && canManage} title={`Marks · ${marksExam?.title || ""}`} onClose={() => setMarksExam(null)} onSave={saveMarks} saving={saving} error={error}>
        {students.filter((s) => s.class_name === marksExam?.class_name).map((s) => (
          <Field key={s.id} label={s.name} value={marks[s.id] || ""} onChangeText={(v) => setMarks((p) => ({ ...p, [s.id]: v }))} keyboardType="numeric" />
        ))}
      </FormModal>
    </Screen>
  );
}
