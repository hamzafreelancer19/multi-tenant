import { useEffect, useState } from "react";
import { Search, Plus, MoreVertical, BookOpen, Star, X, Trash2, Loader2, Mail } from "lucide-react";
import { getTeachers, createTeacher, deleteTeacher } from "../api/teachersApi";

const subjectColors = {
  Mathematics: "blue",
  "English Literature": "purple",
  Physics: "orange",
  Biology: "green",
  Chemistry: "pink",
  "Computer Science": "cyan",
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    subject: "Mathematics",
    email: "",
    experience: "1 yr",
  });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await getTeachers();
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Using fallback teacher data");
      setTeachers([
        { id: 1, name: "Mr. Ahmed Raza", subject: "Mathematics", email: "a.raza@school.edu", experience: "8 yrs", rating: 4.9, classes: ["10-A", "11-B"] },
        { id: 2, name: "Ms. Nadia Hussain", subject: "English Literature", email: "n.hussain@school.edu", experience: "5 yrs", rating: 4.7, classes: ["9-A"] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createTeacher(formData);
      setShowModal(false);
      setFormData({ name: "", subject: "Mathematics", email: "", experience: "1 yr" });
      fetchTeachers();
    } catch (err) {
      alert("Failed to add teacher");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteTeacher(id);
      fetchTeachers();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const filtered = Array.isArray(teachers) ? teachers.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">Manage faculty and subject assignments</p>
        </div>
        <button id="add-teacher-btn" className="primary-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Teacher
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            id="teacher-search"
            className="search-input"
            placeholder="Search by name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading && <Loader2 className="spin" size={18} />}
        {!loading && <p className="table-count" style={{ marginTop: 0 }}>{filtered.length} teachers found</p>}
      </div>

      {/* Teacher Cards Grid */}
      <div className="teachers-grid">
        {filtered.map((t) => (
          <div key={t.id} className="teacher-card">
            <div className="teacher-card-top">
              <div className="teacher-avatar">{t.name ? (t.name.split(" ")[1]?.[0] ?? t.name[0]) : "T"}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="icon-btn-sm"><MoreVertical size={16} /></button>
                <button className="icon-btn-danger" onClick={() => handleDelete(t.id)}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="teacher-info">
              <h3 className="teacher-name">{t.name}</h3>
              <span className={`subject-tag subject-${subjectColors[t.subject] ?? "blue"}`}>
                <BookOpen size={12} /> {t.subject}
              </span>
            </div>
            <div className="teacher-meta">
              <div className="meta-item">
                <span className="meta-label">Experience</span>
                <span className="meta-value">{t.experience || "N/A"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Rating</span>
                <span className="meta-value rating-val">
                  <Star size={13} fill="currentColor" /> {t.rating || "5.0"}
                </span>
              </div>
            </div>
            {t.classes && (
              <div className="teacher-classes">
                {t.classes.map((c) => (
                  <span key={c} className="class-chip">{c}</span>
                ))}
              </div>
            )}
            <div className="teacher-email"><Mail size={12} style={{ marginRight: 4 }} /> {t.email || "No email"}</div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="empty-state">No teachers match your search.</div>
      )}

      {/* ADD TEACHER MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add New Teacher</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input
                      required
                      className="input-field"
                      placeholder="e.g. Mr. Ahmed Raza"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Subject *</label>
                    <select
                      className="input-field"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      {Object.keys(subjectColors).map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="teacher@school.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Years of Experience</label>
                    <input
                      className="input-field"
                      placeholder="e.g. 5 yrs"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Hire Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
