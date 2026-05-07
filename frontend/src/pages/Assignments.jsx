import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  Calendar,
  Clock,
  BookOpen,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter
} from 'lucide-react';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../api/assignmentsApi';
import { getTeachers } from '../api/teachersApi';

const CLASS_OPTIONS = [
  "Nursery", "Prep",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_name: "Grade 10",
    subject: "",
    teacher: "",
    due_date: new Date().toISOString().split('T')[0],
    max_marks: 100
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, tRes] = await Promise.all([getAssignments(), getTeachers()]);
      setAssignments(Array.isArray(aRes.data) ? aRes.data : []);
      setTeachers(Array.isArray(tRes.data) ? tRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateAssignment(editingId, formData);
      else await createAssignment(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Error saving assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await deleteAssignment(id);
      fetchData();
    } catch (err) {
      alert("Error deleting assignment");
    }
  };

  const openAdd = () => {
    setFormData({ ...formData, title: "", description: "", subject: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setFormData({
      title: item.title,
      description: item.description,
      class_name: item.class_name,
      subject: item.subject,
      teacher: item.teacher || "",
      due_date: item.due_date,
      max_marks: item.max_marks
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === "All" || a.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="page">
      <style>{`
        .assign-card { background: var(--bg-card); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border-radius: 24px; padding: 24px; border: 1px solid var(--border-glass); box-shadow: var(--shadow-premium); transition: var(--transition); position: relative; }
        .assign-card:hover { transform: translateY(-4px); border-color: var(--border-focus); box-shadow: var(--shadow); }
        .btn-premium { background: var(--gradient-primary) !important; color: white !important; font-weight: 800 !important; padding: 14px 28px !important; border-radius: 18px !important; border: none !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; transition: var(--transition); }
        .btn-premium:hover { opacity: 0.9; transform: scale(0.98); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ background: 'var(--accent)', padding: 6, borderRadius: 8, color: 'white' }}><FileText size={18} /></div>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>Learning Management</span>
           </div>
           <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)' }}>Homework & Assignments</h1>
           <p style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Create and track daily tasks for students.</p>
        </div>
        <button onClick={openAdd} className="btn-premium"><Plus size={22} /> Create Assignment</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
         <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {["All", ...CLASS_OPTIONS].slice(0, 8).map(c => (
              <button 
                key={c}
                onClick={() => setSelectedClass(c)}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: 14, 
                  border: 'none', 
                  background: selectedClass === c ? 'var(--accent)' : 'var(--bg-card)',
                  color: selectedClass === c ? 'white' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedClass === c ? '0 4px 14px var(--accent-soft)' : 'none',
                  border: '1px solid var(--border)'
                }}
              >
                {c}
              </button>
            ))}
         </div>
         <div style={{ position: 'relative', width: 300 }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
            <input 
              type="text" 
              placeholder="Search assignments..." 
              style={{ width: '100%', padding: '12px 12px 12px 48px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, fontWeight: 700, outline: 'none', color: 'var(--text-primary)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32 }}>
        {loading ? (
          Array(6).fill(0).map((_, i) => <div key={i} className="assign-card" style={{ height: 250, opacity: 0.5 }} />)
        ) : filtered.length > 0 ? (
          filtered.map(item => (
            <div key={item.id} className="assign-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ padding: '4px 12px', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 10, fontWeight: 900, borderRadius: 8, textTransform: 'uppercase' }}>
                   {item.class_name} • {item.subject}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(item)} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit size={18} /></button>
                  <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'none', color: 'var(--red, #ef4444)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.6, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: 'var(--bg-hover)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><Calendar size={18} /></div>
                    <div>
                       <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Date</div>
                       <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{item.due_date}</div>
                    </div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Marks</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>{item.max_marks} Pts</div>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full" style={{ textAlign: 'center', padding: '100px 40px', background: 'var(--bg-card)', borderRadius: 48, border: '2px dashed var(--border)', backdropFilter: 'var(--glass-blur)' }}>
             <ClipboardList size={64} style={{ marginBottom: 24, color: 'var(--text-muted)', opacity: 0.3 }} />
             <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>No Assignments</h2>
             <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Create your first assignment to engage with your students.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
           <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-glass)', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{editingId ? "Edit Assignment" : "New Assignment"}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>Set tasks and deadlines.</p>
                 </div>
                 <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                       <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Assignment Title</label>
                       <input required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Subject</label>
                       <input required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }} value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Class</label>
                       <select style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }} value={formData.class_name} onChange={(e) => setFormData({...formData, class_name: e.target.value})}>
                          {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                 </div>

                 <div>
                    <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Description</label>
                    <textarea required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, minHeight: 80, resize: 'none', fontSize: 14, color: 'var(--text-primary)' }} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                       <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Due Date</label>
                       <input type="date" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }} value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Max Marks</label>
                       <input type="number" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }} value={formData.max_marks} onChange={(e) => setFormData({...formData, max_marks: e.target.value})} />
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, borderRadius: 14, border: '1px solid var(--border)', fontWeight: 900, cursor: 'pointer', background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Cancel</button>
                    <button type="submit" disabled={saving} className="btn-premium" style={{ flex: 2, justifyContent: 'center', padding: 12, borderRadius: 14 }}>
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

export default Assignments;
