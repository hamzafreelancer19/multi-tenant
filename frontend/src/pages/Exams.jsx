import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  BookOpen, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  X,
  Loader2,
  Trash2,
  Edit,
  Sparkles,
  ArrowUpRight,
  Send,
  MessageCircle,
  Zap,
  Play
} from 'lucide-react';
import { getExams, createExam, updateExam, deleteExam } from '../api/examsApi';
import { getStudents } from '../api/studentsApi';

const EXAM_TYPES = ['Midterm', 'Final', 'Monthly', 'Other'];
const CLASS_OPTIONS = [
  "Nursery", "Prep",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [search, setSearch] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [showDistModal, setShowDistModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [distStudents, setDistStudents] = useState([]);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  const emptyForm = {
    title: "",
    class_name: "Grade 10",
    exam_type: "Midterm",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    description: ""
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchExams();
    fetchStudents();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await getExams();
      setExams(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await getStudents();
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (exam) => {
    setFormData({
      title: exam.title,
      class_name: exam.class_name || "Grade 10",
      exam_type: exam.exam_type,
      start_date: exam.start_date,
      end_date: exam.end_date,
      description: exam.description || ""
    });
    setEditingId(exam.id);
    setShowModal(true);
  };

  const openDist = (exam) => {
    setSelectedExam(exam);
    const relevantStudents = students.filter(s => s.class_name === exam.class_name);
    setDistStudents(relevantStudents);
    setShowDistModal(true);
    setSendProgress(0);
    setIsSendingAll(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Title is required");
    setSaving(true);
    try {
      if (editingId) await updateExam(editingId, formData);
      else await createExam(formData);
      closeModal();
      await fetchExams();
    } catch (error) {
      alert("Failed to save exam.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteExam(id);
      await fetchExams();
    } catch (error) {
      alert("Failed to delete exam.");
    }
  };

  const getWAMessage = (student, exam) => {
    return encodeURIComponent(
      `📚 *NEW EXAM ANNOUNCEMENT*\n\n` +
      `The *${exam.title}* is scheduled for *${exam.class_name}*.\n\n` +
      `📅 Dates: ${exam.start_date} to ${exam.end_date}\n\n` +
      `Management`
    );
  };

  const sendAllAutomatically = async () => {
    if (!window.confirm(`Start sequence for ${distStudents.filter(s => s.phone).length} students?`)) return;
    
    setIsSendingAll(true);
    const hasPhones = distStudents.filter(s => s.phone);
    
    for (let i = 0; i < hasPhones.length; i++) {
      const s = hasPhones[i];
      setSendProgress(((i + 1) / hasPhones.length) * 100);
      window.open(`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}?text=${getWAMessage(s, selectedExam)}`, '_blank');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsSendingAll(false);
    alert("Broadcast completed.");
  };

  const filteredExams = exams.filter(exam => {
    const q = search.toLowerCase();
    const matchesSearch = exam.title.toLowerCase().includes(q) || (exam.class_name && exam.class_name.toLowerCase().includes(q));
    const today = new Date().toISOString().split('T')[0];
    if (activeTab === 'upcoming') return matchesSearch && exam.start_date >= today;
    if (activeTab === 'completed') return matchesSearch && exam.end_date < today;
    return matchesSearch;
  });

  return (
    <div className="page" style={{ position: 'relative', minHeight: '100%', background: 'transparent' }}>
      <style>{`
        .p-card { background: var(--bg-card); backdrop-filter: var(--glass-blur); border-radius: 24px; padding: 24px; border: 1px solid var(--border-glass); box-shadow: 0 10px 30px rgba(0,0,0,0.03); transition: all 0.3s; position: relative; }
        .p-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .p-btn-indigo { background: var(--gradient-primary) !important; color: white !important; font-weight: 800 !important; padding: 12px 24px !important; border-radius: 16px !important; border: none !important; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2) !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .p-btn-indigo:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .p-btn-wa-auto { background: #25D366 !important; color: white !important; font-weight: 800 !important; padding: 14px 28px !important; border-radius: 20px !important; border: none !important; box-shadow: 0 10px 20px rgba(37, 211, 102, 0.2) !important; cursor: pointer !important; transition: all 0.2s !important; display: flex; align-items: center; gap: 8px; font-size: 14px; margin: 0 auto; }
        .p-btn-wa-auto:hover { transform: scale(1.02); }
        .p-progress-bar { height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden; margin-top: 10px; width: 100%; }
        .p-progress-fill { height: 100%; background: #25D366; transition: width 0.3s; }
      `}</style>

      {/* Decorative Blur */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'rgba(79, 70, 229, 0.05)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: -1 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ background: 'var(--accent)', padding: 4, borderRadius: 6, color: 'white' }}><GraduationCap size={14} /></div>
              <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Portal</span>
           </div>
           <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>Exam Management</h1>
           <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600 }}>Schedule and distribute assessments instantly.</p>
        </div>
        <button onClick={openAdd} className="p-btn-indigo"><Plus size={20} /> Schedule Exam</button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {exams.length > 0 ? filteredExams.map(exam => (
          <div key={exam.id} className="p-card">
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent)', color: 'white', fontSize: 9, fontWeight: 900, padding: '4px 12px', borderRadius: '0 0 0 16px' }}>{exam.class_name}</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
               <span style={{ padding: '4px 10px', background: 'var(--bg-base)', borderRadius: 8, fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{exam.exam_type}</span>
               <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(exam)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Edit size={16} /></button>
                  <button onClick={() => handleDelete(exam.id, exam.title)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#fee2e2' }}><Trash2 size={16} /></button>
               </div>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>{exam.title}</h3>

            <div style={{ background: 'var(--bg-base)', padding: 14, borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
               <Calendar size={16} color="var(--accent)" />
               <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)' }}>{exam.start_date} - {exam.end_date}</span>
            </div>

            <button 
              onClick={() => openDist(exam)}
              style={{ width: '100%', padding: 14, background: '#25D366', color: 'white', border: 'none', borderRadius: 16, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
            >
              <MessageCircle size={18} />
              Auto Broadcast to {exam.class_name}
            </button>
          </div>
        )) : (
          <div className="col-span-full" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 32, border: '2px dashed var(--border)' }}>
            <BarChart3 size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>No Assessments</h2>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 24, fontSize: 14 }}>Schedule your first exam to get started.</p>
            <button onClick={openAdd} className="p-btn-indigo" style={{ margin: '0 auto' }}>Create Exam <Plus size={20} /></button>
          </div>
        )}
      </div>

      {/* COMPACT AUTO BROADCAST MODAL */}
      {showDistModal && selectedExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && !isSendingAll && setShowDistModal(false)}>
           <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-glass)', width: '100%', maxWidth: 480, borderRadius: 40, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', position: 'relative' }}>
              <div style={{ background: '#25D366', padding: 32, color: 'white', textAlign: 'center' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Zap size={28} className={isSendingAll ? 'animate-pulse' : ''} /> Auto-Broadcast
                 </h2>
                 <p style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, marginTop: 8 }}>Sending to {distStudents.length} students ({selectedExam.class_name})</p>
                 {!isSendingAll && <button onClick={() => setShowDistModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(0,0,0,0.08)', border: 'none', padding: 8, borderRadius: '50%', color: 'white', cursor: 'pointer' }}><X size={18} /></button>}
              </div>

              <div style={{ padding: 32 }}>
                 {isSendingAll ? (
                   <div style={{ textAlign: 'center' }}>
                      <Loader2 size={40} className="animate-spin" style={{ color: '#25D366', margin: '0 auto 16px' }} />
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>Broadcasting...</h3>
                      <div className="p-progress-bar">
                         <div className="p-progress-fill" style={{ width: `${sendProgress}%` }} />
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 900, color: '#25D366', marginTop: 10 }}>{Math.round(sendProgress)}% COMPLETED</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ background: 'var(--bg-base)', padding: 24, borderRadius: 24, border: '1px solid var(--border)', textAlign: 'center' }}>
                         <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>Clicking below will start the automatic sequence.</p>
                         <button onClick={sendAllAutomatically} className="p-btn-wa-auto">
                            <Play size={18} /> START BROADCAST
                         </button>
                      </div>

                      <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 16, padding: 10 }}>
                         <h4 style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Queue:</h4>
                         {distStudents.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid var(--bg-base)' }}>
                               <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{s.name}</span>
                               <span style={{ fontSize: 10, fontWeight: 700, color: s.phone ? '#25D366' : '#ef4444' }}>{s.phone ? s.phone : 'No Phone'}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>

              <div style={{ background: 'var(--bg-base)', padding: 16, textAlign: 'center' }}>
                 <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>TIP: PLEASE ALLOW POPUPS IN BROWSER SETTINGS.</p>
              </div>
           </div>
        </div>
      )}

      {/* Standard Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-glass)', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
             <div style={{ background: 'var(--bg-surface)', padding: 32, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingId ? "Edit Exam" : "New Exam"}</h2>
                <button onClick={closeModal} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
             </div>
             <form onSubmit={handleSave} style={{ padding: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <input required style={{ width: '100%', padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, color: 'var(--text-primary)' }} placeholder="Exam Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <select style={{ width: '100%', padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, color: 'var(--text-primary)' }} value={formData.class_name} onChange={(e) => setFormData({...formData, class_name: e.target.value})}>
                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select style={{ width: '100%', padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, color: 'var(--text-primary)' }} value={formData.exam_type} onChange={(e) => setFormData({...formData, exam_type: e.target.value})}>
                        {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <input type="date" style={{ width: '100%', padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, color: 'var(--text-primary)' }} value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                      <input type="date" style={{ width: '100%', padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, color: 'var(--text-primary)' }} value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                   <button type="button" onClick={closeModal} style={{ flex: 1, padding: 14, borderRadius: 16, border: 'none', fontWeight: 800, color: 'var(--text-primary)' }}>Cancel</button>
                   <button type="submit" className="p-btn-indigo" style={{ flex: 1.5, justifyContent: 'center' }}>Save</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
