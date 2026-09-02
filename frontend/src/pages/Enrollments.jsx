import { useEffect, useState } from "react";
import { Search, Filter, X, Trash2, Loader2, CheckCircle, XCircle, Phone, User, Eye } from "lucide-react";
import { getEnrollments, acceptEnrollment, rejectEnrollment, deleteEnrollment } from "../api/enrollmentApi";
import AppModal from "../components/AppModal";
import "./Students.css";

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [createdLogin, setCreatedLogin] = useState(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await getEnrollments();
      setEnrollments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnrollments(); }, []);

  const filtered = Array.isArray(enrollments) ? enrollments.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (e.student_name && e.student_name.toLowerCase().includes(q)) ||
      (e.father_name && e.father_name.toLowerCase().includes(q)) ||
      (e.class_applying && e.class_applying.toLowerCase().includes(q));
    const matchStatus = filterStatus === "All"
      || e.status === filterStatus
      || (filterStatus === "PendingIncharge" && (e.status === "Pending" || e.status === "PendingIncharge"));
    return matchSearch && matchStatus;
  }) : [];

  const handleAccept = async (id, name) => {
    if (!window.confirm(`Accept enrollment for "${name}"?`)) return;
    try {
      const res = await acceptEnrollment(id);
      if (res.data?.parent_username || res.data?.student_username) {
        setCreatedLogin({
          name,
          student_username: res.data.student_username || "",
          student_password: res.data.student_password || "Student@123",
          parent_username: res.data.parent_username,
          parent_password: res.data.parent_password || res.data.parent_username,
        });
      }
      await fetchEnrollments();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || data?.non_field_errors?.[0] || (typeof data === "string" ? data : "") || "Failed to accept enrollment";
      alert(msg);
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Reject enrollment for "${name}"?`)) return;
    try {
      await rejectEnrollment(id);
      await fetchEnrollments();
    } catch (err) {
      alert("Failed to reject enrollment");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete record for "${name}"? This cannot be undone.`)) return;
    try {
      await deleteEnrollment(id);
      await fetchEnrollments();
    } catch (err) {
      alert("Failed to delete record");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admission Requests</h1>
          <p className="page-subtitle">
            {loading
              ? "Loading..."
              : `${enrollments.filter((e) => e.status === "PendingAdmin").length} ready to register · ${enrollments.filter((e) => e.status === "Pending" || e.status === "PendingIncharge").length} with class incharge`}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by student or father name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          {["All", "PendingIncharge", "PendingAdmin", "Accepted", "Rejected"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filterStatus === f ? "filter-active" : ""}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === "PendingIncharge" ? "Class test" : f === "PendingAdmin" ? "Ready" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 className="spin" size={36} />
            <p style={{ marginTop: 12 }}>Loading requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {search || filterStatus !== "All"
              ? "No requests match your search or filter."
              : "No admission requests yet."}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Age</th>
                <th>Parent</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="table-row">
                  <td>
                    <div className="table-name-cell">
                      <div className="table-avatar" style={{ background: e.status === 'Pending' ? 'var(--accent-soft)' : 'var(--secondary-soft)', color: e.status === 'Pending' ? 'var(--accent)' : 'var(--secondary)' }}>
                        <User size={18} />
                      </div>
                      <div>
                        <p className="table-name">{e.student_name}</p>
                        <p className="table-email">{e.gender || "Applicant"} {e.city ? `· ${e.city}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td>{e.class_applying || "—"}</td>
                  <td>{e.student_age} Yrs</td>
                  <td>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.father_name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> {e.father_phone}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status badge-${(e.status === "PendingIncharge" || e.status === "Pending" ? "pending" : e.status === "PendingAdmin" ? "pending" : e.status.toLowerCase())}`}>
                      {e.stage_label || e.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="icon-btn-sm" title="View details" onClick={() => setSelected(e)}>
                        <Eye size={16} />
                      </button>
                      {(e.status === "PendingAdmin" || ((e.status === "Pending" || e.status === "PendingIncharge") && !e.incharge_name)) && (
                        <>
                          <button
                            className="icon-btn-sm"
                            style={{ color: "#22C55E" }}
                            title="Accept"
                            onClick={() => handleAccept(e.id, e.student_name)}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            className="icon-btn-danger"
                            title="Reject"
                            onClick={() => handleReject(e.id, e.student_name)}
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button
                        className="icon-btn-danger"
                        style={{ opacity: 0.5 }}
                        title="Delete Record"
                        onClick={() => handleDelete(e.id, e.student_name)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createdLogin && (
        <AppModal onClose={() => setCreatedLogin(null)}>
          <div className="st-modal st-view">
            <header>
              <div>
                <p>Parent portal</p>
                <h2>Login saved</h2>
              </div>
              <button type="button" onClick={() => setCreatedLogin(null)}><X size={20} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Give the student login to {createdLogin.name}, and the parent login to the guardian.</p>
              <p><strong>Student username:</strong> {createdLogin.student_username || "—"}</p>
              <p><strong>Student password:</strong> {createdLogin.student_password || "Student@123"}</p>
              <p><strong>Parent username:</strong> {createdLogin.parent_username}</p>
              <p><strong>Parent password:</strong> {createdLogin.parent_password}</p>
            </div>
            <footer>
              <button type="button" className="st-add-btn" onClick={() => setCreatedLogin(null)}>Done</button>
            </footer>
          </div>
        </AppModal>
      )}

      {selected && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">{selected.student_name}</h2>
              <button className="close-btn" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <p><strong>Class:</strong> {selected.class_applying || "—"} {selected.incharge_name ? `· Incharge ${selected.incharge_name}` : ""}</p>
              <p><strong>Age / Gender:</strong> {selected.student_age} · {selected.gender || "—"}</p>
              <p><strong>Test:</strong> {selected.test_score != null ? `${selected.test_score}/${selected.test_total || 100}` : "Waiting for class test"}</p>
              <p style={{ gridColumn: "1 / -1" }}><strong>Test notes:</strong> {selected.test_notes || "—"}</p>
              <p><strong>DOB:</strong> {selected.date_of_birth || "—"}</p>
              <p><strong>B-Form:</strong> {selected.bform_cnic || "—"}</p>
              <p><strong>Previous school:</strong> {selected.previous_school || "—"}</p>
              <p><strong>City:</strong> {selected.city || "—"}</p>
              <p style={{ gridColumn: "1 / -1" }}><strong>Address:</strong> {selected.address || "—"}</p>
              <p><strong>Father:</strong> {selected.father_name}</p>
              <p><strong>Phone:</strong> {selected.father_phone}</p>
              <p><strong>CNIC:</strong> {selected.father_cnic || "—"}</p>
              <p><strong>Occupation:</strong> {selected.father_occupation || "—"}</p>
              <p><strong>Mother:</strong> {selected.mother_name || "—"}</p>
              <p><strong>Mother phone:</strong> {selected.mother_phone || "—"}</p>
              <p><strong>Email:</strong> {selected.email || "—"}</p>
              <p><strong>Emergency:</strong> {selected.emergency_phone || "—"}</p>
              <p style={{ gridColumn: "1 / -1" }}><strong>Notes:</strong> {selected.notes || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
