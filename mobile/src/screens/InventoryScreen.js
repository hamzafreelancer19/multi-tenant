import React, { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createItem, createLog, deleteItem, getItems, getLogs, updateItem } from "../api";
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
import { apiError, asList, formatDate } from "../utils";

const EMPTY = {
  item_name: "",
  category: "Stationery",
  quantity: "0",
  unit: "pcs",
  unit_price: "0",
  min_stock: "5",
  location: "",
  supplier: "",
  notes: "",
};

export default function InventoryScreen() {
  const [tab, setTab] = useState("items");
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [logForm, setLogForm] = useState({ item: "", change_type: "Add", quantity: "1", reason: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [i, l] = await Promise.all([
        getItems(),
        getLogs().catch(() => ({ data: [] })),
      ]);
      setItems(asList(i.data));
      setLogs(asList(l.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load inventory."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = items.filter((row) =>
    [row.item_name, row.category, row.location, row.supplier].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const saveItem = async () => {
    if (!form.item_name.trim()) return setError("Item name is required.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        unit_price: Number(form.unit_price) || 0,
        min_stock: Number(form.min_stock) || 0,
      };
      if (editingId) await updateItem(editingId, payload);
      else await createItem(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save item."));
    } finally {
      setSaving(false);
    }
  };

  const saveLog = async () => {
    if (!logForm.item) return setError("Pick an item.");
    if (!Number(logForm.quantity)) return setError("Quantity must be greater than 0.");
    setSaving(true);
    try {
      await createLog({
        item: Number(logForm.item),
        change_type: logForm.change_type,
        quantity: Number(logForm.quantity),
        reason: logForm.reason,
      });
      setLogOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save stock log."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero
        kicker="Stock"
        title="Inventory"
        subtitle="Items, quantities, and stock movements."
        right={
          <PrimaryButton
            title={tab === "items" ? "Add" : "Log"}
            onPress={() => {
              if (tab === "items") {
                setForm({ ...EMPTY });
                setEditingId(null);
                setOpen(true);
              } else {
                setLogForm({ item: items[0] ? String(items[0].id) : "", change_type: "Add", quantity: "1", reason: "" });
                setLogOpen(true);
              }
            }}
          />
        }
      />
      <ChipSelect
        label="View"
        value={tab}
        options={[{ value: "items", label: "Items" }, { value: "logs", label: "Stock logs" }]}
        onChange={setTab}
      />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>

      {tab === "items" ? (
        filtered.length ? filtered.map((row) => (
          <Card key={row.id}>
            <Hero
              kicker={[row.category, row.location].filter(Boolean).join(" · ")}
              title={row.item_name}
              subtitle={`qty ${row.quantity} ${row.unit || ""} · min ${row.min_stock ?? "—"}`}
            />
            <Badge
              status={Number(row.quantity) <= Number(row.min_stock || 0) ? "Overdue" : "Active"}
              label={Number(row.quantity) <= Number(row.min_stock || 0) ? "Low stock" : "OK"}
            />
            <View>
              <PrimaryButton
                title="Edit"
                tone="navy"
                onPress={() => {
                  setEditingId(row.id);
                  setForm({
                    ...EMPTY,
                    ...row,
                    quantity: String(row.quantity ?? 0),
                    unit_price: String(row.unit_price ?? 0),
                    min_stock: String(row.min_stock ?? 0),
                  });
                  setOpen(true);
                }}
              />
              <PrimaryButton
                title="Stock +/-"
                onPress={() => {
                  setLogForm({ item: String(row.id), change_type: "Add", quantity: "1", reason: "" });
                  setLogOpen(true);
                }}
              />
              <PrimaryButton
                title="Delete"
                tone="danger"
                onPress={() =>
                  Alert.alert("Delete", `Delete ${row.item_name}?`, [
                    { text: "Cancel" },
                    { text: "Delete", style: "destructive", onPress: async () => { await deleteItem(row.id); load(); } },
                  ])
                }
              />
            </View>
          </Card>
        )) : <EmptyState text="No inventory items." />
      ) : (
        logs.length ? logs.map((row) => (
          <Card key={row.id}>
            <Hero
              kicker={row.change_type || "Movement"}
              title={row.item_name || `Item #${row.item}`}
              subtitle={`${row.quantity} · ${formatDate(row.date)} · ${row.reason || ""}`}
            />
          </Card>
        )) : <EmptyState text="No stock logs yet." />
      )}

      <FormModal visible={open} title={editingId ? "Edit item" : "Add item"} onClose={() => setOpen(false)} onSave={saveItem} saving={saving} error={error}>
        <Field label="Item name" value={form.item_name} onChangeText={(v) => setForm({ ...form, item_name: v })} />
        <ChipSelect label="Category" value={form.category} options={["Stationery", "Uniforms", "Books", "Furniture", "Electronics", "Sports", "Lab", "Cleaning", "Other"]} onChange={(v) => setForm({ ...form, category: v })} />
        <Field label="Quantity" value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="numeric" />
        <Field label="Unit" value={form.unit} onChangeText={(v) => setForm({ ...form, unit: v })} />
        <Field label="Unit price" value={form.unit_price} onChangeText={(v) => setForm({ ...form, unit_price: v })} keyboardType="numeric" />
        <Field label="Min stock" value={form.min_stock} onChangeText={(v) => setForm({ ...form, min_stock: v })} keyboardType="numeric" />
        <Field label="Location" value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} />
        <Field label="Supplier" value={form.supplier} onChangeText={(v) => setForm({ ...form, supplier: v })} />
        <Field label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
      </FormModal>

      <FormModal visible={logOpen} title="Stock log" onClose={() => setLogOpen(false)} onSave={saveLog} saving={saving} error={error}>
        <ChipSelect
          label="Item"
          value={String(logForm.item)}
          options={items.map((i) => ({ value: String(i.id), label: i.item_name }))}
          onChange={(v) => setLogForm({ ...logForm, item: v })}
        />
        <ChipSelect label="Type" value={logForm.change_type} options={["Add", "Remove"]} onChange={(v) => setLogForm({ ...logForm, change_type: v })} />
        <Field label="Quantity" value={logForm.quantity} onChangeText={(v) => setLogForm({ ...logForm, quantity: v })} keyboardType="numeric" />
        <Field label="Reason" value={logForm.reason} onChangeText={(v) => setLogForm({ ...logForm, reason: v })} />
      </FormModal>
    </Screen>
  );
}
