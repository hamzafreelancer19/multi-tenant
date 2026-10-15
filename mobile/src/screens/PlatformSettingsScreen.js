import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getPlatformSettings, updatePlatformSettings } from "../api";
import { ChipSelect, ErrorText, Field, Hero, LoadingBlock, PrimaryButton, Screen } from "../components/ui";
import { apiError } from "../utils";

const EMPTY = {
  name: "Classora",
  support_email: "",
  support_phone: "",
  allow_signup: true,
  maintenance_mode: false,
};

export default function PlatformSettingsScreen() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const res = await getPlatformSettings();
      const data = res.data || {};
      setForm({
        name: data.name || "Classora",
        support_email: data.support_email || "",
        support_phone: data.support_phone || "",
        allow_signup: data.allow_signup !== false,
        maintenance_mode: !!data.maintenance_mode,
      });
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load platform settings."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await updatePlatformSettings(form);
      setMsg("Platform settings saved.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save settings."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Platform" title="Settings" subtitle="Signup, support contacts, and maintenance." />
      <ErrorText>{error}</ErrorText>
      {!!msg && <Hero kicker="OK" title={msg} />}
      <Field label="Platform name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <Field label="Support email" value={form.support_email} onChangeText={(v) => setForm({ ...form, support_email: v })} />
      <Field label="Support phone" value={form.support_phone} onChangeText={(v) => setForm({ ...form, support_phone: v })} />
      <ChipSelect
        label="Allow school signup"
        value={form.allow_signup ? "Yes" : "No"}
        options={["Yes", "No"]}
        onChange={(v) => setForm({ ...form, allow_signup: v === "Yes" })}
      />
      <ChipSelect
        label="Maintenance mode"
        value={form.maintenance_mode ? "On" : "Off"}
        options={["On", "Off"]}
        onChange={(v) => setForm({ ...form, maintenance_mode: v === "On" })}
      />
      <PrimaryButton title={saving ? "Saving…" : "Save"} onPress={save} disabled={saving} />
    </Screen>
  );
}
