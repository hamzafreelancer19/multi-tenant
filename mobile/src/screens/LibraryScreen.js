import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { createBook, createIssue, deleteBook, getBooks, getIssues, getStudents, updateBook, updateIssue } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Badge, Card, ChipSelect, EmptyState, ErrorText, Field, FormModal, Hero, LoadingBlock, PrimaryButton, Screen, SearchBar } from "../components/ui";
import { apiError, asList, formatDate, isSchoolAdmin, todayISO } from "../utils";

export default function LibraryScreen() {
  const { role } = useAuth();
  const canManage = isSchoolAdmin(role);
  const [tab, setTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", category: "Textbook", language: "English", condition: "Good", quantity: "1" });
  const [issueForm, setIssueForm] = useState({ book: "", student: "", issue_date: todayISO(), due_date: todayISO(), remarks: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      const [b, i, s] = await Promise.all([getBooks(), getIssues(), getStudents().catch(() => ({ data: [] }))]);
      setBooks(asList(b.data));
      setIssues(asList(i.data));
      setStudents(asList(s.data));
    } catch (err) {
      setError(apiError(err, "Could not load library."));
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const saveBook = async () => {
    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) || 1 };
      if (editingId) await updateBook(editingId, payload);
      else await createBook(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not save book."));
    } finally {
      setSaving(false);
    }
  };

  const saveIssue = async () => {
    setSaving(true);
    try {
      await createIssue({ ...issueForm, book: Number(issueForm.book), student: Number(issueForm.student) });
      setIssueOpen(false);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not issue book."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingBlock /></Screen>;
  const filteredBooks = books.filter((b) => [b.title, b.author, b.isbn].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen onRefresh={load}>
      <Hero kicker="Library" title="Books & issues" right={canManage ? <PrimaryButton title={tab === "books" ? "Add book" : "Issue"} onPress={() => (tab === "books" ? (setEditingId(null), setOpen(true)) : setIssueOpen(true))} /> : null} />
      <ChipSelect label="View" value={tab} options={[{ value: "books", label: "Books" }, { value: "issues", label: "Issues" }]} onChange={setTab} />
      <SearchBar value={q} onChangeText={setQ} />
      <ErrorText>{error}</ErrorText>
      {tab === "books" ? (
        filteredBooks.length ? filteredBooks.map((b) => (
          <Card key={b.id}>
            <Hero kicker={b.category} title={b.title} subtitle={b.author} />
            <Badge label={`Qty ${b.quantity ?? "—"}`} status="Active" />
            {canManage ? (
              <>
                <PrimaryButton title="Edit" tone="navy" onPress={() => { setEditingId(b.id); setForm({ ...form, ...b, quantity: String(b.quantity || 1) }); setOpen(true); }} />
                <PrimaryButton title="Delete" tone="danger" onPress={() => deleteBook(b.id).then(load)} />
              </>
            ) : null}
          </Card>
        )) : <EmptyState />
      ) : (
        issues.length ? issues.map((i) => (
          <Card key={i.id}>
            <Hero kicker={i.status} title={i.book_title || i.title || `Book #${i.book}`} subtitle={`${i.student_name || ""} · due ${formatDate(i.due_date)}`} />
            <Badge status={i.status} label={i.status} />
            {canManage && i.status !== "Returned" && (
              <PrimaryButton title="Mark returned" onPress={() => updateIssue(i.id, { status: "Returned", return_date: todayISO() }).then(load)} />
            )}
          </Card>
        )) : <EmptyState text="No issues." />
      )}
      <FormModal visible={open && canManage} title="Book" onClose={() => setOpen(false)} onSave={saveBook} saving={saving} error={error}>
        <Field label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <Field label="Author" value={form.author} onChangeText={(v) => setForm({ ...form, author: v })} />
        <Field label="ISBN" value={form.isbn} onChangeText={(v) => setForm({ ...form, isbn: v })} />
        <ChipSelect label="Category" value={form.category} options={["Textbook", "Story", "Reference", "Science", "Islamiat", "Fiction", "Other"]} onChange={(v) => setForm({ ...form, category: v })} />
        <Field label="Quantity" value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="numeric" />
      </FormModal>
      <FormModal visible={issueOpen && canManage} title="Issue book" onClose={() => setIssueOpen(false)} onSave={saveIssue} saving={saving} error={error}>
        <ChipSelect label="Book" value={String(issueForm.book)} options={books.map((b) => ({ value: String(b.id), label: b.title }))} onChange={(v) => setIssueForm({ ...issueForm, book: v })} />
        <ChipSelect label="Student" value={String(issueForm.student)} options={students.map((s) => ({ value: String(s.id), label: s.name }))} onChange={(v) => setIssueForm({ ...issueForm, student: v })} />
        <Field label="Issue date" value={issueForm.issue_date} onChangeText={(v) => setIssueForm({ ...issueForm, issue_date: v })} />
        <Field label="Due date" value={issueForm.due_date} onChangeText={(v) => setIssueForm({ ...issueForm, due_date: v })} />
      </FormModal>
    </Screen>
  );
}
