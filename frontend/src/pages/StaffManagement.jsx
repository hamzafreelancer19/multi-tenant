import { useEffect, useMemo, useState } from "react";
import { 
  Edit,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Plus, 
  Search, 
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getPayroll,
  createPayroll,
  deletePayroll,
} from "../api/staffApi";
import { useTenant } from "../context/TenantContext";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./StaffManagement.css";

const ROLES = [
  "Admin", "Accountant", "Clerk", "Receptionist", "Librarian", "Lab Assistant",
  "Driver", "Conductor", "Security", "Peon", "Aya", "Cleaner", "Other",
];
const SHIFTS = ["Morning", "Evening", "Full day"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const METHODS = ["Cash", "Bank", "JazzCash", "EasyPaisa", "Cheque"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentMonthName() {
  return MONTHS[new Date().getMonth()];
}

function money(n) {
  return `Rs ${Number(n || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function netOf(p) {
  if (typeof p.net_amount === "number") return p.net_amount;
  return Number(p.amount_paid || 0) + Number(p.bonus || 0) - Number(p.deduction || 0);
}

function apiError(err) {
  const data = err.response?.data;
  if (!data) return "Could not save.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || "Could not save.";
}

const EMPTY_STAFF = {
  name: "",
  role: "Other",
  shift: "Morning",
  gender: "",
  cnic: "",
  date_of_birth: "",
  phone: "",
  emergency_phone: "",
  email: "",
  address: "",
  city: "",
  salary: "",
  joining_date: todayISO(),
  status: "Active",
  notes: "",
};

const EMPTY_PAY = {
  staff: "",
  month: currentMonthName(),
  year: String(new Date().getFullYear()),
  amount_paid: "",
  bonus: "0",
  deduction: "0",
  payment_method: "Cash",
  payment_date: todayISO(),
  remarks: "",
  status: "Paid",
};

export default function StaffManagement() {
  const tenant = useTenant();
  const [viewMode, setViewMode] = useState("staff");
  const [staffList, setStaffList] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [payTab, setPayTab] = useState("All");
  const [showStaff, setShowStaff] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [historyStaff, setHistoryStaff] = useState(null);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF);
  const [payForm, setPayForm] = useState(EMPTY_PAY);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([getStaff(), getPayroll()]);
      setStaffList(Array.isArray(sRes.data) ? sRes.data : []);
      setPayroll(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (err) {
      console.error(err);
      setStaffList([]);
      setPayroll([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const setS = (key) => (e) => setStaffForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setP = (key) => (e) => {
    const value = e.target.value;
    setPayForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "staff") {
        const person = staffList.find((x) => String(x.id) === String(value));
        if (person) next.amount_paid = String(person.salary || 0);
      }
      return next;
    });
  };

  const openAddStaff = () => {
    setStaffForm({ ...EMPTY_STAFF, joining_date: todayISO() });
    setEditingId(null);
    setShowStaff(true);
  };

  const openEditStaff = (s) => {
    setStaffForm({
      name: s.name || "",
      role: s.role || "Other",
      shift: s.shift || "Morning",
      gender: s.gender || "",
      cnic: s.cnic || "",
      date_of_birth: s.date_of_birth || "",
      phone: s.phone || "",
      emergency_phone: s.emergency_phone || "",
      email: s.email || "",
      address: s.address || "",
      city: s.city || "",
      salary: String(s.salary || ""),
      joining_date: s.joining_date || todayISO(),
      status: s.status || "Active",
      notes: s.notes || "",
    });
    setEditingId(s.id);
    setViewing(null);
    setShowStaff(true);
  };

  const openPay = (staff = null) => {
    setPayForm({
      ...EMPTY_PAY,
      staff: staff ? String(staff.id) : "",
      amount_paid: staff ? String(staff.salary || 0) : "",
      month: currentMonthName(),
      year: String(new Date().getFullYear()),
      payment_date: todayISO(),
    });
    setShowPay(true);
  };

  const handleStaffSave = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim()) return alert("Name is required");
    setSaving(true);
    try {
      const payload = {
        ...staffForm,
        salary: Number(staffForm.salary) || 0,
        email: staffForm.email || "",
        joining_date: staffForm.joining_date || null,
        date_of_birth: staffForm.date_of_birth || null,
      };
      if (editingId) await updateStaff(editingId, payload);
      else await createStaff(payload);
      setShowStaff(false);
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePaySave = async (e) => {
    e.preventDefault();
    if (!payForm.staff) return alert("Select a staff member");
    setSaving(true);
    try {
      await createPayroll({
        ...payForm,
        staff: Number(payForm.staff),
        year: Number(payForm.year),
        amount_paid: Number(payForm.amount_paid) || 0,
        bonus: Number(payForm.bonus) || 0,
        deduction: Number(payForm.deduction) || 0,
      });
      setShowPay(false);
      setViewMode("payroll");
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteStaff(id);
      setViewing(null);
      await fetchAll();
    } catch {
      alert("Could not delete staff. Remove payslips first.");
    }
  };

  const handleDeletePay = async (id) => {
    if (!window.confirm("Delete this payslip?")) return;
    try {
      await deletePayroll(id);
      await fetchAll();
    } catch {
      alert("Could not delete payslip.");
    }
  };

  const sendWa = (person) => {
    const phone = person.phone || person.emergency_phone;
    if (!phone) return alert("No phone on this record.");
    const msg = encodeURIComponent(`Salaam ${person.name}, a message from ${tenant.schoolName || "school"} staff office.`);
    window.open(`https://wa.me/${String(phone).replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const printSlip = (item) => {
    const person = staffList.find((s) => s.id === item.staff);
    const win = window.open("", "_blank", "width=640,height=780");
    if (!win) return;
    const net = netOf(item);
    win.document.write(`
      <html><head><title>${item.receipt_no || "Payslip"}</title>
      <style>
        body{font-family:Georgia,serif;padding:40px;color:#0f172a}
        h1{margin:0;font-size:28px} small{color:#64748b}
        table{width:100%;border-collapse:collapse;margin-top:24px}
        td{padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
        td:last-child{text-align:right;font-weight:700}
      </style></head><body>
      <h1>${tenant.schoolName || "School"}</h1>
      <small>Salary slip · ${item.receipt_no || ""}</small>
      <table>
        <tr><td>Employee</td><td>${item.staff_name || ""} (${item.staff_role || ""})</td></tr>
        <tr><td>ID</td><td>${person?.employee_id || "—"}</td></tr>
        <tr><td>Month</td><td>${item.month} ${item.year}</td></tr>
        <tr><td>Basic</td><td>Rs ${Number(item.amount_paid || 0).toLocaleString()}</td></tr>
        <tr><td>Bonus</td><td>Rs ${Number(item.bonus || 0).toLocaleString()}</td></tr>
        <tr><td>Deduction</td><td>Rs ${Number(item.deduction || 0).toLocaleString()}</td></tr>
        <tr><td>Net paid</td><td>Rs ${Number(net).toLocaleString()}</td></tr>
        <tr><td>Method</td><td>${item.payment_method || "Cash"}</td></tr>
        <tr><td>Date</td><td>${item.payment_date || "—"}</td></tr>
        <tr><td>Status</td><td>${item.status || "Paid"}</td></tr>
      </table>
      <p style="margin-top:40px;font-size:12px;color:#64748b">${item.remarks || ""}</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const filteredStaff = staffList.filter((s) => {
    const q = search.trim().toLowerCase();
    const blob = [s.name, s.role, s.phone, s.email, s.employee_id, s.city].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchRole = roleFilter === "All" || s.role === roleFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredPay = payroll.filter((p) => {
    const q = search.trim().toLowerCase();
    const blob = [p.staff_name, p.staff_role, p.month, p.receipt_no].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchTab = payTab === "All" || p.status === payTab;
    return matchSearch && matchTab;
  });

  const thisMonth = currentMonthName();
  const thisYear = new Date().getFullYear();
  const paidThisMonth = payroll.filter((p) => p.month === thisMonth && Number(p.year) === thisYear && p.status === "Paid");
  const stats = {
    total: staffList.length,
    active: staffList.filter((s) => s.status === "Active").length,
    bill: staffList.filter((s) => s.status === "Active").reduce((sum, s) => sum + Number(s.salary || 0), 0),
    paid: paidThisMonth.reduce((sum, p) => sum + netOf(p), 0),
  };

  const historyRows = historyStaff ? payroll.filter((p) => p.staff === historyStaff.id) : [];
  const usedRoles = useMemo(() => {
    const fromData = [...new Set(staffList.map((s) => s.role).filter(Boolean))];
    return fromData.length ? fromData : ROLES;
  }, [staffList]);

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Human resources</p>
          <h1>Staff & payroll</h1>
          <p>Non-teaching staff and monthly salaries for {tenant.schoolName || "your school"}.</p>
        </div>
        <div className="dash-hero-meta">
          <button type="button" className="st-ghost" onClick={() => openPay()}>Pay salary</button>
          <button type="button" className="st-add-btn" onClick={openAddStaff}>
            <Plus size={16} /> Add staff
          </button>
        </div>
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => setViewMode("staff")}>
          <span>Staff</span>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>in directory</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => { setViewMode("staff"); setStatusFilter("Active"); }}>
          <span>Active</span>
          <strong>{loading ? "—" : stats.active}</strong>
          <small>on duty</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setViewMode("staff")}>
          <span>Payroll</span>
          <strong>{loading ? "—" : money(stats.bill)}</strong>
          <small>monthly bill</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => { setViewMode("payroll"); setPayTab("Paid"); }}>
          <span>Paid</span>
          <strong>{loading ? "—" : money(stats.paid)}</strong>
          <small>{thisMonth}</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder={viewMode === "payroll" ? "Search name, month, receipt…" : "Search name, role, phone, ID…"}
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
          <button type="button" className={viewMode === "staff" ? "is-on" : ""} onClick={() => setViewMode("staff")}>Directory</button>
          <button type="button" className={viewMode === "payroll" ? "is-on" : ""} onClick={() => setViewMode("payroll")}>Payroll</button>
        </div>
      </div>

      {viewMode === "staff" ? (
        <div className="st-classes">
          <button type="button" className={roleFilter === "All" && statusFilter === "All" ? "is-on" : ""} onClick={() => { setRoleFilter("All"); setStatusFilter("All"); }}>All</button>
          {["Active", "Inactive"].map((s) => (
            <button key={s} type="button" className={statusFilter === s ? "is-on" : ""} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
          {usedRoles.map((r) => (
            <button key={r} type="button" className={roleFilter === r ? "is-on" : ""} onClick={() => setRoleFilter(r)}>{r}</button>
          ))}
        </div>
      ) : (
        <div className="st-classes">
          {["All", "Paid", "Pending"].map((s) => (
            <button key={s} type="button" className={payTab === s ? "is-on" : ""} onClick={() => setPayTab(s)}>{s}</button>
          ))}
        </div>
      )}

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading staff…</p>
          </div>
        ) : viewMode === "staff" ? (
          filteredStaff.length === 0 ? (
            <div className="st-empty">
              <Users size={36} />
              <p>{staffList.length ? "No staff match these filters." : "No staff yet. Add the first employee."}</p>
              {!staffList.length && <button type="button" onClick={openAddStaff}>Add staff</button>}
                     </div>
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <button type="button" className="st-person" onClick={() => setViewing(s)}>
                          <span>{(s.name || "S").slice(0, 1)}</span>
                          <div>
                            <b>{s.name}</b>
                            <small>{s.employee_id || "No ID"}{s.shift ? ` · ${s.shift}` : ""}</small>
                  </div>
                        </button>
                      </td>
                      <td>{s.role || "—"}</td>
                      <td className="st-mono">{s.phone || "—"}</td>
                      <td className="st-mono">{money(s.salary)}</td>
                      <td>
                        <span className={`st-badge ${s.status === "Active" ? "is-on" : "is-off"}`}>{s.status}</span>
                      </td>
                      <td>
                        <div className="st-actions">
                          <button type="button" title="View" onClick={() => setViewing(s)}><Eye size={15} /></button>
                          {s.phone && (
                            <button type="button" title="WhatsApp" onClick={() => sendWa(s)}><MessageCircle size={15} /></button>
                          )}
                          <button type="button" title="Pay" onClick={() => openPay(s)}><FileText size={15} /></button>
                          <button type="button" title="Edit" onClick={() => openEditStaff(s)}><Edit size={15} /></button>
                          <button type="button" className="is-danger" title="Delete" onClick={() => handleDeleteStaff(s.id, s.name)}>
                            <Trash2 size={15} />
                          </button>
                  </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                  </div>
          )
        ) : filteredPay.length === 0 ? (
          <div className="st-empty">
            <FileText size={36} />
            <p>{payroll.length ? "No payslips match these filters." : "No salary payments yet."}</p>
            {!payroll.length && <button type="button" onClick={() => openPay()}>Pay salary</button>}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month</th>
                  <th>Net</th>
                  <th>Receipt</th>
                  <th>Status</th>
                  <th />
                 </tr>
              </thead>
              <tbody>
                {filteredPay.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="st-cell-stack">
                        <b>{p.staff_name}</b>
                        <small>{p.staff_role}</small>
                      </div>
                    </td>
                    <td>
                      <div className="st-cell-stack">
                        <b>{p.month} {p.year}</b>
                        <small>{formatDate(p.payment_date)}</small>
                      </div>
                    </td>
                    <td className="st-mono">{money(netOf(p))}</td>
                    <td className="st-mono">{p.receipt_no || "—"}</td>
                    <td>
                      <span className={`st-badge ${p.status === "Paid" ? "is-on" : "is-warn"}`}>{p.status}</span>
                      </td>
                    <td>
                      <div className="st-actions">
                        <button type="button" title="Slip" onClick={() => printSlip(p)}><FileText size={15} /></button>
                        <button type="button" className="is-danger" title="Delete" onClick={() => handleDeletePay(p.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
      </section>

      <p className="st-count">
        {viewMode === "staff"
          ? `Showing ${filteredStaff.length} of ${staffList.length} staff`
          : `Showing ${filteredPay.length} of ${payroll.length} payslips`}
      </p>

      {showStaff && (
        <AppModal onClose={() => setShowStaff(false)}>
          <form className="st-modal" onSubmit={handleStaffSave}>
            <header>
              <div>
                <p>Directory</p>
                <h2>{editingId ? "Edit staff" : "Add staff"}</h2>
              </div>
              <button type="button" onClick={() => setShowStaff(false)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Profile</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Full name *
                  <input required value={staffForm.name} onChange={setS("name")} />
                </label>
                <label>
                  Role
                  <select value={staffForm.role} onChange={setS("role")}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label>
                  Shift
                  <select value={staffForm.shift} onChange={setS("shift")}>
                    {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Gender
                  <select value={staffForm.gender} onChange={setS("gender")}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                          <option>Other</option>
                       </select>
                </label>
                <label>
                  CNIC
                  <input value={staffForm.cnic} onChange={setS("cnic")} placeholder="xxxxx-xxxxxxx-x" />
                </label>
                <label>
                  Date of birth
                  <input type="date" value={staffForm.date_of_birth} onChange={setS("date_of_birth")} />
                </label>
                <label>
                  Joining date
                  <input type="date" value={staffForm.joining_date} onChange={setS("joining_date")} />
                </label>
                <label>
                  Phone
                  <input value={staffForm.phone} onChange={setS("phone")} placeholder="03xx…" />
                </label>
                <label>
                  Emergency phone
                  <input value={staffForm.emergency_phone} onChange={setS("emergency_phone")} />
                </label>
                <label>
                  Email
                  <input type="email" value={staffForm.email} onChange={setS("email")} />
                </label>
                <label>
                  Monthly salary
                  <input type="number" min="0" value={staffForm.salary} onChange={setS("salary")} placeholder="0" />
                </label>
                <label>
                  City
                  <input value={staffForm.city} onChange={setS("city")} />
                </label>
                <label>
                  Status
                  <select value={staffForm.status} onChange={setS("status")}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </label>
                <label className="st-span-2">
                  Address
                  <input value={staffForm.address} onChange={setS("address")} />
                </label>
                <label className="st-span-2">
                  Notes
                  <input value={staffForm.notes} onChange={setS("notes")} />
                </label>
                    </div>
                 </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setShowStaff(false)}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Add staff"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {showPay && (
        <AppModal onClose={() => setShowPay(false)}>
          <form className="st-modal" onSubmit={handlePaySave}>
            <header>
                 <div>
                <p>Payroll</p>
                <h2>Pay salary</h2>
              </div>
              <button type="button" onClick={() => setShowPay(false)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="st-grid">
                <label className="st-span-2">
                  Staff *
                  <select required value={payForm.staff} onChange={setP("staff")}>
                    <option value="">Select staff</option>
                    {staffList.filter((s) => s.status === "Active").map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.role} · {money(s.salary)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Month
                  <select value={payForm.month} onChange={setP("month")}>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label>
                  Year
                  <input type="number" value={payForm.year} onChange={setP("year")} />
                </label>
                <label>
                  Basic
                  <input type="number" min="0" value={payForm.amount_paid} onChange={setP("amount_paid")} />
                </label>
                <label>
                  Bonus
                  <input type="number" min="0" value={payForm.bonus} onChange={setP("bonus")} />
                </label>
                <label>
                  Deduction
                  <input type="number" min="0" value={payForm.deduction} onChange={setP("deduction")} />
                </label>
                <label>
                  Method
                  <select value={payForm.payment_method} onChange={setP("payment_method")}>
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label>
                  Payment date
                  <input type="date" required value={payForm.payment_date} onChange={setP("payment_date")} />
                </label>
                <label>
                  Status
                  <select value={payForm.status} onChange={setP("status")}>
                    <option>Paid</option>
                    <option>Pending</option>
                  </select>
                </label>
                <label className="st-span-2">
                  Remarks
                  <input value={payForm.remarks} onChange={setP("remarks")} placeholder="Optional" />
                </label>
                 </div>
              <p className="st-hint">
                Net: {money(Number(payForm.amount_paid || 0) + Number(payForm.bonus || 0) - Number(payForm.deduction || 0))}
              </p>
                 </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setShowPay(false)}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : "Save payslip"}
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
                <p>{viewing.employee_id || "Staff"} · {viewing.role}</p>
                <h2>{viewing.name}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="sf-view-grid">
                <ViewRow label="Shift" value={viewing.shift} />
                <ViewRow label="Status" value={viewing.status} />
                <ViewRow label="Phone" value={viewing.phone} />
                <ViewRow label="Emergency" value={viewing.emergency_phone} />
                <ViewRow label="Email" value={viewing.email} />
                <ViewRow label="CNIC" value={viewing.cnic} />
                <ViewRow label="Salary" value={money(viewing.salary)} />
                <ViewRow label="Joined" value={formatDate(viewing.joining_date)} />
                <ViewRow label="City" value={viewing.city} />
                <ViewRow label="Gender" value={viewing.gender} />
              </div>
              {viewing.address && <p className="st-hint">{viewing.address}</p>}
              {viewing.notes && <p className="st-hint">{viewing.notes}</p>}
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setViewing(null)}>Close</button>
              <button type="button" className="st-ghost" onClick={() => { setHistoryStaff(viewing); setViewing(null); }}>Payslips</button>
              <button type="button" className="st-ghost" onClick={() => openPay(viewing)}>Pay</button>
              <button type="button" className="st-add-btn" onClick={() => openEditStaff(viewing)}>Edit</button>
            </footer>
                 </div>
        </AppModal>
      )}

      {historyStaff && (
        <AppModal onClose={() => setHistoryStaff(null)}>
          <div className="st-modal">
            <header>
                    <div>
                <p>{historyStaff.role}</p>
                <h2>Payslips · {historyStaff.name}</h2>
                    </div>
              <button type="button" onClick={() => setHistoryStaff(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              {historyRows.length === 0 ? (
                <p className="st-hint">No payslips yet.</p>
              ) : (
                <ul className="sf-pay-list">
                  {historyRows.map((p) => (
                    <li key={p.id}>
                    <div>
                        <b>{p.month} {p.year}</b>
                        <small>{p.receipt_no || "No receipt"} · {p.status}</small>
                    </div>
                      <div className="st-actions">
                        <b>{money(netOf(p))}</b>
                        <button type="button" onClick={() => printSlip(p)}><FileText size={15} /></button>
                 </div>
                    </li>
                  ))}
                </ul>
              )}
                 </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setHistoryStaff(null)}>Close</button>
              <button type="button" className="st-add-btn" onClick={() => { setHistoryStaff(null); openPay(historyStaff); }}>Pay salary</button>
            </footer>
           </div>
        </AppModal>
      )}
    </div>
  );
}

function ViewRow({ label, value }) {
  return (
    <div className="sf-view-row">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}
