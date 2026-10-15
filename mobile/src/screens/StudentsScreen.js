import React, { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { createStudent, deleteStudent, getClasses, getStudents, setParentLogin, updateStudent } from "../api";
import { Badge, Card, ChipSelect, EmptyState, ErrorText, Field, FormModal, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar, StatRow } from "../components/ui";
import { apiError, asList, classLabel, isSchoolAdmin, unique } from "../utils";

const EMPTY = {
  name: "", class_name: "", gender: "", date_of_birth: "", bform_cnic: "", previous_school: "",
  email: "", phone: "", address: "", city: "", father_name: "", father_phone: "", father_cnic: "",
  father_occupation: "", mother_name: "", mother_phone: "", emergency_phone: "", notes: "", status: "Active",
};

export default function StudentsScreen() {
  const { role } = useAuth();
  const canManage = isSchoolAdmin(role);
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loginInfo, setLoginInfo] = useState(null);

  const classOptions = useMemo(() => unique([...classes.map(classLabel), ...rows.map((s) => s.class_name)]), [classes, rows]);

  const load = async () => {
    try {
      const [s, c] = await Promise.all([getStudents(), getClasses().catch(() => ({ data: [] }))]);
      setRows(asList(s.data));
      setClasses(asList(c.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load students."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = rows.filter((s) => {
    const blob = [s.name, s.class_name, s.roll_no, s.father_name, s.phone].join(" ").toLowerCase();
    const matchQ = !q.trim() || blob.includes(q.toLowerCase());
    const matchS = status === "All" || (s.status || "Active") === status;
    return matchQ && matchS;
  });

  const stats = {
    total: rows.length,
    active: rows.filter((s) => (s.status || "Active") === "Active").length,
    inactive: rows.filter((s) => (s.status || "Active") !== "Active").length,
  };

  const save = async () => {
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.class_name) return setError("Class is required.");
    setSaving(true);
    try {
      const payload = { ...form, date_of_birth: form.date_of_birth || null, email: form.email || null };
      if (editingId) await updateStudent(editingId, payload);
      else {
        const res = await createStudent(payload);
        if (res.data?.parent_username || res.data?.student_username) {
          setLoginInfo(res.data);
        }
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save student."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Directory" title="Students" subtitle="Records, guardians, and parent logins." right={canManage ? <PrimaryButton title="Add" onPress={() => { setForm({ ...EMPTY, class_name: classOptions[0] || "" }); setEditingId(null); setOpen(true); }} /> : null} />
      <StatRow items={[
        { label: "Total", value: stats.total, tone: "orange" },
        { label: "Active", value: stats.active, tone: "green" },
        { label: "Inactive", value: stats.inactive, tone: "navy" },
      ]} />
      <SearchBar value={q} onChangeText={setQ} placeholder="Search name, class, parent" />
      <ChipSelect label="Status" value={status} options={["All", "Active", "Inactive"]} onChange={setStatus} />
      <ErrorText>{error}</ErrorText>
      {loginInfo ? (
        <Card>
          <Hero title="Portal logins created" subtitle={`${loginInfo.student_username || ""} / ${loginInfo.parent_username || ""}`} />
          <PrimaryButton title="Dismiss" tone="navy" onPress={() => setLoginInfo(null)} />
        </Card>
      ) : null}
      {filtered.length ? filtered.map((s) => (
        <Card key={s.id}>
          <Hero kicker={s.class_name} title={s.name} subtitle={[s.roll_no, s.father_name, s.father_phone].filter(Boolean).join(" · ")} />
          <Badge status={s.status || "Active"} label={s.status || "Active"} />
          {canManage && (
            <View>
              <PrimaryButton title="Edit" tone="navy" onPress={() => { setForm({ ...EMPTY, ...s, date_of_birth: s.date_of_birth || "" }); setEditingId(s.id); setOpen(true); }} />
              <PrimaryButton title="Create parent login" onPress={async () => {
                try {
                  const res = await setParentLogin(s.id);
                  setLoginInfo(res.data || {});
                } catch (err) {
                  Alert.alert("Login", apiError(err, "Could not create parent login."));
                }
              }} />
              <PrimaryButton title="Delete" tone="danger" onPress={() => Alert.alert("Delete", `Delete ${s.name}?`, [
                { text: "Cancel" },
                { text: "Delete", style: "destructive", onPress: async () => { await deleteStudent(s.id); load(); } },
              ])} />
            </View>
          )}
        </Card>
      )) : <EmptyState text="No students match this filter." />}

      <FormModal visible={open} title={editingId ? "Edit student" : "Add student"} onClose={() => setOpen(false)} onSave={save} saving={saving} error={error}>
        <Field label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <ChipSelect label="Class" value={form.class_name} options={classOptions} onChange={(v) => setForm({ ...form, class_name: v })} />
        <ChipSelect label="Gender" value={form.gender} options={["Male", "Female"]} onChange={(v) => setForm({ ...form, gender: v })} />
        <ChipSelect label="Status" value={form.status} options={["Active", "Inactive"]} onChange={(v) => setForm({ ...form, status: v })} />
        <Field label="Date of birth (YYYY-MM-DD)" value={form.date_of_birth} onChangeText={(v) => setForm({ ...form, date_of_birth: v })} />
        <Field label="B-Form / CNIC" value={form.bform_cnic} onChangeText={(v) => setForm({ ...form, bform_cnic: v })} />
        <Field label="Father / guardian" value={form.father_name} onChangeText={(v) => setForm({ ...form, father_name: v })} />
        <Field label="Guardian phone" value={form.father_phone} onChangeText={(v) => setForm({ ...form, father_phone: v })} />
        <Field label="Guardian CNIC" value={form.father_cnic} onChangeText={(v) => setForm({ ...form, father_cnic: v })} />
        <Field label="Occupation" value={form.father_occupation} onChangeText={(v) => setForm({ ...form, father_occupation: v })} />
        <Field label="Mother" value={form.mother_name} onChangeText={(v) => setForm({ ...form, mother_name: v })} />
        <Field label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
        <Field label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
        <Field label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
        <Field label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} multiline />
        <Field label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
      </FormModal>
    </Screen>
  );
}
