import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getTimetables, createTimetable, updateTimetable, deleteTimetable } from "../api/timetableApi";
import { getTeachers } from "../api/teachersApi";
import { getClasses } from "../api/classesApi";
import { getStudents } from "../api/studentsApi";
import { useTenant } from "../context/TenantContext";
import { getRole, getUser } from "../store/authStore";
import { isTeacherRole, mergeClassOptions } from "../utils/classOptions";
import { useLocation } from "react-router-dom";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Timetable.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIOD_TYPES = ["Lecture", "Lab", "Break", "Assembly", "Sports"];
const DEFAULT_SLOTS = ["08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "12:30", "13:15"];
const SUBJECTS = [
  "Mathematics", "English", "Urdu", "Physics", "Chemistry", "Biology",
  "Computer Science", "Islamiat", "Pakistan Studies", "Break", "Assembly", "Sports",
];

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function classLabel(c) {
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

function hhmm(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function addMinutes(time, mins) {
  const [h, m] = hhmm(time).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "08:45";
  const total = (((h * 60 + m + mins) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function apiError(err) {
  const data = err.response?.data;
  if (!data) return "Could not save period.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || "Could not save period.";
}

const EMPTY_FORM = {
  class_name: "",
  subject: "",
  teacher: "",
  day: "Monday",
  start_time: "08:00",
  end_time: "08:45",
  room_no: "",
  period_type: "Lecture",
  notes: "",
};

export default function Timetable() {
  const tenant = useTenant();
  const location = useLocation();
  const role = getRole();
  const user = getUser();
  const canManage = role === "admin" || role === "teacher";
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("class");
  const [selectedClass, setSelectedClass] = useState(location.state?.className || "");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const landingClasses = (tenant.landing?.classes || []).map((c) => c.label || c.name).filter(Boolean);

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map(classLabel);
    const fromStudents = students.map((s) => s.class_name);
    const fromTt = rows.map((r) => r.class_name);
    return mergeClassOptions([fromApi, isTeacherRole() ? [] : landingClasses, fromStudents, fromTt]);
  }, [schoolClasses, landingClasses, students, rows]);

  const rooms = useMemo(
    () => unique(schoolClasses.map((c) => c.room_no).concat(rows.map((r) => r.room_no))),
    [schoolClasses, rows]
  );

  const subjectOptions = useMemo(() => {
    return unique([...SUBJECTS, ...teachers.map((t) => t.subject), ...rows.map((r) => r.subject)]);
  }, [teachers, rows]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ttRes, tRes, cRes, sRes] = await Promise.all([
        getTimetables(),
        getTeachers().catch(() => ({ data: [] })),
        getClasses().catch(() => ({ data: [] })),
        getStudents().catch(() => ({ data: [] })),
      ]);
      const nextRows = Array.isArray(ttRes.data) ? ttRes.data : [];
      const nextTeachers = Array.isArray(tRes.data) ? tRes.data : [];
      const nextClasses = Array.isArray(cRes.data) ? cRes.data : [];
      const nextStudents = Array.isArray(sRes.data) ? sRes.data : [];
      setRows(nextRows);
      setTeachers(nextTeachers);
      setSchoolClasses(nextClasses);
      setStudents(nextStudents);

      const labels = unique([
        ...nextClasses.map(classLabel),
        ...(role === "teacher" ? [] : landingClasses),
        ...nextStudents.map((s) => s.class_name),
        ...nextRows.map((r) => r.class_name),
      ]);
      const mine = nextStudents.find((s) => {
        const email = (s.email || "").toLowerCase();
        return email && (email === (user?.email || "").toLowerCase() || email === (user?.username || "").toLowerCase());
      });

      setSelectedClass((prev) => {
        if (role === "student" && mine?.class_name) return mine.class_name;
        const fromPortal = location.state?.className;
        if (fromPortal && labels.includes(fromPortal)) return fromPortal;
        if (prev && labels.includes(prev)) return prev;
        return labels[0] || "";
      });
      setSelectedTeacher((prev) => prev || (nextTeachers[0] ? String(nextTeachers[0].id) : ""));
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "teacher") {
        const t = teachers.find((x) => String(x.id) === String(value));
        if (t?.subject && (!prev.subject || prev.subject === t.subject)) next.subject = t.subject;
      }
      if (key === "period_type" && ["Break", "Assembly", "Sports"].includes(value)) {
        if (!prev.subject || SUBJECTS.includes(prev.subject)) next.subject = value;
      }
      return next;
    });
  };

  const visible = rows.filter((r) => {
    if (viewMode === "teacher") return String(r.teacher || "") === String(selectedTeacher);
    return !selectedClass || r.class_name === selectedClass;
  }).filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [r.subject, r.teacher_name, r.room_no, r.class_name, r.period_type, r.notes].join(" ").toLowerCase().includes(q);
  });

  const timeRows = unique([...DEFAULT_SLOTS, ...visible.map((r) => hhmm(r.start_time))]).sort();

  const cell = (day, start) =>
    visible.find((r) => r.day === day && hhmm(r.start_time) === start);

  const stats = {
    periods: visible.length,
    teachers: unique(visible.map((r) => r.teacher_name)).length,
    rooms: unique(visible.map((r) => r.room_no)).length,
    days: unique(visible.map((r) => r.day)).length,
  };

  const openAdd = (day = "Monday", start = "08:00") => {
    setFormData({
      ...EMPTY_FORM,
      class_name: selectedClass || classOptions[0] || "",
      teacher: viewMode === "teacher" ? selectedTeacher : "",
      day,
      start_time: start,
      end_time: addMinutes(start, 45),
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setFormData({
      class_name: item.class_name || "",
      subject: item.subject || "",
      teacher: item.teacher ? String(item.teacher) : "",
      day: item.day || "Monday",
      start_time: hhmm(item.start_time) || "08:00",
      end_time: hhmm(item.end_time) || "08:45",
      room_no: item.room_no || "",
      period_type: item.period_type || "Lecture",
      notes: item.notes || "",
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.class_name) return alert("Class is required");
    if (!formData.subject.trim()) return alert("Subject is required");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        teacher: formData.teacher ? Number(formData.teacher) : null,
      };
      if (editingId) await updateTimetable(editingId, payload);
      else await createTimetable(payload);
      closeModal();
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this period?")) return;
    try {
      await deleteTimetable(id);
      closeModal();
      await fetchAll();
    } catch {
      alert("Could not delete period.");
    }
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Weekly schedule</p>
          <h1>Timetable</h1>
          <p>Periods, rooms, and teachers for {tenant.schoolName || "your school"}.</p>
        </div>
        {canManage && (
          <div className="dash-hero-meta">
            <button type="button" className="st-add-btn" onClick={() => openAdd()}>
              <Plus size={16} /> Add period
            </button>
          </div>
        )}
      </header>

      <div className="dash-stats">
        <div className="dash-stat dash-stat-orange">
          <span>Periods</span>
          <strong>{loading ? "—" : stats.periods}</strong>
          <small>this view</small>
        </div>
        <div className="dash-stat dash-stat-green">
          <span>Teachers</span>
          <strong>{loading ? "—" : stats.teachers}</strong>
          <small>assigned</small>
        </div>
        <div className="dash-stat dash-stat-navy">
          <span>Rooms</span>
          <strong>{loading ? "—" : stats.rooms}</strong>
          <small>in use</small>
        </div>
        <div className="dash-stat dash-stat-gold">
          <span>Days</span>
          <strong>{loading ? "—" : stats.days}</strong>
          <small>this week</small>
        </div>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search subject, teacher, room…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        {canManage && (
          <div className="st-filters">
            <button type="button" className={viewMode === "class" ? "is-on" : ""} onClick={() => setViewMode("class")}>
              By class
            </button>
            <button type="button" className={viewMode === "teacher" ? "is-on" : ""} onClick={() => setViewMode("teacher")}>
              By teacher
            </button>
          </div>
        )}
        {viewMode === "teacher" && (
          <select className="tt-select" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
            {teachers.length === 0 && <option value="">No teachers</option>}
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.subject ? ` · ${t.subject}` : ""}</option>
            ))}
          </select>
        )}
      </div>

      {viewMode === "class" && (
        <div className="st-classes">
          {classOptions.map((c) => (
            <button key={c} type="button" className={selectedClass === c ? "is-on" : ""} onClick={() => setSelectedClass(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading timetable…</p>
          </div>
        ) : !classOptions.length && viewMode === "class" ? (
          <div className="st-empty">
            <Clock size={36} />
            <p>Add a class first, then build its weekly timetable.</p>
          </div>
        ) : viewMode === "teacher" && !teachers.length ? (
          <div className="st-empty">
            <Clock size={36} />
            <p>Add teachers first to view their schedules.</p>
          </div>
        ) : (
          <div className="tt-grid-wrap">
            <table className="tt-grid">
              <thead>
                <tr>
                  <th>Time</th>
                  {DAYS.map((d) => <th key={d}>{d.slice(0, 3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {timeRows.map((start) => (
                  <tr key={start}>
                    <td className="tt-time">{start}</td>
                    {DAYS.map((day) => {
                      const item = cell(day, start);
                      return (
                        <td key={day}>
                          {item ? (
                            <button
                              type="button"
                              className={`tt-cell is-${(item.period_type || "Lecture").toLowerCase()}`}
                              onClick={() => canManage && openEdit(item)}
                            >
                              <b>{item.subject}</b>
                              <small>{item.teacher_name || item.period_type}</small>
                              {item.room_no ? <small>Room {item.room_no}</small> : null}
                              {viewMode === "teacher" ? <small>{item.class_name}</small> : null}
                              {canManage && (
                                <span className="tt-cell-del" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                                  <Trash2 size={12} />
                                </span>
                              )}
                            </button>
                          ) : canManage ? (
                            <button type="button" className="tt-empty" onClick={() => openAdd(day, start)}>+</button>
                          ) : (
                            <div className="tt-empty is-static" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
              <div>
                <p>Schedule</p>
                <h2>{editingId ? "Edit period" : "Add period"}</h2>
              </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Period</p>
              <div className="st-grid">
                <label>
                  Class *
                  <input list="tt-classes" required value={formData.class_name} onChange={setField("class_name")} placeholder="Select class" />
                  <datalist id="tt-classes">
                    {classOptions.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </label>
                <label>
                  Day
                  <select value={formData.day} onChange={setField("day")}>
                    {DAYS.concat("Sunday").map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
                <label>
                  Type
                  <select value={formData.period_type} onChange={setField("period_type")}>
                    {PERIOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Subject *
                  <input list="tt-subjects" required value={formData.subject} onChange={setField("subject")} placeholder="e.g. Mathematics" />
                  <datalist id="tt-subjects">
                    {subjectOptions.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </label>
                <label>
                  Start
                  <input type="time" required value={formData.start_time} onChange={setField("start_time")} />
                </label>
                <label>
                  End
                  <input type="time" required value={formData.end_time} onChange={setField("end_time")} />
                </label>
                <label>
                  Teacher
                  <select value={formData.teacher} onChange={setField("teacher")}>
                    <option value="">Unassigned</option>
                    {teachers.filter((t) => (t.status || "Active") === "Active").map((t) => (
                      <option key={t.id} value={t.id}>{t.name}{t.subject ? ` · ${t.subject}` : ""}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Room
                  <input list="tt-rooms" value={formData.room_no} onChange={setField("room_no")} placeholder="e.g. 12" />
                  <datalist id="tt-rooms">
                    {rooms.map((r) => <option key={r} value={r} />)}
                  </datalist>
                </label>
                <label className="st-span-2">
                  Notes
                  <input value={formData.notes} onChange={setField("notes")} placeholder="Optional" />
                </label>
              </div>
            </div>
            <footer>
              {editingId && (
                <button type="button" className="st-ghost is-danger" onClick={() => handleDelete(editingId)}>Delete</button>
              )}
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Save period"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}
    </div>
  );
}
