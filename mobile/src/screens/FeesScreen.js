import React, { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createFee, deleteFee, getFeeStats, getFees, getStudents, updateFee } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Badge, Card, ChipSelect, EmptyState, ErrorText, Field, FormModal, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar, StatRow } from "../components/ui";
import { apiError, asList, currentMonth, isSchoolAdmin, money, todayISO } from "../utils";

const TYPES = ["Tuition", "Transport", "Admission", "Exam", "Lab", "Other"];
const METHODS = ["Cash", "Bank", "JazzCash", "EasyPaisa", "Cheque"];

export default function FeesScreen() {
  const { role } = useAuth();
  const canManage = isSchoolAdmin(role) || role === "accountant";
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student: "", fee_type: "Tuition", month: currentMonth(), amount: "", paid_amount: "", late_fine: "0", due_date: todayISO(), date: todayISO(), payment_method: "Cash", status: "Paid", remarks: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [f, s, st] = await Promise.all([getFees(), getStudents().catch(() => ({ data: [] })), getFeeStats().catch(() => ({ data: {} }))]);
      setFees(asList(f.data));
      setStudents(asList(s.data));
      setStats(st.data || {});
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load fees."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const nameOf = (id) => students.find((s) => s.id === id)?.name || `Student #${id}`;

  const filtered = useMemo(() => fees.filter((row) => {
    const blob = [nameOf(row.student), row.fee_type, row.month, row.status].join(" ").toLowerCase();
    return (!q.trim() || blob.includes(q.toLowerCase())) && (status === "All" || row.status === status);
  }), [fees, q, status, students]);

  const save = async () => {
    if (!form.student) return setError("Pick a student.");
    if (!form.amount) return setError("Amount is required.");
    setSaving(true);
    try {
      const payload = { ...form, student: Number(form.student), amount: Number(form.amount), paid_amount: Number(form.paid_amount || 0), late_fine: Number(form.late_fine || 0) };
      if (editingId) await updateFee(editingId, payload);
      else await createFee(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save fee."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Accounts" title="Fees" subtitle="Challans, payments, and dues." right={canManage ? <PrimaryButton title="Add" onPress={() => { setEditingId(null); setForm((f) => ({ ...f, student: students[0]?.id || "" })); setOpen(true); }} /> : null} />
      <StatRow items={[
        { label: "Collected", value: money(stats.collected || 0), tone: "green" },
        { label: "Pending", value: money(stats.pending || 0), tone: "gold" },
        { label: "Overdue", value: stats.overdue_count || 0, tone: "navy" },
        { label: "This month", value: money(stats.month_collected || 0), tone: "orange" },
      ]} />
      <SearchBar value={q} onChangeText={setQ} />
      <ChipSelect label="Status" value={status} options={["All", "Paid", "Pending", "Overdue"]} onChange={setStatus} />
      <ErrorText>{error}</ErrorText>
      {filtered.length ? filtered.map((row) => (
        <Card key={row.id}>
          <Hero kicker={row.fee_type} title={nameOf(row.student)} subtitle={`${row.month || ""} · ${money(row.amount)} · paid ${money(row.paid_amount)}`} />
          <Badge status={row.status} label={row.status} />
          {canManage ? (
            <>
              <PrimaryButton title="Edit" tone="navy" onPress={() => { setEditingId(row.id); setForm({ ...row, student: String(row.student) }); setOpen(true); }} />
              <PrimaryButton title="Delete" tone="danger" onPress={() => Alert.alert("Delete", "Delete this fee?", [{ text: "Cancel" }, { text: "Delete", onPress: async () => { await deleteFee(row.id); load(); } }])} />
            </>
          ) : null}
        </Card>
      )) : <EmptyState text="No fee records." />}

      <FormModal visible={open && canManage} title={editingId ? "Edit fee" : "Record fee"} onClose={() => setOpen(false)} onSave={save} saving={saving} error={error}>
        <ChipSelect label="Student" value={String(form.student)} options={students.map((s) => ({ value: String(s.id), label: `${s.name} (${s.class_name || ""})` }))} onChange={(v) => setForm({ ...form, student: v })} />
        <ChipSelect label="Type" value={form.fee_type} options={TYPES} onChange={(v) => setForm({ ...form, fee_type: v })} />
        <Field label="Month (YYYY-MM)" value={form.month} onChangeText={(v) => setForm({ ...form, month: v })} />
        <Field label="Amount" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="numeric" />
        <Field label="Paid amount" value={form.paid_amount} onChangeText={(v) => setForm({ ...form, paid_amount: v })} keyboardType="numeric" />
        <Field label="Late fine" value={form.late_fine} onChangeText={(v) => setForm({ ...form, late_fine: v })} keyboardType="numeric" />
        <ChipSelect label="Method" value={form.payment_method} options={METHODS} onChange={(v) => setForm({ ...form, payment_method: v })} />
        <ChipSelect label="Status" value={form.status} options={["Paid", "Pending", "Overdue"]} onChange={(v) => setForm({ ...form, status: v })} />
        <Field label="Due date" value={form.due_date} onChangeText={(v) => setForm({ ...form, due_date: v })} />
        <Field label="Remarks" value={form.remarks} onChangeText={(v) => setForm({ ...form, remarks: v })} />
      </FormModal>
    </Screen>
  );
}
