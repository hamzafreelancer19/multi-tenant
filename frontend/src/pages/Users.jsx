import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, User as UserIcon, X, Edit, Trash2, Loader2, Plus, School } from "lucide-react";
import { getPlatformUsers, createPlatformUser, updatePlatformUser, deletePlatformUser, getSchools } from "../api/adminApi";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  role: "admin",
  school: "",
  is_active: true,
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersRes, schoolsRes] = await Promise.all([getPlatformUsers(), getSchools()]);
      const rows = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsers(rows.filter((u) => u.role === "admin" && u.school));
      setSchools(Array.isArray(schoolsRes.data) ? schoolsRes.data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.school_name && u.school_name.toLowerCase().includes(q));
  });

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setFormData({
      username: u.username || "",
      email: u.email || "",
      password: "",
      role: "admin",
      school: u.school || "",
      is_active: u.is_active,
    });
    setEditingId(u.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.school) {
      alert("Select the school this admin belongs to.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        role: "admin",
        is_active: formData.is_active,
        email: formData.email,
        school: formData.school,
      };
      if (!editingId) {
        payload.username = formData.username;
        payload.password = formData.password;
        await createPlatformUser(payload);
      } else {
        if (formData.password) payload.password = formData.password;
        if (formData.username) payload.username = formData.username;
        await updatePlatformUser(editingId, payload);
      }
      closeModal();
      await fetchUsers();
    } catch (err) {
      const detail = err.response?.data?.username || err.response?.data?.detail || err.response?.data?.error;
      alert(Array.isArray(detail) ? detail.join(" ") : (detail || "Failed to save user."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete school admin "${name}"?`)) return;
    try {
      await deletePlatformUser(id);
      await fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">School Admins</h1>
          <p className="page-subtitle">Only accounts that registered a school. Teachers, parents, and students are on each school’s profile.</p>
        </div>
        <button className="primary-btn" onClick={openAdd}>
          <Plus size={18} /> Add school admin
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search admin or school..."
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
            <p style={{ marginTop: 12 }}>Loading school admins…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No school admins found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>School</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="table-row">
                  <td>
                    <div className="table-name-cell">
                      <div className="table-avatar" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        <UserIcon size={16} />
                      </div>
                      <div>
                        <p className="table-name">{u.username}</p>
                        {u.email && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{u.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link to={`/schools/${u.school}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
                      <School size={14} />
                      {u.school_name || "Open school"}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge-status ${u.is_active ? "badge-active" : "badge-inactive"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="icon-btn-sm" onClick={() => openEdit(u)}><Edit size={15} /></button>
                      <button className="icon-btn-danger" onClick={() => handleDelete(u.id, u.username)}><Trash2 size={15} /></button>
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
              <h2 className="modal-title">{editingId ? "Edit school admin" : "Add school admin"}</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="input-group">
                    <label className="input-label">Username *</label>
                    <input
                      required={!editingId}
                      className="input-field"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{editingId ? "New password (optional)" : "Password *"}</label>
                    <input
                      type="password"
                      required={!editingId}
                      className="input-field"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">School *</label>
                    <select
                      required
                      className="input-field"
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    >
                      <option value="">Select school</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Account status</label>
                    <select
                      className="input-field"
                      value={String(formData.is_active)}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Add admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
