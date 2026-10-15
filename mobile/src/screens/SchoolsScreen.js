import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { approvePlan, approveSchool, getPlatformUsers, getSchools, rejectPlan, rejectSchool } from "../api";
import { Badge, Card, EmptyState, ErrorText, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar, StatRow } from "../components/ui";
import { apiError, asList } from "../utils";

export default function SchoolsScreen() {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [s, u] = await Promise.all([getSchools(), getPlatformUsers().catch(() => ({ data: [] }))]);
      setSchools(asList(s.data));
      setUsers(asList(u.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load schools."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = schools.filter((s) => [s.name, s.domain, s.plan_type, s.status].join(" ").toLowerCase().includes(q.toLowerCase()));

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Platform" title="Schools" subtitle="Approve schools and plans." />
      <StatRow items={[
        { label: "Schools", value: schools.length, tone: "orange" },
        { label: "Admins", value: users.length, tone: "navy" },
      ]} />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>
      {filtered.length ? filtered.map((s) => (
        <Card key={s.id}>
          <Hero kicker={s.domain || s.plan_type} title={s.name} subtitle={`${s.plan_type || "No plan"} · ${s.plan_status || ""}`} />
          <Badge status={s.status || s.plan_status} label={s.status || s.plan_status || "—"} />
          {s.domain ? (
            <PrimaryButton
              title={`Use tenant ${s.domain}`}
              tone="navy"
              onPress={() => AsyncStorage.setItem("schoolDomain", s.domain)}
            />
          ) : null}
          <PrimaryButton title="Approve school" onPress={() => approveSchool(s.id).then(load)} />
          <PrimaryButton title="Reject school" tone="danger" onPress={() => rejectSchool(s.id).then(load)} />
          <PrimaryButton title="Approve plan" tone="navy" onPress={() => approvePlan(s.id).then(load)} />
          <PrimaryButton title="Reject plan" tone="danger" onPress={() => rejectPlan(s.id).then(load)} />
        </Card>
      )) : <EmptyState />}
      <Hero kicker="Users" title="School admins" />
      {users.slice(0, 30).map((u) => (
        <Card key={u.id}><Hero kicker={u.role} title={u.username} subtitle={u.email} /></Card>
      ))}
    </Screen>
  );
}
