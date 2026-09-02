import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Edit,
  Eye,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
} from "../api/libraryApi";
import { getStudents } from "../api/studentsApi";
import { useTenant } from "../context/TenantContext";
import { getRole, getUser } from "../store/authStore";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Library.css";

const CATEGORIES = ["Textbook", "Story", "Reference", "Science", "Islamiat", "Fiction", "Magazine", "Other"];
const CONDITIONS = ["New", "Good", "Fair", "Damaged"];
const LANGUAGES = ["English", "Urdu", "Arabic", "Bilingual"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function contactPhone(s) {
  return s?.father_phone || s?.phone || s?.mother_phone || "";
}

function issueStatus(item) {
  if (item.due_status) return item.due_status;
  if (item.status === "Returned" || item.status === "Lost") return item.status;
  if (item.due_date && item.due_date < todayISO()) return "Overdue";
  return "Issued";
}

function badgeClass(st) {
  if (st === "Overdue" || st === "Lost") return "is-off lib-overdue";
  if (st === "Issued") return "is-warn";
  return "is-on";
}

function apiError(err) {
  const data = err.response?.data;
  if (!data) return "Could not save.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || "Could not save.";
}

const EMPTY_BOOK = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  category: "Textbook",
  language: "English",
  shelf_no: "",
  condition: "Good",
  quantity: "1",
  notes: "",
};

const EMPTY_ISSUE = {
  book: "",
  student: "",
  issue_date: todayISO(),
  due_date: addDays(todayISO(), 14),
  remarks: "",
};

export default function Library() {
  const tenant = useTenant();
  const role = getRole();
  const user = getUser();
  const canManage = role === "admin" || role === "teacher";
  const [viewMode, setViewMode] = useState("books");
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [issueTab, setIssueTab] = useState("All");
  const [showBook, setShowBook] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [returning, setReturning] = useState(null);
  const [bookForm, setBookForm] = useState(EMPTY_BOOK);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE);
  const [returnForm, setReturnForm] = useState({ return_date: todayISO(), fine_amount: "0", remarks: "", status: "Returned" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bRes, iRes, sRes] = await Promise.all([
        getBooks().catch(() => ({ data: [] })),
        getIssues().catch(() => ({ data: [] })),
        getStudents().catch(() => ({ data: [] })),
      ]);
      setBooks(Array.isArray(bRes.data) ? bRes.data : []);
      setIssues(Array.isArray(iRes.data) ? iRes.data : []);
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
    } catch (err) {
      console.error(err);
      setBooks([]);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const myStudent = useMemo(() => {
    return students.find((s) => {
      const email = (s.email || "").toLowerCase();
      return email && (email === (user?.email || "").toLowerCase() || email === (user?.username || "").toLowerCase());
    });
  }, [students, user]);

  const setBookField = (key) => (e) => setBookForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setIssueField = (key) => (e) => setIssueForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openAddBook = () => {
    setBookForm(EMPTY_BOOK);
    setEditingId(null);
    setShowBook(true);
  };

  const openEditBook = (book) => {
    setBookForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      category: book.category || "Textbook",
      language: book.language || "English",
      shelf_no: book.shelf_no || "",
      condition: book.condition || "Good",
      quantity: String(book.quantity || 1),
      notes: book.notes || "",
    });
    setEditingId(book.id);
    setViewing(null);
    setShowBook(true);
  };

  const openIssue = (book = null) => {
    setIssueForm({
      ...EMPTY_ISSUE,
      book: book ? String(book.id) : "",
      issue_date: todayISO(),
      due_date: addDays(todayISO(), 14),
    });
    setShowIssue(true);
  };

  const handleBookSave = async (e) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author.trim()) return alert("Title and author are required");
    setSaving(true);
    try {
      const payload = {
        ...bookForm,
        quantity: Number(bookForm.quantity) || 1,
      };
      if (!editingId) payload.available_quantity = payload.quantity;
      if (editingId) await updateBook(editingId, payload);
      else await createBook(payload);
      setShowBook(false);
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleIssueSave = async (e) => {
    e.preventDefault();
    if (!issueForm.book || !issueForm.student) return alert("Book and student are required");
    setSaving(true);
    try {
      await createIssue({
        ...issueForm,
        book: Number(issueForm.book),
        student: Number(issueForm.student),
      });
      setShowIssue(false);
      setViewMode("issues");
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Delete "${title}" from the catalog?`)) return;
    try {
      await deleteBook(id);
      setViewing(null);
      await fetchAll();
    } catch {
      alert("Could not delete book. Return issued copies first.");
    }
  };

  const openReturn = (item) => {
    const overdueDays = item.due_date && item.due_date < todayISO()
      ? Math.max(1, Math.round((new Date(`${todayISO()}T12:00:00`) - new Date(`${item.due_date}T12:00:00`)) / 86400000))
      : 0;
    setReturnForm({
      return_date: todayISO(),
      fine_amount: String(item.fine_amount > 0 ? item.fine_amount : overdueDays * 10),
      remarks: item.remarks || "",
      status: "Returned",
    });
    setReturning(item);
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!returning) return;
    setSaving(true);
    try {
      await updateIssue(returning.id, {
        status: returnForm.status,
        return_date: returnForm.status === "Returned" ? returnForm.return_date : null,
        fine_amount: Number(returnForm.fine_amount) || 0,
        remarks: returnForm.remarks,
      });
      setReturning(null);
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIssue = async (id) => {
    if (!window.confirm("Delete this issue record?")) return;
    try {
      await deleteIssue(id);
      await fetchAll();
    } catch {
      alert("Could not delete issue.");
    }
  };

  const sendReminder = (item) => {
    const student = students.find((s) => s.id === item.student);
    const phone = contactPhone(student);
    if (!phone) return alert("No phone on this student record.");
    const msg = encodeURIComponent(
      `Library reminder\n\n${item.book_title} is ${issueStatus(item) === "Overdue" ? "overdue" : "issued"} to ${item.student_name}.\nDue: ${formatDate(item.due_date)}\n\nPlease return it to the school library.\n\n${tenant.schoolName || "School"}`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const visibleIssues = issues.filter((item) => {
    if (role === "student" && myStudent) return item.student === myStudent.id;
    return true;
  });

  const filteredBooks = books.filter((b) => {
    const q = search.trim().toLowerCase();
    const blob = [b.title, b.author, b.isbn, b.accession_no, b.publisher, b.category, b.shelf_no].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchCat = category === "All" || b.category === category;
    return matchSearch && matchCat;
  });

  const filteredIssues = visibleIssues.filter((item) => {
    const q = search.trim().toLowerCase();
    const blob = [item.book_title, item.student_name, item.student_class, item.student_roll].join(" ").toLowerCase();
    const st = issueStatus(item);
    const matchSearch = !q || blob.toLowerCase().includes(q);
    const matchTab = issueTab === "All" || st === issueTab;
    return matchSearch && matchTab;
  });

  const stats = {
    titles: books.length,
    available: books.reduce((sum, b) => sum + Number(b.available_quantity || 0), 0),
    issued: visibleIssues.filter((i) => issueStatus(i) === "Issued" || issueStatus(i) === "Overdue").length,
    overdue: visibleIssues.filter((i) => issueStatus(i) === "Overdue").length,
  };

  const availableBooks = books.filter((b) => Number(b.available_quantity) > 0);
  const activeStudents = students.filter((s) => (s.status || "Active") === "Active");

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Resources</p>
          <h1>Library</h1>
          <p>Catalog and circulation for {tenant.schoolName || "your school"}.</p>
        </div>
        {canManage && (
          <div className="dash-hero-meta">
            <button type="button" className="st-ghost" onClick={() => openIssue()}>Issue book</button>
            <button type="button" className="st-add-btn" onClick={openAddBook}>
              <Plus size={16} /> Add book
            </button>
          </div>
        )}
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => setViewMode("books")}>
          <span>Titles</span>
          <strong>{loading ? "—" : stats.titles}</strong>
          <small>in catalog</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setViewMode("books")}>
          <span>Available</span>
          <strong>{loading ? "—" : stats.available}</strong>
          <small>copies</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => { setViewMode("issues"); setIssueTab("Issued"); }}>
          <span>Issued</span>
          <strong>{loading ? "—" : stats.issued}</strong>
          <small>out now</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => { setViewMode("issues"); setIssueTab("Overdue"); }}>
          <span>Overdue</span>
          <strong>{loading ? "—" : stats.overdue}</strong>
          <small>need return</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder={viewMode === "issues" ? "Search student, book, roll…" : "Search title, author, ISBN, shelf…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="st-filters">
          <button type="button" className={viewMode === "books" ? "is-on" : ""} onClick={() => setViewMode("books")}>Catalog</button>
          <button type="button" className={viewMode === "issues" ? "is-on" : ""} onClick={() => setViewMode("issues")}>Issued</button>
        </div>
      </div>

      {viewMode === "books" ? (
        <div className="st-classes">
          <button type="button" className={category === "All" ? "is-on" : ""} onClick={() => setCategory("All")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={category === c ? "is-on" : ""} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      ) : (
        <div className="st-classes">
          {["All", "Issued", "Overdue", "Returned", "Lost"].map((f) => (
            <button key={f} type="button" className={issueTab === f ? "is-on" : ""} onClick={() => setIssueTab(f)}>{f}</button>
          ))}
        </div>
      )}

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading library…</p>
          </div>
        ) : viewMode === "books" ? (
          filteredBooks.length === 0 ? (
            <div className="st-empty">
              <BookOpen size={36} />
              <p>{books.length ? "No books match these filters." : "No books yet. Add the first title."}</p>
              {canManage && !books.length && <button type="button" onClick={openAddBook}>Add book</button>}
            </div>
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Accession</th>
                    <th>Shelf</th>
                    <th>Copies</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => {
                    const avail = Number(book.available_quantity || 0);
                    return (
                      <tr key={book.id}>
                        <td>
                          <button type="button" className="st-person" onClick={() => setViewing(book)}>
                            <span>{(book.title || "B").slice(0, 1)}</span>
                            <div>
                              <b>{book.title}</b>
                              <small>{book.author}{book.category ? ` · ${book.category}` : ""}</small>
                            </div>
                          </button>
                        </td>
                        <td className="st-mono">{book.accession_no || "—"}</td>
                        <td>{book.shelf_no || "—"}</td>
                        <td className="st-mono">{avail}/{book.quantity || 0}</td>
                        <td>
                          <span className={`st-badge ${avail > 0 ? "is-on" : "is-off"}`}>{avail > 0 ? "Available" : "All out"}</span>
                        </td>
                        <td>
                          <div className="st-actions">
                            <button type="button" title="View" onClick={() => setViewing(book)}><Eye size={15} /></button>
                            {canManage && (
                              <>
                                <button type="button" title="Issue" disabled={avail < 1} onClick={() => openIssue(book)}><Plus size={15} /></button>
                                <button type="button" title="Edit" onClick={() => openEditBook(book)}><Edit size={15} /></button>
                                <button type="button" className="is-danger" title="Delete" onClick={() => handleDeleteBook(book.id, book.title)}>
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : filteredIssues.length === 0 ? (
          <div className="st-empty">
            <BookOpen size={36} />
            <p>{visibleIssues.length ? "No issues match these filters." : "No books issued yet."}</p>
            {canManage && !visibleIssues.length && <button type="button" onClick={() => openIssue()}>Issue book</button>}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Due</th>
                  <th>Fine</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((item) => {
                  const st = issueStatus(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="st-cell-stack">
                          <b>{item.book_title}</b>
                          <small>{item.book_author || "—"}</small>
                        </div>
                      </td>
                      <td>
                        <div className="st-cell-stack">
                          <b>{item.student_name}</b>
                          <small>{item.student_class || "—"}{item.student_roll ? ` · ${item.student_roll}` : ""}</small>
                        </div>
                      </td>
                      <td>
                        <div className="st-cell-stack">
                          <b>{formatDate(item.due_date)}</b>
                          <small>Issued {formatDate(item.issue_date)}</small>
                        </div>
                      </td>
                      <td className="st-mono">Rs {Number(item.fine_amount || 0)}</td>
                      <td><span className={`st-badge ${badgeClass(st)}`}>{st}</span></td>
                      <td>
                        <div className="st-actions">
                          {canManage && (st === "Issued" || st === "Overdue") && (
                            <>
                              <button type="button" title="Remind" onClick={() => sendReminder(item)}><MessageCircle size={15} /></button>
                              <button type="button" title="Return" onClick={() => openReturn(item)}><Eye size={15} /></button>
                            </>
                          )}
                          {canManage && (
                            <button type="button" className="is-danger" title="Delete" onClick={() => handleDeleteIssue(item.id)}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="st-count">
        {viewMode === "books"
          ? `Showing ${filteredBooks.length} of ${books.length} titles`
          : `Showing ${filteredIssues.length} of ${visibleIssues.length} issues`}
      </p>

      {showBook && (
        <AppModal onClose={() => setShowBook(false)}>
          <form className="st-modal" onSubmit={handleBookSave}>
            <header>
              <div>
                <p>Catalog</p>
                <h2>{editingId ? "Edit book" : "Add book"}</h2>
              </div>
              <button type="button" onClick={() => setShowBook(false)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Details</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Title *
                  <input required value={bookForm.title} onChange={setBookField("title")} placeholder="e.g. English Reader 5" />
                </label>
                <label>
                  Author *
                  <input required value={bookForm.author} onChange={setBookField("author")} />
                </label>
                <label>
                  Category
                  <select value={bookForm.category} onChange={setBookField("category")}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  ISBN
                  <input value={bookForm.isbn} onChange={setBookField("isbn")} placeholder="Optional" />
                </label>
                <label>
                  Publisher
                  <input value={bookForm.publisher} onChange={setBookField("publisher")} />
                </label>
                <label>
                  Language
                  <select value={bookForm.language} onChange={setBookField("language")}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label>
                  Shelf
                  <input value={bookForm.shelf_no} onChange={setBookField("shelf_no")} placeholder="e.g. A-12" />
                </label>
                <label>
                  Copies
                  <input type="number" min="1" value={bookForm.quantity} onChange={setBookField("quantity")} />
                </label>
                <label>
                  Condition
                  <select value={bookForm.condition} onChange={setBookField("condition")}>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="st-span-2">
                  Notes
                  <input value={bookForm.notes} onChange={setBookField("notes")} placeholder="Optional" />
                </label>
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setShowBook(false)}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Add book"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {showIssue && (
        <AppModal onClose={() => setShowIssue(false)}>
          <form className="st-modal" onSubmit={handleIssueSave}>
            <header>
              <div>
                <p>Circulation</p>
                <h2>Issue book</h2>
              </div>
              <button type="button" onClick={() => setShowIssue(false)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="st-grid">
                <label className="st-span-2">
                  Book *
                  <select required value={issueForm.book} onChange={setIssueField("book")}>
                    <option value="">Select book</option>
                    {availableBooks.map((b) => (
                      <option key={b.id} value={b.id}>{b.title} · {b.author} ({b.available_quantity} left)</option>
                    ))}
                  </select>
                </label>
                <label className="st-span-2">
                  Student *
                  <select required value={issueForm.student} onChange={setIssueField("student")}>
                    <option value="">Select student</option>
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.class_name || "No class"} · {s.roll_no || "No roll"}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Issue date
                  <input type="date" required value={issueForm.issue_date} onChange={setIssueField("issue_date")} />
                </label>
                <label>
                  Due date
                  <input type="date" required value={issueForm.due_date} onChange={setIssueField("due_date")} />
                </label>
                <label className="st-span-2">
                  Remarks
                  <input value={issueForm.remarks} onChange={setIssueField("remarks")} placeholder="Optional" />
                </label>
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setShowIssue(false)}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : "Issue book"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {viewing && (
        <AppModal onClose={() => setViewing(null)}>
          <div className="st-modal">
            <header>
              <div>
                <p>{viewing.accession_no || "Catalog"}</p>
                <h2>{viewing.title}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="lib-view-grid">
                <ViewRow label="Author" value={viewing.author} />
                <ViewRow label="Category" value={viewing.category} />
                <ViewRow label="ISBN" value={viewing.isbn} />
                <ViewRow label="Publisher" value={viewing.publisher} />
                <ViewRow label="Language" value={viewing.language} />
                <ViewRow label="Shelf" value={viewing.shelf_no} />
                <ViewRow label="Copies" value={`${viewing.available_quantity}/${viewing.quantity}`} />
                <ViewRow label="Condition" value={viewing.condition} />
              </div>
              {viewing.notes && <p className="st-hint">{viewing.notes}</p>}
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setViewing(null)}>Close</button>
              {canManage && Number(viewing.available_quantity) > 0 && (
                <button type="button" className="st-ghost" onClick={() => { setViewing(null); openIssue(viewing); }}>Issue</button>
              )}
              {canManage && (
                <button type="button" className="st-add-btn" onClick={() => openEditBook(viewing)}>Edit</button>
              )}
            </footer>
          </div>
        </AppModal>
      )}

      {returning && (
        <AppModal onClose={() => setReturning(null)}>
          <form className="st-modal" onSubmit={handleReturn}>
            <header>
              <div>
                <p>{returning.student_name}</p>
                <h2>Return · {returning.book_title}</h2>
              </div>
              <button type="button" onClick={() => setReturning(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Due {formatDate(returning.due_date)}. Overdue fine is Rs 10 per day unless you change it.</p>
              <div className="st-grid">
                <label>
                  Result
                  <select value={returnForm.status} onChange={(e) => setReturnForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="Returned">Returned</option>
                    <option value="Lost">Lost</option>
                  </select>
                </label>
                {returnForm.status === "Returned" && (
                  <label>
                    Return date
                    <input type="date" value={returnForm.return_date} onChange={(e) => setReturnForm((p) => ({ ...p, return_date: e.target.value }))} />
                  </label>
                )}
                <label>
                  Fine (Rs)
                  <input type="number" min="0" value={returnForm.fine_amount} onChange={(e) => setReturnForm((p) => ({ ...p, fine_amount: e.target.value }))} />
                </label>
                <label className="st-span-2">
                  Remarks
                  <input value={returnForm.remarks} onChange={(e) => setReturnForm((p) => ({ ...p, remarks: e.target.value }))} />
                </label>
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setReturning(null)}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : returnForm.status === "Lost" ? "Mark lost" : "Mark returned"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}
    </div>
  );
}

function ViewRow({ label, value }) {
  return (
    <div className="lib-view-row">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}
