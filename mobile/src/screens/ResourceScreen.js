import React, { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Badge,
  Card,
  ChipSelect,
  EmptyState,
  ErrorText,
  Field,
  FormModal,
  Hero,
  LoadingBlock,
  PrimaryButton,
  Screen,
  SearchBar,
} from "../components/ui";
import { apiError, asList } from "../utils";

export default function ResourceScreen({
  kicker,
  title,
  subtitle,
  fetcher,
  creator,
  updater,
  deleter,
  searchKeys = ["name", "title"],
  titleOf = (row) => row.name || row.title,
  metaOf = (row) => row.class_name || row.status || "",
  badgeOf = (row) => row.status,
  fields = [],
  defaults = {},
  canManage = true,
  toPayload,
  emptyText,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(defaults);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError("");
    try {
      const res = await fetcher();
      setRows(asList(res.data));
    } catch (err) {
      setError(apiError(err, "Could not load records."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] || "").toLowerCase().includes(query))
    );
  }, [rows, q, searchKeys]);

  const openAdd = () => {
    setForm({ ...defaults });
    setEditingId(null);
    setOpen(true);
    setError("");
  };

  const openEdit = (row) => {
    const next = { ...defaults };
    fields.forEach((f) => {
      const value = row[f.key];
      next[f.key] = Array.isArray(value) ? value.join(", ") : value == null ? "" : value;
    });
    setForm(next);
    setEditingId(row.id);
    setOpen(true);
    setError("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = toPayload ? toPayload(form) : form;
      if (editingId) await updater(editingId, payload);
      else await creator(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save."));
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    Alert.alert("Delete", `Delete "${titleOf(row)}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleter(row.id);
            await load();
          } catch (err) {
            setError(apiError(err, "Could not delete."));
          }
        },
      },
    ]);
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        right={canManage && creator ? <PrimaryButton title="Add" onPress={openAdd} /> : null}
      />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>
      {filtered.length ? filtered.map((row) => (
        <Card key={row.id} onPress={() => canManage && updater ? openEdit(row) : null}>
          <Hero kicker={metaOf(row)} title={titleOf(row)} subtitle={row.phone || row.email || row.description || ""} />
          {badgeOf(row) ? <Badge status={badgeOf(row)} label={badgeOf(row)} /> : null}
          {canManage && deleter ? (
            <View style={{ marginTop: 8 }}>
              <PrimaryButton title="Delete" tone="danger" onPress={() => remove(row)} />
            </View>
          ) : null}
        </Card>
      )) : <EmptyState text={emptyText} />}

      <FormModal
        visible={open}
        title={editingId ? "Edit" : "Add"}
        onClose={() => setOpen(false)}
        onSave={save}
        saving={saving}
        error={error}
      >
        {fields.map((f) => {
          if (f.type === "select") {
            return (
              <ChipSelect
                key={f.key}
                label={f.label}
                value={form[f.key]}
                options={f.options}
                onChange={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
              />
            );
          }
          return (
            <Field
              key={f.key}
              label={f.label}
              value={form[f.key]}
              onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
              multiline={f.type === "multiline"}
              keyboardType={f.type === "number" ? "numeric" : "default"}
            />
          );
        })}
      </FormModal>
    </Screen>
  );
}
