import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { approvePlan, getPlans, getSchools, rejectPlan } from "../api";
import { Badge, Card, EmptyState, ErrorText, Hero, LoadingBlock, PrimaryButton, Screen, StatRow } from "../components/ui";
import { apiError, asList, money } from "../utils";

export default function PlansScreen() {
  const [plans, setPlans] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        getPlans().catch(() => ({ data: [] })),
        getSchools().catch(() => ({ data: [] })),
      ]);
      setPlans(asList(p.data));
      setSchools(asList(s.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load plans."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const pending = schools.filter((s) => String(s.plan_status || "").toLowerCase() === "pending");
  const active = schools.filter((s) => String(s.plan_status || "").toLowerCase() === "active");

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Platform" title="Plans" subtitle="Catalog and pending school subscriptions." />
      <StatRow items={[
        { label: "Catalog", value: plans.length, tone: "orange" },
        { label: "Active", value: active.length, tone: "green" },
        { label: "Pending", value: pending.length, tone: "gold" },
      ]} />
      <ErrorText>{error}</ErrorText>

      <Hero kicker="Catalog" title="Available plans" />
      {plans.length ? plans.map((plan) => (
        <Card key={plan.id || plan.code || plan.name}>
          <Hero
            kicker={plan.code || plan.plan_type || "Plan"}
            title={plan.name || plan.plan_type || "Plan"}
            subtitle={plan.price != null ? money(plan.price) : plan.description || ""}
          />
          <Badge status={plan.is_active === false ? "Inactive" : "Active"} label={plan.is_active === false ? "Inactive" : "Active"} />
        </Card>
      )) : <EmptyState text="No plan catalog entries." />}

      <Hero kicker="Approvals" title="Pending plan requests" />
      {pending.length ? pending.map((s) => (
        <Card key={s.id}>
          <Hero
            kicker={s.plan_type || "Plan"}
            title={s.name}
            subtitle={[s.domain, s.transaction_id ? `Txn ${s.transaction_id}` : ""].filter(Boolean).join(" · ")}
          />
          <Badge status={s.plan_status} label={s.plan_status} />
          <PrimaryButton title="Approve plan" onPress={async () => { try { await approvePlan(s.id); load(); } catch (err) { setError(apiError(err)); } }} />
          <PrimaryButton title="Reject plan" tone="danger" onPress={async () => { try { await rejectPlan(s.id); load(); } catch (err) { setError(apiError(err)); } }} />
        </Card>
      )) : <EmptyState text="No pending plan requests." />}
    </Screen>
  );
}
