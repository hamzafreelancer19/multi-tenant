import { useEffect, useState } from "react";
import { Search, Filter, X, Trash2, Loader2, CheckCircle, XCircle, Phone, User } from "lucide-react";
import { getEnrollments, acceptEnrollment, rejectEnrollment, deleteEnrollment } from "../api/enrollmentApi";

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

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
      (e.father_name && e.father_name.toLowerCase().includes(q));
    const matchStatus = filterStatus === "All" || e.status === filterStatus;
    return matchSearch && matchStatus;
  }) : [];

  const handleAccept = async (id, name) => {
    if (!window.confirm(`Accept enrollment for "${name}"?`)) return;
    try {
      await acceptEnrollment(id);
      await fetchEnrollments();
    } catch (err) {
      alert("Failed to accept enrollment");
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
            {loading ? "Loading..." : `${enrollments.filter(e => e.status === 'Pending').length} pending requests from landing page`}
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
          {["All", "Pending", "Accepted", "Rejected"].map((f) => (
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
                <th>Age</th>
                <th>Father Details</th>
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
                      <div className="table-avatar" style={{ background: e.status === 'Pending' ? '#f59e0b20' : '#8b5cf620', color: e.status === 'Pending' ? '#f59e0b' : '#8b5cf6' }}>
                        <User size={18} />
                      </div>
                      <div>
                        <p className="table-name">{e.student_name}</p>
                        <p className="table-email">Landing Page Applicant</p>
                      </div>
                    </div>
                  </td>
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
                    <span className={`badge-status badge-${e.status.toLowerCase()}`}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {e.status === 'Pending' && (
                        <>
                          <button
                            className="icon-btn-sm"
                            style={{ color: "#10B981" }}
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
    </div>
  );
}
