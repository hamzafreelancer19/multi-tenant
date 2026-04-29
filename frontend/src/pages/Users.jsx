import { useEffect, useState } from "react";
import { Search, User as UserIcon, X, Edit, Trash2, Loader2, Shield, UserCircle } from "lucide-react";
import { getPlatformUsers, updatePlatformUser, deletePlatformUser } from "../api/adminApi";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ role: "admin", is_active: true });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getPlatformUsers();
      setUsers(res.data || []);
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
      (u.school_name && u.school_name.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q);
  });

  const openEdit = (u) => {
    setFormData({
      role: u.role || "admin",
      is_active: u.is_active,
    });
    setEditingId(u.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePlatformUser(editingId, formData);
      closeModal();
      await fetchUsers();
    } catch (err) {
      alert("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
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
          <h1 className="page-title">Platform Users</h1>
          <p className="page-subtitle">Manage all accounts across the SaaS ecosystem</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by username, school or role..."
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
            <p style={{ marginTop: 12 }}>Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No users found matching your search.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>School</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="table-row">
                  <td>
                    <div className="table-name-cell">
                      <div className="table-avatar" style={{ background: u.role === 'superadmin' ? 'var(--purple-soft)' : 'var(--accent-soft)', color: u.role === 'superadmin' ? 'var(--purple)' : 'var(--accent)' }}>
                        {u.role === 'superadmin' ? <Shield size={16} /> : <UserIcon size={16} />}
                      </div>
                      <p className="table-name">{u.username}</p>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      textTransform: 'capitalize', 
                      padding: '4px 8px', 
                      borderRadius: 6, 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      background: u.role === 'superadmin' ? 'var(--purple-soft)' : 'var(--bg-hover)',
                      color: u.role === 'superadmin' ? 'var(--purple)' : 'var(--text-secondary)'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {u.school_name || <span style={{ italic: true, opacity: 0.5 }}>Platform Global</span>}
                  </td>
                  <td>
                    <span className={`badge-status ${u.is_active ? "badge-active" : "badge-inactive"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {new Date(u.date_joined).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="icon-btn-sm" onClick={() => openEdit(u)}><Edit size={15} /></button>
                      {u.role !== 'superadmin' && (
                        <button className="icon-btn-danger" onClick={() => handleDelete(u.id, u.username)}><Trash2 size={15} /></button>
                      )}
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
              <h2 className="modal-title">Edit Platform User</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="input-group">
                    <label className="input-label">Role</label>
                    <select
                      className="input-field"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="superadmin">Super Admin</option>
                      <option value="admin">School Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="accountant">Accountant</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Account Status</label>
                    <select
                      className="input-field"
                      value={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled / Blocked</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
