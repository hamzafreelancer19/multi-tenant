import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { getFees, createFee, updateFee, deleteFee, getFeeStats } from "../api/feesApi";
import { getStudents } from "../api/studentsApi";
import { getClasses } from "../api/classesApi";
import { useTenant } from "../context/TenantContext";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Fees.css";

const FEE_TYPES = ["Tuition", "Transport", "Admission", "Exam", "Lab", "Other"];
const METHODS = ["Cash", "Bank", "JazzCash", "EasyPaisa", "Cheque"];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function money(n) {
  return `Rs ${Number(n || 0).toLocaleString()}`;
}

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function classLabel(c) {
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

function contactPhone(s) {
  return s?.father_phone || s?.phone || s?.mother_phone || "";
}

function monthLabel(value) {
  if (!value) return "—";
  const [y, m] = value.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-PK", { month: "short", year: "numeric" });
}

function isOverdue(f) {
  if (f.status === "Paid") return false;
  if (f.status === "Overdue") return true;
  return !!(f.due_date && f.due_date < todayISO());
}

function remainingOf(f) {
  if (typeof f.remaining === "number") return f.remaining;
  return Math.max(0, Number(f.amount || 0) + Number(f.late_fine || 0) - Number(f.paid_amount || 0));
}

const EMPTY_FORM = {
  student: "",
  fee_type: "Tuition",
  month: currentMonth(),
  amount: "",
  paid_amount: "",
  late_fine: "0",
  due_date: todayISO(),
  date: todayISO(),
  payment_method: "Cash",
  status: "Paid",
  remarks: "",
};

export default function Fees() {
  const tenant = useTenant();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [feeStats, setFeeStats] = useState({ collected: 0, pending: 0, overdue_count: 0, month_collected: 0 });
  const [viewMode, setViewMode] = useState("students");
  const [selectedClass, setSelectedClass] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formData, setFormData] = useState(EMPTY_FORM);

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map(classLabel);
    const fromStudents = students.map((s) => s.class_name);
    return unique([...fromApi, ...fromStudents]);
  }, [schoolClasses, students]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feesRes, studentsRes, statsRes, classRes] = await Promise.all([
        getFees(),
        getStudents(),
        getFeeStats().catch(() => ({ data: {} })),
        getClasses().catch(() => ({ data: [] })),
      ]);
      setFees(Array.isArray(feesRes.data) ? feesRes.data : []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setFeeStats(statsRes.data || {});
      setSchoolClasses(Array.isArray(classRes.data) ? classRes.data : []);
    } catch (err) {
      console.error("Failed to load fees:", err);
      setFees([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setField = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const openAdd = (studentId = "") => {
    setFormData({ ...EMPTY_FORM, student: studentId ? String(studentId) : "", month: currentMonth(), due_date: todayISO(), date: todayISO() });
    setEditingId(null);
    setViewing(null);
    setShowModal(true);
  };

  const openEdit = (f) => {
    setFormData({
      student: String(f.student || ""),
      fee_type: f.fee_type || "Tuition",
      month: f.month || currentMonth(),
      amount: String(f.amount ?? ""),
      paid_amount: String(f.paid_amount ?? ""),
      late_fine: String(f.late_fine ?? 0),
      due_date: f.due_date || todayISO(),
      date: f.date || todayISO(),
      payment_method: f.payment_method || "Cash",
      status: f.status || "Pending",
      remarks: f.remarks || "",
    });
    setEditingId(f.id);
    setViewing(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.student || !formData.amount) return alert("Student and amount are required");
    setSaving(true);
    try {
      const payload = {
        student: Number(formData.student),
        fee_type: formData.fee_type,
        month: formData.month,
        amount: Number(formData.amount),
        paid_amount: formData.paid_amount === "" ? undefined : Number(formData.paid_amount),
        late_fine: Number(formData.late_fine || 0),
        due_date: formData.due_date || null,
        date: formData.date || null,
        payment_method: formData.payment_method,
        status: formData.status,
        remarks: formData.remarks,
      };
      if (editingId) await updateFee(editingId, payload);
      else await createFee(payload);
      closeModal();
      await fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error;
      alert(detail || "Failed to save fee record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete fee record for ${name}?`)) return;
    try {
      await deleteFee(id);
      setViewing(null);
      await fetchData();
    } catch {
      alert("Failed to delete fee");
    }
  };

  const handleMarkPaid = async (f) => {
    try {
      await updateFee(f.id, { status: "Paid", paid_amount: Number(f.amount || 0) + Number(f.late_fine || 0), date: todayISO() });
      await fetchData();
    } catch {
      alert("Failed to mark as paid");
    }
  };

  const sendReminder = (s, outstanding) => {
    const phone = contactPhone(s);
    if (!phone) return;
    const msg = encodeURIComponent(
      `Dear Parent,\nThis is a reminder that school fee for ${s.name} is pending${outstanding ? ` (Rs ${outstanding.toLocaleString()})` : ""}. Kindly submit the dues at your earliest.\n\n${tenant.schoolName || "School"}`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const studentRows = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const blob = [s.name, s.roll_no, s.class_name, s.father_name].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchClass = selectedClass === "All" || s.class_name === selectedClass;
    return matchSearch && matchClass && (s.status || "Active") === "Active";
  });

  const ledgerRows = fees.filter((f) => {
    const q = search.toLowerCase().trim();
    const blob = [f.student_name, f.roll_no, f.student_class, f.receipt_no, f.fee_type, f.month].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchClass = selectedClass === "All" || f.student_class === selectedClass;
    const st = isOverdue(f) ? "Overdue" : f.status;
    const matchStatus = statusFilter === "All" || st === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  const duesFor = (studentId) =>
    fees.filter((f) => f.student === studentId).reduce((sum, f) => sum + remainingOf(f), 0);

  const lastPaid = (studentId) =>
    fees.find((f) => f.student === studentId && f.status === "Paid");

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Accounts</p>
          <h1>Fees</h1>
          <p>Collect tuition, track dues, and send reminders for {tenant.schoolName || "your school"}.</p>
        </div>
        <div className="dash-hero-meta">
          <button type="button" className="st-add-btn" onClick={() => openAdd()}>
            <Plus size={16} /> Record payment
          </button>
        </div>
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-green" onClick={() => { setViewMode("ledger"); setStatusFilter("Paid"); }}>
          <span>Collected</span>
          <strong>{loading ? "—" : money(feeStats.collected)}</strong>
          <small>all time</small>
        </button>
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => { setViewMode("ledger"); setStatusFilter("Pending"); }}>
          <span>Pending</span>
          <strong>{loading ? "—" : money(feeStats.pending)}</strong>
          <small>still due</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => { setViewMode("ledger"); setStatusFilter("Overdue"); }}>
          <span>Overdue</span>
          <strong>{loading ? "—" : feeStats.overdue_count || 0}</strong>
          <small>invoices</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold">
          <span>This month</span>
          <strong>{loading ? "—" : money(feeStats.month_collected)}</strong>
          <small>{monthLabel(currentMonth())}</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-filters">
          <button type="button" className={viewMode === "students" ? "is-on" : ""} onClick={() => setViewMode("students")}>
            <Users size={14} /> Students
          </button>
          <button type="button" className={viewMode === "ledger" ? "is-on" : ""} onClick={() => setViewMode("ledger")}>
            <CreditCard size={14} /> Ledger
          </button>
        </div>
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder={viewMode === "ledger" ? "Search student, receipt, month…" : "Search student, roll no, class…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        {viewMode === "ledger" && (
          <div className="st-filters">
            {["All", "Paid", "Pending", "Partial", "Overdue"].map((f) => (
              <button key={f} type="button" className={statusFilter === f ? "is-on" : ""} onClick={() => setStatusFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="st-classes">
        <button type="button" className={selectedClass === "All" ? "is-on" : ""} onClick={() => setSelectedClass("All")}>
          All classes
        </button>
        {classOptions.map((c) => (
          <button key={c} type="button" className={selectedClass === c ? "is-on" : ""} onClick={() => setSelectedClass(c)}>
            {c}
          </button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading fees…</p>
          </div>
        ) : viewMode === "students" ? (
          studentRows.length === 0 ? (
            <div className="st-empty">
              <Users size={36} />
              <p>No students match these filters.</p>
            </div>
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll</th>
                    <th>Class</th>
                    <th>Outstanding</th>
                    <th>Last paid</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((s) => {
                    const due = duesFor(s.id);
                    const paid = lastPaid(s.id);
                    const phone = contactPhone(s);
                    return (
                      <tr key={s.id}>
                        <td>
                          <button type="button" className="st-person" onClick={() => setViewing(s)}>
                            <span>{s.name ? s.name[0].toUpperCase() : "S"}</span>
                            <div>
                              <b>{s.name}</b>
                              <small>{s.father_name || phone || "Student"}</small>
                            </div>
                          </button>
                        </td>
                        <td className="st-mono">{s.roll_no || "—"}</td>
                        <td>{s.class_name || "—"}</td>
                        <td>
                          <span className={`st-badge ${due > 0 ? "is-warn" : "is-on"}`}>
                            {due > 0 ? money(due) : "Cleared"}
                          </span>
                        </td>
                        <td>{paid ? `${money(paid.paid_amount || paid.amount)} · ${monthLabel(paid.month) || paid.date || "—"}` : "—"}</td>
                        <td>
                          <div className="st-actions">
                            {due > 0 && (
                              <button type="button" title={phone ? "WhatsApp reminder" : "No phone"} disabled={!phone} className="fee-wa" onClick={() => sendReminder(s, due)}>
                                <MessageCircle size={14} />
                              </button>
                            )}
                            <button type="button" className="fee-collect" onClick={() => openAdd(s.id)}>Collect</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : ledgerRows.length === 0 ? (
          <div className="st-empty">
            <CreditCard size={36} />
            <p>No fee records yet. Record the first payment.</p>
            <button type="button" onClick={() => openAdd()}>Record payment</button>
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Month</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((f) => {
                  const st = isOverdue(f) ? "Overdue" : f.status;
                  return (
                    <tr key={f.id}>
                      <td>
                        <div className="st-cell-stack">
                          <b>{f.student_name}</b>
                          <small>{f.receipt_no || f.roll_no || f.student_class}</small>
                        </div>
                      </td>
                      <td>{monthLabel(f.month)}</td>
                      <td>{f.fee_type || "Tuition"}</td>
                      <td className="st-mono">{money(Number(f.amount || 0) + Number(f.late_fine || 0))}</td>
                      <td className="st-mono">{money(f.paid_amount)}</td>
                      <td>
                        <span className={`st-badge ${st === "Paid" ? "is-on" : st === "Overdue" ? "is-warn" : "is-off"}`}>
                          {st}
                        </span>
                      </td>
                      <td>
                        <div className="st-actions">
                          {st !== "Paid" && (
                            <button type="button" title="Mark paid" onClick={() => handleMarkPaid(f)}>
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          <button type="button" title="Edit" onClick={() => openEdit(f)}><Eye size={15} /></button>
                          <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(f.id, f.student_name)}>
                            <Trash2 size={15} />
                          </button>
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
        {viewMode === "students"
          ? `Showing ${studentRows.length} of ${students.length} students`
          : `Showing ${ledgerRows.length} of ${fees.length} records`}
      </p>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
              <div>
                <p>Fee record</p>
                <h2>{editingId ? "Edit payment" : "Record payment"}</h2>
              </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Invoice</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Student *
                  <select required value={formData.student} onChange={setField("student")}>
                    <option value="">Select student</option>
                    {students.filter((s) => (s.status || "Active") === "Active").map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.class_name || "No class"} · {s.roll_no || "No roll"}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Fee type
                  <select value={formData.fee_type} onChange={setField("fee_type")}>
                    {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Month
                  <input type="month" value={formData.month} onChange={setField("month")} />
                </label>
                <label>
                  Amount (Rs) *
                  <input required type="number" min="0" value={formData.amount} onChange={setField("amount")} placeholder="0" />
                </label>
                <label>
                  Late fine
                  <input type="number" min="0" value={formData.late_fine} onChange={setField("late_fine")} />
                </label>
                <label>
                  Paid amount
                  <input type="number" min="0" value={formData.paid_amount} onChange={setField("paid_amount")} placeholder="Leave empty if fully paid" />
                </label>
                <label>
                  Status
                  <select value={formData.status} onChange={setField("status")}>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </label>
              </div>
              <p className="st-section">Payment</p>
              <div className="st-grid">
                <label>
                  Due date
                  <input type="date" value={formData.due_date} onChange={setField("due_date")} />
                </label>
                <label>
                  Payment date
                  <input type="date" value={formData.date} onChange={setField("date")} />
                </label>
                <label>
                  Method
                  <select value={formData.payment_method} onChange={setField("payment_method")}>
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label>
                  Remarks
                  <input value={formData.remarks} onChange={setField("remarks")} placeholder="Optional note" />
                </label>
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Save record"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {viewing && (
        <AppModal onClose={() => setViewing(null)}>
          <div className="st-modal st-view">
            <header>
              <div>
                <p>{viewing.roll_no || "Student"}</p>
                <h2>{viewing.name}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Outstanding: {money(duesFor(viewing.id))}</p>
              {fees.filter((f) => f.student === viewing.id).length === 0 ? (
                <p className="st-hint">No fee records for this student yet.</p>
              ) : (
                <ul className="fee-history">
                  {fees.filter((f) => f.student === viewing.id).map((f) => (
                    <li key={f.id}>
                      <div>
                        <b>{f.fee_type || "Tuition"} · {monthLabel(f.month)}</b>
                        <small>{f.receipt_no || "No receipt"} · {isOverdue(f) ? "Overdue" : f.status}</small>
                      </div>
                      <strong>{money(f.paid_amount)} / {money(Number(f.amount || 0) + Number(f.late_fine || 0))}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setViewing(null)}>Close</button>
              <button type="button" className="st-add-btn" onClick={() => openAdd(viewing.id)}>Collect fee</button>
            </footer>
          </div>
        </AppModal>
      )}
    </div>
  );
}
