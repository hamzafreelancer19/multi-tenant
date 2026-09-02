import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Eye,
  Filter,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getClasses, createClass, updateClass, deleteClass } from "../api/classesApi";
import { getTeachers } from "../api/teachersApi";
import { getStudents } from "../api/studentsApi";
import { useTenant } from "../context/TenantContext";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Classes.css";

const GRADE_OPTIONS = [
  "Nursery", "KG-I", "KG-II",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "First Year", "Second Year",
];

const SHIFTS = ["Morning", "Afternoon", "Evening"];

function academicYear() {
  const now = new Date();
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

const EMPTY_FORM = {
  name: "Class 1",
  custom_name: "",
  section: "",
  room_no: "",
  class_teacher: "",
  capacity: "40",
  shift: "Morning",
  academic_year: academicYear(),
  status: "Active",
  notes: "",
};

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function classLabel(c) {
  if (!c) return "";
  if (c.label) return c.label;
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

function formFromClass(c) {
  const known = GRADE_OPTIONS.includes(c.name) ? c.name : c.name ? "Custom" : "Class 1";
  return {
    name: known,
    custom_name: known === "Custom" ? (c.name || "") : "",
    section: c.section || "",
    room_no: c.room_no || "",
    class_teacher: c.class_teacher ? String(c.class_teacher) : "",
    capacity: String(c.capacity || 40),
    shift: c.shift || "Morning",
    academic_year: c.academic_year || academicYear(),
    status: c.status || "Active",
    notes: c.notes || "",
  };
}

function payloadFromForm(form) {
  const name = form.name === "Custom" ? form.custom_name.trim() : form.name;
  return {
    name,
    section: (form.section || "").trim(),
    room_no: (form.room_no || "").trim(),
    class_teacher: form.class_teacher ? Number(form.class_teacher) : null,
    capacity: Number(form.capacity) || 40,
    shift: form.shift,
    academic_year: form.academic_year,
    status: form.status,
    notes: form.notes,
  };
}

export default function Classes() {
  const tenant = useTenant();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedShift, setSelectedShift] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const gradeOptions = useMemo(() => {
    const extra = unique(classes.map((c) => c.name).filter((n) => !GRADE_OPTIONS.includes(n)));
    return [...GRADE_OPTIONS, ...extra, "Custom"];
  }, [classes]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes, studentRes] = await Promise.all([
        getClasses(),
        getTeachers().catch(() => ({ data: [] })),
        getStudents().catch(() => ({ data: [] })),
      ]);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setTeachers(Array.isArray(teacherRes.data) ? teacherRes.data : []);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = classes.filter((c) => {
    const q = search.toLowerCase().trim();
    const blob = [c.name, c.section, c.room_no, c.teacher_name, c.shift, c.academic_year].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchStatus = filterStatus === "All" || (c.status || "Active") === filterStatus;
    const matchShift = selectedShift === "All" || (c.shift || "Morning") === selectedShift;
    return matchSearch && matchStatus && matchShift;
  });

  const stats = {
    total: classes.length,
    active: classes.filter((c) => (c.status || "Active") === "Active").length,
    rooms: classes.filter((c) => c.room_no).length,
    students: students.length,
  };

  const setField = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const studentsIn = (c) => {
    const label = classLabel(c);
    return students.filter((s) => s.class_name === label || (!c.section && s.class_name === c.name));
  };

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, academic_year: academicYear() });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setFormData(formFromClass(c));
    setEditingId(c.id);
    setViewing(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = payloadFromForm(formData);
    if (!payload.name) return alert("Class name is required");
    setSaving(true);
    try {
      if (editingId) await updateClass(editingId, payload);
      else await createClass(payload);
      closeModal();
      await fetchAll();
    } catch (err) {
      const data = err.response?.data;
      const detail =
        data?.detail ||
        data?.non_field_errors?.[0] ||
        (typeof data === "object" ? Object.values(data).flat()?.[0] : null);
      alert(detail || "Failed to save class.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"? Students stay in the directory.`)) return;
    try {
      await deleteClass(id);
      setViewing(null);
      await fetchAll();
    } catch {
      alert("Failed to delete class");
    }
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Academic structure</p>
          <h1>Classes</h1>
          <p>Grades, sections, rooms, and class teachers for {tenant.schoolName || "your school"}.</p>
        </div>
        <div className="dash-hero-meta">
          <button type="button" className="st-add-btn" onClick={openAdd}>
            <Plus size={16} /> Add class
          </button>
        </div>
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => { setFilterStatus("All"); setSelectedShift("All"); }}>
          <span>Total</span>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>classes</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setFilterStatus("Active")}>
          <span>Active</span>
          <strong>{loading ? "—" : stats.active}</strong>
          <small>this year</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy">
          <span>Rooms</span>
          <strong>{loading ? "—" : stats.rooms}</strong>
          <small>assigned</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold">
          <span>Students</span>
          <strong>{loading ? "—" : stats.students}</strong>
          <small>in directory</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search class, section, room, teacher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="st-filters">
          <Filter size={15} />
          {["All", "Active", "Inactive"].map((f) => (
            <button key={f} type="button" className={filterStatus === f ? "is-on" : ""} onClick={() => setFilterStatus(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="st-classes">
        <button type="button" className={selectedShift === "All" ? "is-on" : ""} onClick={() => setSelectedShift("All")}>
          All shifts
        </button>
        {SHIFTS.map((s) => (
          <button key={s} type="button" className={selectedShift === s ? "is-on" : ""} onClick={() => setSelectedShift(s)}>
            {s}
          </button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading classes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <Layers size={36} />
            <p>
              {search || filterStatus !== "All" || selectedShift !== "All"
                ? "No classes match these filters."
                : "No classes yet. Add the first grade or section."}
            </p>
            {!search && filterStatus === "All" && selectedShift === "All" && (
              <button type="button" onClick={openAdd}>Add class</button>
            )}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Room</th>
                  <th>Class teacher</th>
                  <th>Students</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const count = c.student_count ?? studentsIn(c).length;
                  const cap = c.capacity || 40;
                  const over = count > cap;
                  return (
                    <tr key={c.id}>
                      <td>
                        <button type="button" className="st-person" onClick={() => setViewing(c)}>
                          <span>{(c.name || "C")[0]}</span>
                          <div>
                            <b>{c.name}</b>
                            <small>{c.academic_year || "Current year"}</small>
                          </div>
                        </button>
                      </td>
                      <td>{c.section || "—"}</td>
                      <td className="st-mono">{c.room_no || "—"}</td>
                      <td>{c.teacher_name || "Unassigned"}</td>
                      <td>
                        <span className={`st-badge ${over ? "is-warn" : "is-on"}`}>{count}/{cap}</span>
                      </td>
                      <td>{c.shift || "Morning"}</td>
                      <td>
                        <span className={`st-badge ${c.status === "Inactive" ? "is-off" : "is-on"}`}>
                          {c.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="st-actions">
                          <button type="button" title="View" onClick={() => setViewing(c)}><Eye size={15} /></button>
                          <button type="button" title="Edit" onClick={() => openEdit(c)}><Edit size={15} /></button>
                          <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(c.id, classLabel(c))}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="st-count">Showing {filtered.length} of {classes.length} classes</p>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
              <div>
                <p>Class record</p>
                <h2>{editingId ? "Edit class" : "Add class"}</h2>
              </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>

            <div className="st-modal-body">
              <p className="st-section">Class details</p>
              <div className="st-grid">
                <label>
                  Grade / class *
                  <select required value={formData.name} onChange={setField("name")}>
                    {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                {formData.name === "Custom" && (
                  <label>
                    Custom name
                    <input required value={formData.custom_name} onChange={setField("custom_name")} placeholder="e.g. O-Level 1" />
                  </label>
                )}
                <label>
                  Section
                  <input value={formData.section} onChange={setField("section")} placeholder="A, B, Alpha…" />
                </label>
                <label>
                  Room no
                  <input value={formData.room_no} onChange={setField("room_no")} placeholder="e.g. 12" />
                </label>
                <label>
                  Shift
                  <select value={formData.shift} onChange={setField("shift")}>
                    {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Academic year
                  <input value={formData.academic_year} onChange={setField("academic_year")} placeholder="2026-2027" />
                </label>
                <label>
                  Capacity
                  <input type="number" min="1" max="200" value={formData.capacity} onChange={setField("capacity")} />
                </label>
                <label>
                  Status
                  <select value={formData.status} onChange={setField("status")}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <p className="st-section">Class teacher</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Homeroom teacher
                  <select value={formData.class_teacher} onChange={setField("class_teacher")}>
                    <option value="">Unassigned</option>
                    {teachers.filter((t) => (t.status || "Active") === "Active").map((t) => (
                      <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>
                    ))}
                  </select>
                </label>
                <label className="st-span-2">
                  Notes
                  <textarea rows={2} value={formData.notes} onChange={setField("notes")} placeholder="Timetable notes, lab days…" />
                </label>
              </div>
            </div>

            <footer>
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Create class"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {viewing && (
        <AppModal onClose={() => setViewing(null)}>
          <div className="st-modal st-view">
            <header>
              <div>
                <p>{viewing.section ? `Section ${viewing.section}` : "Class"}</p>
                <h2>{classLabel(viewing)}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="st-view-grid">
                <ViewRow label="Room" value={viewing.room_no} />
                <ViewRow label="Shift" value={viewing.shift} />
                <ViewRow label="Academic year" value={viewing.academic_year} />
                <ViewRow label="Capacity" value={viewing.capacity} />
                <ViewRow label="Class teacher" value={viewing.teacher_name} />
                <ViewRow label="Status" value={viewing.status} />
                <ViewRow label="Notes" value={viewing.notes} wide />
              </div>
              <p className="st-section">Students in this class</p>
              {studentsIn(viewing).length === 0 ? (
                <p className="st-hint">No students assigned to this class yet.</p>
              ) : (
                <ul className="cl-students">
                  {studentsIn(viewing).map((s) => (
                    <li key={s.id}>
                      <span>{s.name?.[0]?.toUpperCase() || "S"}</span>
                      <div>
                        <b>{s.name}</b>
                        <small>{s.roll_no || "No roll"} · {s.status || "Active"}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <footer>
              <button type="button" className="st-ghost is-danger" onClick={() => handleDelete(viewing.id, classLabel(viewing))}>Delete</button>
              <button type="button" className="st-add-btn" onClick={() => openEdit(viewing)}>Edit class</button>
            </footer>
          </div>
        </AppModal>
      )}
    </div>
  );
}

function ViewRow({ label, value, wide }) {
  return (
    <div className={wide ? "st-span-2" : ""}>
      <small>{label}</small>
      <b>{value || "—"}</b>
    </div>
  );
}
