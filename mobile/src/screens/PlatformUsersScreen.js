import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getPlatformUsers } from "../api";
import { Badge, Card, EmptyState, ErrorText, Hero, LoadingBlock, Screen, SearchBar, StatRow } from "../components/ui";
import { apiError, asList } from "../utils";

export default function PlatformUsersScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await getPlatformUsers();
      setRows(asList(res.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load platform users."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((u) =>
      [u.username, u.email, u.role, u.school_name, u.first_name, u.last_name].join(" ").toLowerCase().includes(query)
    );
  }, [rows, q]);

  const admins = rows.filter((u) => u.role === "admin" || u.role === "schooladmin").length;

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Platform" title="School admins" subtitle="Accounts across all schools." />
      <StatRow items={[
        { label: "Users", value: rows.length, tone: "orange" },
        { label: "Admins", value: admins, tone: "navy" },
      ]} />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>
      {filtered.length ? filtered.map((u) => (
        <Card key={u.id}>
          <Hero kicker={u.school_name || "Platform"} title={u.username} subtitle={u.email || ""} />
          <Badge status={u.role} label={u.role} />
        </Card>
      )) : <EmptyState text="No users found." />}
    </Screen>
  );
}
