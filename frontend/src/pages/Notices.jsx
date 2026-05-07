import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle2,
  Bell,
  Sparkles
} from 'lucide-react';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../api/noticesApi';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ title: "", content: "", is_active: true });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await getNotices();
      setNotices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ title: "", content: "", is_active: true });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (notice) => {
    setFormData({ title: notice.title, content: notice.content, is_active: notice.is_active });
    setEditingId(notice.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateNotice(editingId, formData);
      else await createNotice(formData);
      setShowModal(false);
      fetchNotices();
    } catch (err) {
      alert("Error saving notice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteNotice(id);
      fetchNotices();
    } catch (err) {
      alert("Error deleting notice");
    }
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page" style={{ position: 'relative' }}>
      <style>{`
        .notice-card { background: var(--bg-card); backdrop-filter: var(--glass-blur); border-radius: 24px; padding: 24px; border: 1px solid var(--border-glass); box-shadow: var(--shadow-premium); transition: all 0.3s; position: relative; overflow: hidden; }
        .notice-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
        .btn-premium { background: var(--gradient-primary) !important; color: white !important; font-weight: 800 !important; padding: 14px 28px !important; border-radius: 18px !important; border: none !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-premium:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .status-badge { padding: 4px 12px; borderRadius: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ background: 'var(--accent)', padding: 6, borderRadius: 8, color: 'white' }}><Bell size={18} /></div>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>Communication Hub</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)' }}>Notice Board</h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Broadcast school-wide announcements and updates.</p>
        </div>
        <button onClick={openAdd} className="btn-premium"><Plus size={22} /> Post Announcement</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 32, position: 'relative', maxWidth: 400 }}>
        <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
        <input 
          type="text" 
          placeholder="Search notices..." 
          style={{ width: '100%', padding: '14px 14px 14px 48px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, fontWeight: 700, outline: 'none' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 32 }}>
        {loading ? (
          Array(6).fill(0).map((_, i) => <div key={i} className="notice-card" style={{ height: 200, opacity: 0.5 }} />)
        ) : filteredNotices.length > 0 ? (
          filteredNotices.map(notice => (
            <div key={notice.id} className="notice-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <span className="status-badge" style={{ background: notice.is_active ? '#ecfdf5' : '#fef2f2', color: notice.is_active ? '#10b981' : '#ef4444' }}>
                  {notice.is_active ? "Active" : "Archived"}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(notice)} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit size={18} /></button>
                  <button onClick={() => handleDelete(notice.id)} style={{ border: 'none', background: 'none', color: '#fee2e2', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>{notice.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.6, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {notice.content}
              </p>
              <div style={{ paddingTop: 20, borderTop: '1px solid var(--bg-hover)', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                <Clock size={14} />
                <span>Posted on {new Date(notice.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full" style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-card)', borderRadius: 48, border: '2px dashed var(--border)' }}>
             <Megaphone size={64} color="#e2e8f0" style={{ marginBottom: 24 }} />
             <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>No Announcements</h2>
             <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Keep your school informed by posting your first notice.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-glass)', width: '100%', maxWidth: 500, borderRadius: 40, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'var(--bg-surface)', padding: 32, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingId ? "Edit Announcement" : "Post Notice"}</h2>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Notice Title</label>
                <input required style={{ width: '100%', padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Announcement Content</label>
                <textarea required style={{ width: '100%', padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, minHeight: 150, resize: 'none' }} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
                <label htmlFor="is_active" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Active / Published</label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 14, borderRadius: 16, border: 'none', fontWeight: 900 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>
                  {saving ? "Saving..." : editingId ? "Update" : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
