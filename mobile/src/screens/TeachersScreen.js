import React, { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  setTeacherLogin,
  updateTeacher,
} from "../api";
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

const SUBJECTS = ["Mathematics", "English", "Urdu", "Physics", "Chemistry", "Biology", "Computer Science", "Islamiat", "Pakistan Studies", "Other"];
const DESIGNATIONS = ["Subject Teacher", "Class Teacher", "HOD", "Vice Principal", "Principal"];

const EMPTY = {
  name: "",
  subject: "Mathematics",
  designation: "Subject Teacher",
  gender: "",
  phone: "",
  email: "",
  qualification: "",
  status: "Active",
  classes: "",
};

export default function TeachersScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTeacher, setLoginTeacher] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginInfo, setLoginInfo] = useState(null);

  const load = async () => {
    try {
      const res = await getTeachers();
      setRows(asList(res.data));
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load teachers."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((t) =>
      [t.name, t.subject, t.email, t.phone, t.designation].join(" ").toLowerCase().includes(query)
    );
  }, [rows, q]);

  const save = async () => {
    if (!form.name.trim()) return setError("Name is required.");
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        classes:
          typeof form.classes === "string"
            ? form.classes.split(",").map((x) => x.trim()).filter(Boolean)
            : form.classes,
      };
      if (editingId) await updateTeacher(editingId, payload);
      else await createTeacher(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save teacher."));
    } finally {
      setSaving(false);
    }
  };

  const saveLogin = async () => {
    if (!loginTeacher) return;
    if (!loginForm.email.trim() || !loginForm.password) {
      return setError("Email and password are required for portal login.");
    }
    setSaving(true);
    setError("");
    try {
      const res = await setTeacherLogin(loginTeacher.id, {
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      setLoginInfo({
        ...(res.data || {}),
        username: res.data?.login_username || res.data?.username || loginForm.email.trim(),
        email: res.data?.email || loginForm.email.trim(),
      });
      setLoginOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not set teacher login."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;

  return (
    <Screen onRefresh={load}>
      <Hero
        kicker="Faculty"
        title="Teachers"
        subtitle="Staff directory, subjects, and portal logins."
        right={<PrimaryButton title="Add" onPress={() => { setForm({ ...EMPTY }); setEditingId(null); setOpen(true); }} />}
      />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>
      {loginInfo ? (
        <Card>
          <Hero
            title="Teacher portal login ready"
            subtitle={loginInfo.username || loginInfo.email || loginForm.email}
          />
          <PrimaryButton title="Dismiss" tone="navy" onPress={() => setLoginInfo(null)} />
        </Card>
      ) : null}
      {filtered.length ? filtered.map((t) => (
        <Card key={t.id}>
          <Hero
            kicker={[t.subject, t.designation].filter(Boolean).join(" · ")}
            title={t.name}
            subtitle={[t.phone, t.email].filter(Boolean).join(" · ")}
          />
          <Badge status={t.status || "Active"} label={t.status || "Active"} />
          <View>
            <PrimaryButton
              title="Edit"
              tone="navy"
              onPress={() => {
                setForm({
                  ...EMPTY,
                  ...t,
                  classes: Array.isArray(t.classes) ? t.classes.join(", ") : t.classes || "",
                });
                setEditingId(t.id);
                setOpen(true);
              }}
            />
            <PrimaryButton
              title="Set portal login"
              onPress={() => {
                setLoginTeacher(t);
                setLoginForm({ email: t.email || "", password: "" });
                setLoginOpen(true);
                setError("");
              }}
            />
            <PrimaryButton
              title="Delete"
              tone="danger"
              onPress={() =>
                Alert.alert("Delete", `Delete ${t.name}?`, [
                  { text: "Cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteTeacher(t.id);
                        load();
                      } catch (err) {
                        setError(apiError(err, "Could not delete."));
                      }
                    },
                  },
                ])
              }
            />
          </View>
        </Card>
      )) : <EmptyState text="No teachers yet." />}

      <FormModal visible={open} title={editingId ? "Edit teacher" : "Add teacher"} onClose={() => setOpen(false)} onSave={save} saving={saving} error={error}>
        <Field label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <ChipSelect label="Subject" value={form.subject} options={SUBJECTS} onChange={(v) => setForm({ ...form, subject: v })} />
        <ChipSelect label="Designation" value={form.designation} options={DESIGNATIONS} onChange={(v) => setForm({ ...form, designation: v })} />
        <Field label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
        <Field label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
        <Field label="Qualification" value={form.qualification} onChangeText={(v) => setForm({ ...form, qualification: v })} />
        <Field label="Classes (comma separated)" value={form.classes} onChangeText={(v) => setForm({ ...form, classes: v })} />
        <ChipSelect label="Status" value={form.status} options={["Active", "Inactive"]} onChange={(v) => setForm({ ...form, status: v })} />
      </FormModal>

      <FormModal
        visible={loginOpen}
        title={`Portal login · ${loginTeacher?.name || ""}`}
        onClose={() => setLoginOpen(false)}
        onSave={saveLogin}
        saving={saving}
        error={error}
      >
        <Field label="Login email / username" value={loginForm.email} onChangeText={(v) => setLoginForm({ ...loginForm, email: v })} />
        <Field label="Password" value={loginForm.password} onChangeText={(v) => setLoginForm({ ...loginForm, password: v })} secure />
      </FormModal>
    </Screen>
  );
}
