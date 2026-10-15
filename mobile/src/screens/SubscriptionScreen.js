import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { buyPlan, getPlans, getSchools } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Badge, Card, ChipSelect, EmptyState, ErrorText, Field, Hero, LoadingBlock, PrimaryButton, Screen, StatRow } from "../components/ui";
import { apiError, asList, formatDate, money } from "../utils";

const FALLBACK = [
  { id: "Basic", name: "Basic Plan", price: 1500 },
  { id: "Business", name: "Business Plan", price: 3500 },
  { id: "Pro", name: "Ultimate Pro", price: 6000 },
];

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const [school, setSchool] = useState(null);
  const [plans, setPlans] = useState(FALLBACK);
  const [selected, setSelected] = useState("Business");
  const [txn, setTxn] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [s, p] = await Promise.all([
        getSchools(),
        getPlans().catch(() => ({ data: [] })),
      ]);
      const schools = asList(s.data);
      const mine =
        schools.find((row) => row.id === Number(user?.school) || row.id === Number(user?.school_id)) ||
        schools[0];
      setSchool(mine || null);
      const catalog = asList(p.data);
      if (catalog.length) {
        setPlans(
          catalog.map((row) => ({
            id: row.plan_type || row.name || row.code || String(row.id),
            planId: row.id,
            name: row.name || row.plan_type || "Plan",
            price: row.price ?? row.amount ?? 0,
          }))
        );
      } else {
        setPlans(FALLBACK);
      }
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load subscription."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const submit = async () => {
    if (!school) return setError("School not found.");
    if (!selected) return setError("Select a plan.");
    if (!txn.trim()) return setError("Enter your transaction ID.");
    setSaving(true);
    setMsg("");
    try {
      const chosen = plans.find((p) => p.id === selected);
      await buyPlan(school.id, {
        plan_type: chosen?.id || selected,
        plan_id: chosen?.planId,
        transaction_id: txn.trim(),
      });
      setMsg("Plan request submitted. Waiting for platform approval.");
      setTxn("");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not submit plan request."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Billing" title="Subscription" subtitle={school?.name || "Your school plan"} />
      <ErrorText>{error}</ErrorText>
      {!!msg && <Hero kicker="OK" title={msg} />}
      {school ? (
        <>
          <StatRow items={[
            { label: "Plan", value: school.plan_type || "None", tone: "orange" },
            { label: "Status", value: school.plan_status || "—", tone: "navy" },
          ]} />
          <Card>
            <Hero
              kicker="Current"
              title={school.plan_type && school.plan_type !== "None" ? school.plan_type : "No active plan"}
              subtitle={`Expires ${formatDate(school.plan_expiry_date) || "—"}`}
            />
            <Badge status={school.plan_status || "Inactive"} label={school.plan_status || "Inactive"} />
          </Card>
        </>
      ) : <EmptyState text="School record not found." />}

      <Hero kicker="Upgrade" title="Request a plan" subtitle="Pay via your bank/wallet, then paste the transaction ID." />
      <ChipSelect label="Plan" value={selected} options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${money(p.price)}` }))} onChange={setSelected} />
      <Field label="Transaction ID" value={txn} onChangeText={setTxn} placeholder="e.g. JazzCash / bank ref" />
      <PrimaryButton title={saving ? "Submitting…" : "Submit request"} onPress={submit} disabled={saving || !school} />
    </Screen>
  );
}
