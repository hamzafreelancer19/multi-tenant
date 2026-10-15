import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { acceptEnrollment, deleteEnrollment, getEnrollments, rejectEnrollment, submitEnrollmentTest } from "../api";
import { Badge, Card, ChipSelect, EmptyState, ErrorText, Field, FormModal, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar } from "../components/ui";
import { apiError, asList, isSchoolAdmin, todayISO } from "../utils";

export default function EnrollmentsScreen() {
  const { role } = useAuth();
  const admin = isSchoolAdmin(role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ test_score: "", test_total: "100", test_date: todayISO(), test_notes: "" });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const load = async () => {
    try {
      const res = await getEnrollments();
      setRows(asList(res.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load admissions."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = rows.filter((e) => {
    const blob = [e.student_name, e.father_name, e.class_applying].join(" ").toLowerCase();
    const matchQ = !q.trim() || blob.includes(q.toLowerCase());
    const matchT = tab === "All" || e.status === tab || (tab === "PendingIncharge" && ["Pending", "PendingIncharge"].includes(e.status));
    return matchQ && matchT;
  });

  const onAccept = async (row) => {
    try {
      const res = await acceptEnrollment(row.id);
      if (res.data?.parent_username) setCreated(res.data);
      await load();
    } catch (err) {
      Alert.alert("Accept", apiError(err, "Failed to accept."));
    }
  };

  const onTest = async () => {
    setSaving(true);
    try {
      await submitEnrollmentTest(selected.id, {
        test_score: Number(form.test_score),
        test_total: Number(form.test_total) || 100,
        test_date: form.test_date,
        test_notes: form.test_notes,
      });
      setSelected(null);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not submit test."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Admissions" title="Admission requests" subtitle={admin ? "Accept or reject after incharge tests." : "Take class tests and send to admin."} />
      <SearchBar value={q} onChangeText={setQ} />
      <ChipSelect label="Status" value={tab} options={["All", "PendingIncharge", "PendingAdmin", "Accepted", "Rejected"]} onChange={setTab} />
      <ErrorText>{error}</ErrorText>
      {created ? <Card><Hero title="Logins created" subtitle={`Parent ${created.parent_username} · Student ${created.student_username}`} /><PrimaryButton title="OK" onPress={() => setCreated(null)} /></Card> : null}
      {filtered.length ? filtered.map((row) => (
        <Card key={row.id}>
          <Hero kicker={row.class_applying} title={row.student_name} subtitle={row.father_name} />
          <Badge status={row.status} label={row.status} />
          {admin && row.status === "PendingAdmin" && (
            <>
              <PrimaryButton title="Accept" onPress={() => onAccept(row)} />
              <PrimaryButton title="Reject" tone="danger" onPress={() => rejectEnrollment(row.id).then(load)} />
            </>
          )}
          {!admin && ["Pending", "PendingIncharge"].includes(row.status) && (
            <PrimaryButton title="Submit test" onPress={() => { setSelected(row); setForm({ test_score: String(row.test_score || ""), test_total: String(row.test_total || 100), test_date: row.test_date || todayISO(), test_notes: row.test_notes || "" }); }} />
          )}
          {admin && <PrimaryButton title="Delete" tone="danger" onPress={() => deleteEnrollment(row.id).then(load)} />}
        </Card>
      )) : <EmptyState text="No admission requests." />}

      <FormModal visible={!!selected} title="Class test" onClose={() => setSelected(null)} onSave={onTest} saving={saving} error={error}>
        <Field label="Score" value={form.test_score} onChangeText={(v) => setForm({ ...form, test_score: v })} keyboardType="numeric" />
        <Field label="Total" value={form.test_total} onChangeText={(v) => setForm({ ...form, test_total: v })} keyboardType="numeric" />
        <Field label="Date" value={form.test_date} onChangeText={(v) => setForm({ ...form, test_date: v })} />
        <Field label="Notes" value={form.test_notes} onChangeText={(v) => setForm({ ...form, test_notes: v })} multiline />
      </FormModal>
    </Screen>
  );
}
