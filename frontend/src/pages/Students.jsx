import { useEffect, useState } from "react";
import { Search, Plus, Filter, Edit, Phone, X, Trash2, Loader2, MessageCircle } from "lucide-react";
import { getStudents, createStudent, deleteStudent, updateStudent } from "../api/studentsApi";
import { getFees } from "../api/feesApi";

const CLASS_OPTIONS = [
  "Nursery", "Prep",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [fees, setFees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: "", class_name: "Grade 10", email: "", phone: "", status: "Active" };
  const [formData, setFormData] = useState(emptyForm);

  // ─── Fetch ────────────────────────────────────────────────────────
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [res, feesRes] = await Promise.all([
        getStudents(),
        getFees()
      ]);
      setStudents(res.data || []);
      setFees(feesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch students/fees:", err);
      setStudents([]);
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  // ─── Filtering ───────────────────────────────────────────────────
  const filtered = Array.isArray(students) ? students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
      (s.class_name && s.class_name.toLowerCase().includes(q));
    const matchStatus = filterStatus === "All" || (s.status || "Active") === filterStatus;
    const matchClass = selectedClass === "All" || s.class_name === selectedClass;
    return matchSearch && matchStatus && matchClass;
  }) : [];

  // ─── Modal helpers ────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setFormData({
      name: s.name || "",
      class_name: s.class_name || "Grade 10",
      email: s.email || "",
      phone: s.phone || "",
      status: s.status || "Active",
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  // ─── Save ─────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Name is required");
    if (!formData.class_name) return alert("Class is required");
    setSaving(true);
    try {
      if (editingId) {
        await updateStudent(editingId, formData);
      } else {
        await createStudent(formData);
      }
      closeModal();
      await fetchStudents();
    } catch (err) {
      // Show the plan-limit or server error message clearly
      const detail = err.response?.data?.detail || err.response?.data?.error;
      if (detail) {
        alert(`❌ ${detail}`);
      } else {
        alert(editingId ? "Failed to update student." : "Failed to create student. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      await fetchStudents();
    } catch (err) {
      alert("Failed to delete student");
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {loading ? "Loading..." : `${students.length} students enrolled`}
          </p>
        </div>
        <button className="primary-btn" onClick={openAdd}>
          <Plus size={18} /> Add Student
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name, class or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 6px", color: "var(--text-muted)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="filter-group">
          <Filter size={16} />
          {["All", "Active", "Inactive"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filterStatus === f ? "filter-active" : ""}`}
              onClick={() => setFilterStatus(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {["All", "Active", "Inactive"].map((s) => {
          const count = s === "All" ? (Array.isArray(students) ? students.length : 0) : (Array.isArray(students) ? students.filter(st => (st.status || "Active") === s).length : 0);
          return (
            <div key={s} style={{ background: "var(--bg-paper)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text)", fontSize: "1.1rem" }}>{count}</strong> {s}
            </div>
          );
        })}
      </div>

      {/* Class Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 8, whiteSpace: "nowrap" }}>
        <button
          className={`filter-btn ${selectedClass === "All" ? "filter-active" : ""}`}
          onClick={() => setSelectedClass("All")}
        >
          All Classes
        </button>
        {CLASS_OPTIONS.map(c => (
          <button
            key={c}
            className={`filter-btn ${selectedClass === c ? "filter-active" : ""}`}
            onClick={() => setSelectedClass(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card table-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 className="spin" size={36} />
            <p style={{ marginTop: 12 }}>Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {search || filterStatus !== "All"
              ? "No students match your search or filter."
              : "No students yet. Click \"Add Student\" to enroll the first one!"}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No.</th>
                <th>Class</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Fee Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                // Check if the student has a paid fee record
                const studentFees = fees.filter(f => f.student === s.id);
                // For simplicity, if there's any pending fee or no paid fee at all, they might be unpaid
                // Adjust logic as needed. Here we consider paid if they have at least one "Paid" status.
                const hasPaid = studentFees.some(f => f.status === "Paid");
                const isPending = studentFees.some(f => f.status === "Pending" || f.status === "Overdue");
                const feeStatus = hasPaid && !isPending ? "Paid" : "Unpaid";
                
                return (
                <tr key={s.id} className="table-row">
                  <td>
                    <div className="table-name-cell">
                      <div className="table-avatar">{s.name ? s.name[0].toUpperCase() : "S"}</div>
                      <div>
                        <p className="table-name">{s.name}</p>
                        <p className="table-email">{s.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-mono">{s.roll_no || "—"}</td>
                  <td>{s.class_name || "—"}</td>
                  <td>{s.phone || "N/A"}</td>
                  <td>
                    <span className={`badge-status ${(s.status || "Active") === "Inactive" ? "badge-inactive" : "badge-active"}`}>
                      {s.status || "Active"}
                    </span>
                  </td>
                  <td>
                    {feeStatus === "Paid" ? (
                      <span className="badge-status badge-active">Paid</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="badge-status badge-inactive" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Unpaid</span>
                            <button 
                              title={s.phone ? "Send WhatsApp Reminder" : "No phone number added"}
                              disabled={!s.phone}
                              onClick={() => {
                                if (!s.phone) return;
                                const msg = encodeURIComponent(`Dear Parent,\nThis is a gentle reminder that the school fee for your child, ${s.name}, is currently pending. Kindly submit the dues by the 10th of this month to avoid any inconvenience.\n\nThank you!`);
                                window.open(`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
                              }}
                              style={{ 
                                background: s.phone ? "#25D366" : "var(--bg-hover)", 
                                color: s.phone ? "white" : "var(--text-muted)", 
                                border: "none", 
                                borderRadius: "50%", width: 26, height: 26, display: "flex", 
                                alignItems: "center", justifyContent: "center", 
                                cursor: s.phone ? "pointer" : "not-allowed",
                                opacity: s.phone ? 1 : 0.5
                              }}
                            >
                              <MessageCircle size={14} />
                            </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        className="icon-btn-sm"
                        title="Edit"
                        onClick={() => openEdit(s)}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="icon-btn-danger"
                        title="Delete"
                        onClick={() => handleDelete(s.id, s.name)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      <p className="table-count">Showing {filtered.length} of {students.length} students</p>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Edit Student" : "Add New Student"}</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form">

                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input
                      required
                      className="input-field"
                      placeholder="e.g. Ali Hassan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Class / Grade *</label>
                    <select
                      required
                      className="input-field"
                      value={formData.class_name}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    >
                      <option value="">Select a class...</option>
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="input-group">
                      <label className="input-label">Phone</label>
                      <input
                        className="input-field"
                        placeholder="0300-0000000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Status</label>
                      <select
                        className="input-field"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {!editingId && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                      ✦ Roll number will be auto-generated after saving.
                    </p>
                  )}

                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
