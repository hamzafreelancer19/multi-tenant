import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  approvePlan,
  createPlan,
  deletePlan,
  getPlansOverview,
  getPlatformSettings,
  getSchools,
  rejectPlan,
  updatePlan,
  updatePlatformSettings,
} from "../api";
import {
  Badge,
  ChipSelect,
  EmptyState,
  ErrorText,
  Field,
  FormModal,
  LoadingBlock,
  PrimaryButton,
  Screen,
} from "../components/ui";
import { radius } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import { apiError, asList, money } from "../utils";

const TABS = [
  { key: "catalog", label: "Catalog", icon: "diamond-outline" },
  { key: "approvals", label: "Approvals", icon: "hourglass-outline" },
  { key: "payment", label: "Payment", icon: "card-outline" },
];

const EMPTY_PLAN = {
  code: "",
  name: "",
  description: "",
  price: "1500",
  duration_days: "30",
  student_limit: "100",
  teacher_limit: "5",
  feature_tier: "Basic",
  is_active: true,
  is_popular: false,
};

const EMPTY_PAY = {
  jazzcash: "",
  easypaisa: "",
  bank_name: "",
  account_title: "",
  account_number: "",
  iban: "",
  instructions: "Pay via JazzCash / EasyPaisa / bank transfer, then submit your transaction ID.",
};

function planPayload(form) {
  const code = String(form.code || form.name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return {
    code,
    name: String(form.name || "").trim(),
    description: String(form.description || "").trim(),
    price: Number(form.price) || 0,
    duration_days: Number(form.duration_days) || 30,
    student_limit: form.student_limit === "" ? null : Number(form.student_limit) || 0,
    teacher_limit: form.teacher_limit === "" ? null : Number(form.teacher_limit) || 0,
    feature_tier: form.feature_tier || "Basic",
    color: "#F15A24",
    is_active: !!form.is_active,
    is_popular: !!form.is_popular,
    sort_order: 0,
  };
}

export default function PlansScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState("catalog");
  const [plans, setPlans] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [savingPlan, setSavingPlan] = useState(false);
  const [menuPlan, setMenuPlan] = useState(null);
  const [payment, setPayment] = useState(EMPTY_PAY);
  const [savingPay, setSavingPay] = useState(false);

  const load = async () => {
    try {
      const [overview, schoolsRes, settingsRes] = await Promise.all([
        getPlansOverview().catch(() => null),
        getSchools().catch(() => ({ data: [] })),
        getPlatformSettings().catch(() => ({ data: {} })),
      ]);
      if (overview?.data) {
        setPlans(asList(overview.data.plans));
        setPending(asList(overview.data.pending));
      } else {
        const schools = asList(schoolsRes.data);
        setPending(schools.filter((s) => String(s.plan_status || "").toLowerCase() === "pending"));
        setPlans([]);
      }
      const pay = settingsRes.data?.payment_methods || {};
      setPayment({ ...EMPTY_PAY, ...pay });
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load plans."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const activeCount = useMemo(
    () => plans.filter((p) => p.is_active !== false).length,
    [plans]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PLAN);
    setFormOpen(true);
  };

  const openEdit = (plan) => {
    setMenuPlan(null);
    setEditingId(plan.id);
    setForm({
      code: plan.code || "",
      name: plan.name || "",
      description: plan.description || "",
      price: String(plan.price ?? ""),
      duration_days: String(plan.duration_days ?? 30),
      student_limit: plan.student_limit == null ? "" : String(plan.student_limit),
      teacher_limit: plan.teacher_limit == null ? "" : String(plan.teacher_limit),
      feature_tier: plan.feature_tier || "Basic",
      is_active: plan.is_active !== false,
      is_popular: !!plan.is_popular,
    });
    setFormOpen(true);
  };

  const savePlan = async () => {
    if (!String(form.name || "").trim()) {
      setError("Plan name is required.");
      return;
    }
    setSavingPlan(true);
    setError("");
    setToast("");
    try {
      const payload = planPayload(form);
      if (!payload.code) throw new Error("Plan code is required.");
      if (editingId) await updatePlan(editingId, payload);
      else await createPlan(payload);
      setFormOpen(false);
      setToast(editingId ? "Plan updated." : "New plan created.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save plan."));
    } finally {
      setSavingPlan(false);
    }
  };

  const toggleActive = async (plan) => {
    setMenuPlan(null);
    setBusyKey(`toggle-${plan.id}`);
    try {
      await updatePlan(plan.id, { is_active: plan.is_active === false });
      setToast(plan.is_active === false ? "Plan activated." : "Plan deactivated.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not update plan."));
    } finally {
      setBusyKey("");
    }
  };

  const removePlan = async (plan) => {
    setMenuPlan(null);
    setBusyKey(`del-${plan.id}`);
    try {
      await deletePlan(plan.id);
      setToast("Plan removed / deactivated.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not delete plan."));
    } finally {
      setBusyKey("");
    }
  };

  const runApproval = async (school, action) => {
    setBusyKey(`${action}-${school.id}`);
    setError("");
    try {
      if (action === "approve") await approvePlan(school.id);
      else await rejectPlan(school.id);
      setToast(action === "approve" ? `Plan approved for ${school.name}` : `Plan rejected for ${school.name}`);
      await load();
    } catch (err) {
      setError(apiError(err, "Action failed."));
    } finally {
      setBusyKey("");
    }
  };

  const savePayment = async () => {
    setSavingPay(true);
    setError("");
    setToast("");
    try {
      await updatePlatformSettings({ payment_methods: payment });
      setToast("Payment methods updated.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save payment methods."));
    } finally {
      setSavingPay(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Loading plans…" />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={load}>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Platform</Text>
          <Text style={styles.pageTitle}>Plans</Text>
          <Text style={styles.pageSub}>Catalog, approvals, and payment details for schools.</Text>
        </View>
        {tab === "catalog" ? (
          <Pressable onPress={openCreate} style={styles.addBtn}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.statRow}>
        <View style={[styles.stat, styles.statOrange]}>
          <Text style={styles.statValue}>{plans.length}</Text>
          <Text style={styles.statLabel}>Catalog</Text>
        </View>
        <View style={[styles.stat, styles.statGreen]}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.stat, styles.statGold]}>
          <Text style={styles.statValue}>{pending.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const on = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.tab, on && styles.tabOn]}
            >
              <Ionicons name={item.icon} size={15} color={on ? "#fff" : colors.muted} />
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ErrorText>{error}</ErrorText>
      {!!toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {tab === "catalog" && (
        <>
          {plans.length ? (
            plans.map((plan) => (
              <View key={plan.id || plan.code} style={styles.planCard}>
                <View style={[styles.planAccent, { backgroundColor: plan.color || colors.primary }]} />
                <View style={styles.planBody}>
                  <View style={styles.planTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planCode}>{plan.code || plan.feature_tier}</Text>
                      <Text style={styles.planName}>{plan.name || "Plan"}</Text>
                      <Text style={styles.planPrice}>{money(plan.price)}</Text>
                    </View>
                    <Pressable onPress={() => setMenuPlan(plan)} style={styles.moreBtn}>
                      <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
                    </Pressable>
                  </View>
                  <Text style={styles.planDesc} numberOfLines={2}>
                    {plan.description || `${plan.duration_days || 30} days · ${plan.feature_tier || "Basic"} tier`}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge
                      status={plan.is_active === false ? "Inactive" : "Active"}
                      label={plan.is_active === false ? "Inactive" : "Active"}
                    />
                    {plan.is_popular ? <Badge status="Pending" label="Popular" /> : null}
                    <Badge status="Active" label={plan.feature_tier || "Basic"} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <EmptyState title="No plans yet" text="Tap New to create your first catalog plan." />
          )}
        </>
      )}

      {tab === "approvals" && (
        <>
          {pending.length ? (
            pending.map((s) => (
              <View key={s.id} style={styles.rowCard}>
                <View style={styles.rowIcon}>
                  <Ionicons name="school-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{s.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {[s.plan_type || "Plan", s.domain, s.transaction_id ? `Txn ${s.transaction_id}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge status={s.plan_status} label={s.plan_status || "Pending"} />
                  </View>
                </View>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => runApproval(s, "approve")}
                    disabled={!!busyKey}
                    style={styles.iconAction}
                  >
                    <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                  </Pressable>
                  <Pressable
                    onPress={() => runApproval(s, "reject")}
                    disabled={!!busyKey}
                    style={styles.iconAction}
                  >
                    <Ionicons name="close-circle" size={26} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <EmptyState title="No pending requests" text="School plan payments will show up here." />
          )}
        </>
      )}

      {tab === "payment" && (
        <View style={styles.payCard}>
          <View style={styles.sectionHead}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment methods</Text>
          </View>
          <Text style={styles.payHint}>
            These details appear when schools buy or upgrade a plan.
          </Text>
          <Field
            label="JazzCash number"
            value={payment.jazzcash}
            onChangeText={(v) => setPayment({ ...payment, jazzcash: v })}
            placeholder="03xx…"
            keyboardType="phone-pad"
          />
          <Field
            label="EasyPaisa number"
            value={payment.easypaisa}
            onChangeText={(v) => setPayment({ ...payment, easypaisa: v })}
            placeholder="03xx…"
            keyboardType="phone-pad"
          />
          <Field
            label="Bank name"
            value={payment.bank_name}
            onChangeText={(v) => setPayment({ ...payment, bank_name: v })}
            placeholder="e.g. HBL"
          />
          <Field
            label="Account title"
            value={payment.account_title}
            onChangeText={(v) => setPayment({ ...payment, account_title: v })}
            placeholder="Account holder name"
          />
          <Field
            label="Account number"
            value={payment.account_number}
            onChangeText={(v) => setPayment({ ...payment, account_number: v })}
            placeholder="Account / wallet number"
          />
          <Field
            label="IBAN"
            value={payment.iban}
            onChangeText={(v) => setPayment({ ...payment, iban: v })}
            placeholder="PK…"
          />
          <Field
            label="Instructions"
            value={payment.instructions}
            onChangeText={(v) => setPayment({ ...payment, instructions: v })}
            placeholder="How schools should pay"
            multiline
          />
          <PrimaryButton
            title={savingPay ? "Saving…" : "Save payment methods"}
            onPress={savePayment}
            disabled={savingPay}
          />
        </View>
      )}

      <FormModal
        visible={formOpen}
        title={editingId ? "Edit plan" : "Create plan"}
        onClose={() => setFormOpen(false)}
        onSave={savePlan}
        saving={savingPlan}
        error={error && formOpen ? error : ""}
      >
        <Field
          label="Plan name"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Business Plus"
        />
        <Field
          label="Code"
          value={form.code}
          onChangeText={(v) => setForm({ ...form, code: v })}
          placeholder="auto from name if empty"
        />
        <Field
          label="Price (PKR)"
          value={form.price}
          onChangeText={(v) => setForm({ ...form, price: v })}
          keyboardType="numeric"
        />
        <Field
          label="Duration (days)"
          value={form.duration_days}
          onChangeText={(v) => setForm({ ...form, duration_days: v })}
          keyboardType="numeric"
        />
        <ChipSelect
          label="Feature tier"
          value={form.feature_tier}
          options={["Basic", "Business", "Pro"]}
          onChange={(v) => setForm({ ...form, feature_tier: v })}
        />
        <Field
          label="Student limit (blank = unlimited)"
          value={form.student_limit}
          onChangeText={(v) => setForm({ ...form, student_limit: v })}
          keyboardType="numeric"
        />
        <Field
          label="Teacher limit (blank = unlimited)"
          value={form.teacher_limit}
          onChangeText={(v) => setForm({ ...form, teacher_limit: v })}
          keyboardType="numeric"
        />
        <Field
          label="Description"
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          multiline
        />
        <ChipSelect
          label="Active"
          value={form.is_active ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(v) => setForm({ ...form, is_active: v === "Yes" })}
        />
        <ChipSelect
          label="Mark popular"
          value={form.is_popular ? "Yes" : "No"}
          options={["Yes", "No"]}
          onChange={(v) => setForm({ ...form, is_popular: v === "Yes" })}
        />
      </FormModal>

      <Modal visible={!!menuPlan} transparent animationType="fade" onRequestClose={() => setMenuPlan(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuPlan(null)} />
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{menuPlan?.name || "Plan"}</Text>
            <Pressable onPress={() => openEdit(menuPlan)} style={styles.menuItem}>
              <Ionicons name="create-outline" size={18} color={colors.text} />
              <Text style={styles.menuItemText}>Edit plan</Text>
            </Pressable>
            <Pressable onPress={() => toggleActive(menuPlan)} style={styles.menuItem}>
              <Ionicons
                name={menuPlan?.is_active === false ? "play-circle-outline" : "pause-circle-outline"}
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.menuItemText, { color: colors.primary }]}>
                {menuPlan?.is_active === false ? "Activate" : "Deactivate"}
              </Text>
            </Pressable>
            <Pressable onPress={() => removePlan(menuPlan)} style={styles.menuItem}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    headRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 14,
    },
    kicker: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    pageTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    pageSub: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 6,
      lineHeight: 18,
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 8,
    },
    addBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
    statRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    stat: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 12,
    },
    statOrange: { borderColor: "rgba(241,90,36,0.3)" },
    statGreen: { borderColor: "rgba(52,211,153,0.3)" },
    statGold: { borderColor: "rgba(251,191,36,0.35)" },
    statValue: { color: colors.text, fontSize: 20, fontWeight: "800" },
    statLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
    tabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.card,
      paddingVertical: 9,
    },
    tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { color: colors.muted, fontWeight: "800", fontSize: 11 },
    tabTextOn: { color: "#fff" },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(52,211,153,0.12)",
      borderColor: "rgba(52,211,153,0.3)",
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    toastText: { color: colors.success, fontWeight: "700", fontSize: 13, flex: 1 },
    planCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: "hidden",
      marginBottom: 10,
    },
    planAccent: { width: 5 },
    planBody: { flex: 1, padding: 14 },
    planTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    planCode: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    planName: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 2 },
    planPrice: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 4 },
    planDesc: { color: colors.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
    moreBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    rowCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 12,
      marginBottom: 8,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(241,90,36,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    rowTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
    rowSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
    rowActions: { flexDirection: "row", gap: 4 },
    iconAction: { padding: 2 },
    payCard: {
      backgroundColor: colors.bg2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 16,
    },
    sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    sectionTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
    payHint: { color: colors.muted, fontSize: 12, marginBottom: 14, lineHeight: 18 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
      padding: 16,
    },
    menuCard: {
      backgroundColor: colors.bg2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 12,
    },
    menuTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 8,
      paddingHorizontal: 8,
      paddingTop: 4,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
    },
    menuItemText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  });
}
