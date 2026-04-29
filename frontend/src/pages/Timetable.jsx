import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  MoreVertical,
  ChevronRight,
  BookOpen,
  User as UserIcon,
  MapPin,
  Filter
} from 'lucide-react';
import { getTimetables, createTimetable, updateTimetable, deleteTimetable } from '../api/timetableApi';
import { getTeachers } from '../api/teachersApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CLASS_OPTIONS = [
  "Nursery", "Prep",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

const Timetable = () => {
  const [timetables, setTimetables] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("Grade 10");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    class_name: "Grade 10",
    subject: "",
    teacher: "",
    day: "Monday",
    start_time: "09:00",
    end_time: "10:00",
    room_no: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ttRes, tRes] = await Promise.all([getTimetables(), getTeachers()]);
      setTimetables(Array.isArray(ttRes.data) ? ttRes.data : []);
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
      if (editingId) await updateTimetable(editingId, formData);
      else await createTimetable(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Error saving schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this period?")) return;
    try {
      await deleteTimetable(id);
      fetchData();
    } catch (err) {
      alert("Error deleting period");
    }
  };

  const openAdd = () => {
    setFormData({ ...formData, class_name: selectedClass });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setFormData({
      class_name: item.class_name,
      subject: item.subject,
      teacher: item.teacher || "",
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time,
      room_no: item.room_no || ""
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  return (
    <div className="page" style={{ position: 'relative' }}>
      <style>{`
        .tt-day-col { background: white; border-radius: 24px; border: 1px solid rgba(0,0,0,0.02); min-height: 400px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.01); }
        .tt-slot { background: #f8fafc; border-radius: 16px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #4f46e5; transition: 0.3s; position: relative; }
        .tt-slot:hover { transform: scale(1.02); background: white; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .tt-btn { background: #4f46e5 !important; color: white !important; font-weight: 800 !important; padding: 12px 24px !important; border-radius: 16px !important; border: none !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ background: '#4f46e5', padding: 6, borderRadius: 8, color: 'white' }}><Clock size={18} /></div>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '2px' }}>Operational View</span>
           </div>
           <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>Class Timetable</h1>
           <p style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>Manage schedules and room assignments across all grades.</p>
        </div>
        <button onClick={openAdd} className="tt-btn"><Plus size={22} /> Add Period</button>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40, overflowX: 'auto', paddingBottom: 10 }}>
        {CLASS_OPTIONS.map(c => (
          <button 
            key={c}
            onClick={() => setSelectedClass(c)}
            style={{ 
              padding: '10px 20px', 
              borderRadius: 12, 
              border: 'none', 
              background: selectedClass === c ? '#4f46e5' : 'white',
              color: selectedClass === c ? 'white' : '#64748b',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: selectedClass === c ? '0 10px 20px rgba(79, 70, 229, 0.2)' : 'none'
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Timetable Grid (Day by Day) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {DAYS.map(day => (
          <div key={day} className="tt-day-col">
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              {day}
              <span style={{ fontSize: 10, background: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: 6 }}>
                {timetables.filter(t => t.day === day && t.class_name === selectedClass).length}
              </span>
            </h3>
            
            {timetables.filter(t => t.day === day && t.class_name === selectedClass).length > 0 ? (
              timetables
                .filter(t => t.day === day && t.class_name === selectedClass)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(item => (
                  <div key={item.id} className="tt-slot">
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#4f46e5' }}>{item.start_time.slice(0,5)} - {item.end_time.slice(0,5)}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(item)} style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Edit size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'none', color: '#fee2e2', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                     </div>
                     <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>{item.subject}</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11, fontWeight: 700 }}>
                        <UserIcon size={12} /> {item.teacher_name || "N/A"}
                     </div>
                     {item.room_no && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                          <MapPin size={12} /> Room: {item.room_no}
                       </div>
                     )}
                  </div>
                ))
            ) : (
              <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700, textAlign: 'center', py: 40 }}>No periods scheduled</div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
           <div style={{ background: 'white', width: '100%', maxWidth: 550, borderRadius: 40, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: 32, color: 'white' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingId ? "Edit Period" : "Schedule Period"}</h2>
                 <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Assign subject and teacher to a time slot.</p>
              </div>
              <form onSubmit={handleSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Subject</label>
                       <input required style={{ width: '100%', padding: 14, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Room No</label>
                       <input style={{ width: '100%', padding: 14, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={formData.room_no} onChange={(e) => setFormData({...formData, room_no: e.target.value})} />
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Teacher</label>
                       <select style={{ width: '100%', padding: 14, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={formData.teacher} onChange={(e) => setFormData({...formData, teacher: e.target.value})}>
                          <option value="">Select Teacher</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Day</label>
                       <select style={{ width: '100%', padding: 14, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})}>
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Start Time</label>
                       <input type="time" style={{ width: '100%', padding: 14, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>End Time</label>
                       <input type="time" style={{ width: '100%', padding: 14, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} />
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 14, borderRadius: 16, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" disabled={saving} className="tt-btn" style={{ flex: 1.5, justifyContent: 'center' }}>
                      {saving ? "Saving..." : editingId ? "Update" : "Save Period"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
