import { useEffect, useState } from "react";
import { Search, Plus, X, Edit, Trash2, Loader2, School as SchoolIcon, Calendar, Hash } from "lucide-react";
import { getSchools, createSchool, updateSchool, deleteSchool, approveSchool, rejectSchool } from "../api/adminApi";

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: "", code: "", address: "TBD", contact_number: "TBD" };
  const [formData, setFormData] = useState(emptyForm);

  const fetchSchools = async (isFirst = false) => {
    if (isFirst) setLoading(true);
    try {
      const res = await getSchools();
      setSchools(res.data || []);
    } catch (err) {
      console.error("Failed to fetch schools:", err);
      setSchools([]);
    } finally {
      if (isFirst) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools(true);
    const interval = setInterval(() => fetchSchools(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = schools.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setFormData({
      name: s.name || "",
      code: s.code || "",
      address: s.address || "TBD",
      contact_number: s.contact_number || "TBD",
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Name is required");
    if (!formData.code.trim()) return alert("School Code is required");
    setSaving(true);
    try {
      if (editingId) {
        await updateSchool(editingId, formData);
      } else {
        await createSchool(formData);
      }
      closeModal();
      await fetchSchools();
    } catch (err) {
      alert("Failed to save school. Make sure the code is unique.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, action) => {
    try {
      if (action === "approve") await approveSchool(id);
      else await rejectSchool(id);
      await fetchSchools();
    } catch (err) {
      alert(`Failed to ${action} school.`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete school "${name}"? This will delete all associated data (students, teachers, etc).`)) return;
    try {
      await deleteSchool(id);
      await fetchSchools();
    } catch (err) {
      alert("Failed to delete school");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Schools</h1>
          <p className="page-subtitle">Platform-wide multi-tenant management</p>
        </div>
        <button className="primary-btn" onClick={openAdd}>
          <Plus size={18} /> Add New School
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search schools by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 className="spin" size={36} />
            <p style={{ marginTop: 12 }}>Loading schools...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No schools found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>School Name</th>
                <th>School Code</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="table-row">
                  <td>
                    <div className="table-name-cell">
                      <div className="table-avatar" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        <SchoolIcon size={16} />
                      </div>
                      <p className="table-name">{s.name}</p>
                    </div>
                  </td>
                  <td className="table-mono">{s.code}</td>
                  <td>
                    <span className={`badge-status ${
                      s.status === 'Approved' ? 'badge-active' : 
                      s.status === 'Pending' ? 'badge-warning' : 'badge-inactive'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <Calendar size={14} />
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {s.status === "Pending" && (
                        <>
                          <button 
                            className="icon-btn-sm" 
                            style={{ color: "var(--green)" }} 
                            title="Approve School"
                            onClick={() => handleStatusUpdate(s.id, "approve")}
                          >
                            <Plus size={15} />
                          </button>
                          <button 
                            className="icon-btn-sm" 
                            style={{ color: "var(--red)" }} 
                            title="Reject School"
                            onClick={() => handleStatusUpdate(s.id, "reject")}
                          >
                            <X size={15} />
                          </button>
                        </>
                      )}
                      <button className="icon-btn-sm" onClick={() => openEdit(s)}><Edit size={15} /></button>
                      <button className="icon-btn-danger" onClick={() => handleDelete(s.id, s.name)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Edit School" : "Register School"}</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="input-group">
                    <label className="input-label">School Name *</label>
                    <input
                      required
                      className="input-field"
                      placeholder="e.g. Greenway International"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">School Code (Unique) *</label>
                    <input
                      required
                      className="input-field"
                      placeholder="e.g. GREEN-01"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save Changes" : "Register School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
