import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { changePassword, getUserProfile, updateUserProfile } from "../api";
import { ErrorText, Field, Hero, LoadingBlock, PrimaryButton, Screen } from "../components/ui";
import { apiError, displayName, roleLabel } from "../utils";

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await getUserProfile();
      await setUser(res.data);
      setForm({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
      });
    } catch (err) {
      setError(apiError(err, "Could not load profile."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await updateUserProfile(form);
      await setUser(res.data);
      setMsg("Profile saved.");
    } catch (err) {
      setError(apiError(err, "Could not save profile."));
    } finally {
      setSaving(false);
    }
  };

  const savePw = async () => {
    if (pw.new_password !== pw.confirm) return setError("New passwords do not match.");
    setSaving(true);
    try {
      await changePassword({ current_password: pw.current_password, new_password: pw.new_password });
      setMsg("Password changed.");
      setPw({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setError(apiError(err, "Could not change password."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker={roleLabel(user?.role)} title={displayName(user)} subtitle={user?.school_name || user?.email} />
      <ErrorText>{error}</ErrorText>
      {!!msg && <Hero kicker="Saved" title={msg} />}
      <Field label="First name" value={form.first_name} onChangeText={(v) => setForm({ ...form, first_name: v })} />
      <Field label="Last name" value={form.last_name} onChangeText={(v) => setForm({ ...form, last_name: v })} />
      <Field label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
      <Field label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
      <PrimaryButton title={saving ? "Saving…" : "Save profile"} onPress={save} disabled={saving} />
      <Hero kicker="Security" title="Password" />
      <Field label="Current password" value={pw.current_password} onChangeText={(v) => setPw({ ...pw, current_password: v })} secure />
      <Field label="New password" value={pw.new_password} onChangeText={(v) => setPw({ ...pw, new_password: v })} secure />
      <Field label="Confirm" value={pw.confirm} onChangeText={(v) => setPw({ ...pw, confirm: v })} secure />
      <PrimaryButton title="Change password" tone="navy" onPress={savePw} />
      <PrimaryButton title="Log out" tone="danger" onPress={logout} />
    </Screen>
  );
}
