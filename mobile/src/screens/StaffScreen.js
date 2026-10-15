import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createPayroll, createStaff, deletePayroll, deleteStaff, getPayroll, getStaff, updateStaff } from "../api";
import { Badge, Card, ChipSelect, EmptyState, ErrorText, Field, FormModal, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar, StatRow } from "../components/ui";
import { apiError, asList, money, todayISO } from "../utils";

const ROLES = ["Admin", "Accountant", "Clerk", "Receptionist", "Librarian", "Lab Assistant", "Driver", "Security", "Other"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function StaffScreen() {
  const [tab, setTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [pay, setPay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "Other", shift: "Morning", phone: "", salary: "", joining_date: todayISO(), status: "Active" });
  const [payForm, setPayForm] = useState({ staff: "", month: MONTHS[new Date().getMonth()], year: String(new Date().getFullYear()), amount_paid: "", bonus: "0", deduction: "0", payment_method: "Cash", payment_date: todayISO(), status: "Paid" });
  const [payOpen, setPayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([getStaff(), getPayroll()]);
      setStaff(asList(s.data));
      setPay(asList(p.data));
    } catch (err) {
      setError(apiError(err, "Could not load staff."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = staff.filter((r) => [r.name, r.role, r.phone].join(" ").toLowerCase().includes(q.toLowerCase()));

  const saveStaff = async () => {
    setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary) || 0 };
      if (editingId) await updateStaff(editingId, payload);
      else await createStaff(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save staff."));
    } finally {
      setSaving(false);
    }
  };

  const savePay = async () => {
    setSaving(true);
    try {
      await createPayroll({ ...payForm, staff: Number(payForm.staff), amount_paid: Number(payForm.amount_paid) || 0, bonus: Number(payForm.bonus) || 0, deduction: Number(payForm.deduction) || 0 });
      setPayOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save payroll."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="HR" title="Staff & payroll" right={<PrimaryButton title={tab === "staff" ? "Add staff" : "Add pay"} onPress={() => (tab === "staff" ? (setEditingId(null), setOpen(true)) : setPayOpen(true))} />} />
      <ChipSelect label="View" value={tab} options={[{ value: "staff", label: "Staff" }, { value: "pay", label: "Payroll" }]} onChange={setTab} />
      <StatRow items={[{ label: "Staff", value: staff.length, tone: "orange" }, { label: "Payslips", value: pay.length, tone: "green" }]} />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>
      {tab === "staff" ? (
        filtered.length ? filtered.map((r) => (
          <Card key={r.id}>
            <Hero kicker={r.role} title={r.name} subtitle={[r.shift, r.phone, r.salary && money(r.salary)].filter(Boolean).join(" · ")} />
            <Badge status={r.status} label={r.status} />
            <PrimaryButton title="Edit" tone="navy" onPress={() => { setEditingId(r.id); setForm({ ...form, ...r, salary: String(r.salary || "") }); setOpen(true); }} />
            <PrimaryButton title="Delete" tone="danger" onPress={() => Alert.alert("Delete", r.name, [{ text: "Cancel" }, { text: "Delete", onPress: async () => { await deleteStaff(r.id); load(); } }])} />
          </Card>
        )) : <EmptyState />
      ) : (
        pay.length ? pay.map((p) => (
          <Card key={p.id}>
            <Hero kicker={`${p.month} ${p.year}`} title={p.staff_name || `Staff #${p.staff}`} subtitle={money(p.net_amount ?? p.amount_paid)} />
            <Badge status={p.status} label={p.status} />
            <PrimaryButton title="Delete" tone="danger" onPress={() => deletePayroll(p.id).then(load)} />
          </Card>
        )) : <EmptyState text="No payroll rows." />
      )}

      <FormModal visible={open} title="Staff" onClose={() => setOpen(false)} onSave={saveStaff} saving={saving} error={error}>
        <Field label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <ChipSelect label="Role" value={form.role} options={ROLES} onChange={(v) => setForm({ ...form, role: v })} />
        <ChipSelect label="Shift" value={form.shift} options={["Morning", "Evening", "Full day"]} onChange={(v) => setForm({ ...form, shift: v })} />
        <Field label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
        <Field label="Salary" value={form.salary} onChangeText={(v) => setForm({ ...form, salary: v })} keyboardType="numeric" />
        <Field label="Joining date" value={form.joining_date} onChangeText={(v) => setForm({ ...form, joining_date: v })} />
        <ChipSelect label="Status" value={form.status} options={["Active", "Inactive"]} onChange={(v) => setForm({ ...form, status: v })} />
      </FormModal>
      <FormModal visible={payOpen} title="Payroll" onClose={() => setPayOpen(false)} onSave={savePay} saving={saving} error={error}>
        <ChipSelect label="Staff" value={String(payForm.staff)} options={staff.map((s) => ({ value: String(s.id), label: s.name }))} onChange={(v) => setPayForm({ ...payForm, staff: v })} />
        <ChipSelect label="Month" value={payForm.month} options={MONTHS} onChange={(v) => setPayForm({ ...payForm, month: v })} />
        <Field label="Year" value={payForm.year} onChangeText={(v) => setPayForm({ ...payForm, year: v })} />
        <Field label="Amount" value={payForm.amount_paid} onChangeText={(v) => setPayForm({ ...payForm, amount_paid: v })} keyboardType="numeric" />
        <Field label="Bonus" value={payForm.bonus} onChangeText={(v) => setPayForm({ ...payForm, bonus: v })} keyboardType="numeric" />
        <Field label="Deduction" value={payForm.deduction} onChangeText={(v) => setPayForm({ ...payForm, deduction: v })} keyboardType="numeric" />
      </FormModal>
    </Screen>
  );
}
