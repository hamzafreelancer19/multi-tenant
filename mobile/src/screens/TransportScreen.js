import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { createVehicle, deleteVehicle, getRiders, getRoutes, getVehicles } from "../api";
import { Badge, Card, EmptyState, ErrorText, Field, FormModal, Hero, LoadingBlock, PrimaryButton, Screen } from "../components/ui";
import { apiError, asList } from "../utils";

export default function TransportScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ number_plate: "", vehicle_type: "Van", driver_name: "", capacity: "15", status: "Active" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [v, r, d] = await Promise.all([
        getVehicles().catch(() => ({ data: [] })),
        getRoutes().catch(() => ({ data: [] })),
        getRiders().catch(() => ({ data: [] })),
      ]);
      setVehicles(asList(v.data));
      setRoutes(asList(r.data));
      setRiders(asList(d.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load transport."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    setSaving(true);
    try {
      await createVehicle({ ...form, capacity: Number(form.capacity) || 0 });
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save vehicle."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Transport" title="Vehicles & routes" subtitle="Hidden on the website menu, still available via API." right={<PrimaryButton title="Add vehicle" onPress={() => setOpen(true)} />} />
      <ErrorText>{error}</ErrorText>
      <Hero kicker="Fleet" title="Vehicles" />
      {vehicles.length ? vehicles.map((v) => (
        <Card key={v.id}>
          <Hero kicker={v.vehicle_type} title={v.number_plate || v.name} subtitle={v.driver_name} />
          <Badge status={v.status} label={v.status || "Active"} />
          <PrimaryButton title="Delete" tone="danger" onPress={() => deleteVehicle(v.id).then(load)} />
        </Card>
      )) : <EmptyState text="No vehicles." />}
      <Hero kicker="Routes" title={`${routes.length} routes · ${riders.length} riders`} />
      {routes.map((r) => (
        <Card key={r.id}><Hero title={r.name || r.route_name} subtitle={r.stops || r.description} /></Card>
      ))}
      <FormModal visible={open} title="Vehicle" onClose={() => setOpen(false)} onSave={save} saving={saving} error={error}>
        <Field label="Number plate" value={form.number_plate} onChangeText={(v) => setForm({ ...form, number_plate: v })} />
        <Field label="Type" value={form.vehicle_type} onChangeText={(v) => setForm({ ...form, vehicle_type: v })} />
        <Field label="Driver" value={form.driver_name} onChangeText={(v) => setForm({ ...form, driver_name: v })} />
        <Field label="Capacity" value={form.capacity} onChangeText={(v) => setForm({ ...form, capacity: v })} keyboardType="numeric" />
      </FormModal>
    </Screen>
  );
}
