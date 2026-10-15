import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSchools, updateSchool } from "../api";
import { useAuth } from "../auth/AuthContext";
import { rootNavigate } from "../navigation/rootNav";
import { ErrorText, Field, Hero, LoadingBlock, PrimaryButton, Screen } from "../components/ui";
import { apiError, asList } from "../utils";
import { getDefaultTenantDomain } from "../config";

export default function SettingsScreen() {
  const { user } = useAuth();
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState({ name: "", landing_contact_email: "", landing_contact_phone: "" });
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const res = await getSchools();
      const schools = asList(res.data);
      const mine = schools.find((s) => s.id === Number(user?.school) || s.id === Number(user?.school_id)) || schools[0];
      setSchool(mine || null);
      setForm({
        name: mine?.name || "",
        landing_contact_email: mine?.landing_contact_email || "",
        landing_contact_phone: mine?.landing_contact_phone || "",
      });
      const stored = await AsyncStorage.getItem("schoolDomain");
      setDomain(stored || mine?.domain || getDefaultTenantDomain());
    } catch (err) {
      setError(apiError(err, "Could not load school settings."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    if (!school) return;
    setSaving(true);
    try {
      await updateSchool(school.id, form);
      setMsg("Settings saved.");
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
      <Hero kicker="School" title="Settings" subtitle={school?.plan_type ? `Plan: ${school.plan_type} · ${school.plan_status}` : "School profile"} />
      <PrimaryButton title="Manage subscription" tone="navy" onPress={() => rootNavigate("Subscription")} />
      <ErrorText>{error}</ErrorText>
      {!!msg && <Hero kicker="OK" title={msg} />}
      <Field label="School name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <Field label="Contact email" value={form.landing_contact_email} onChangeText={(v) => setForm({ ...form, landing_contact_email: v })} />
      <Field label="Contact phone" value={form.landing_contact_phone} onChangeText={(v) => setForm({ ...form, landing_contact_phone: v })} />
      <Field label="X-Tenant-Domain" value={domain} onChangeText={setDomain} placeholder="localhost or school.example.com" />
      <PrimaryButton
        title="Save tenant domain"
        tone="navy"
        onPress={async () => {
          await AsyncStorage.setItem("schoolDomain", domain.trim());
          setMsg("Tenant domain saved for API requests.");
        }}
      />
      <PrimaryButton title={saving ? "Saving…" : "Save"} onPress={save} disabled={saving || !school} />
    </Screen>
  );
}
