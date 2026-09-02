import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ClipboardList,
  Edit,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getExams, createExam, updateExam, deleteExam, getExamResults, saveExamResults } from "../api/examsApi";
import { getStudents } from "../api/studentsApi";
import { getClasses } from "../api/classesApi";
import { useTenant } from "../context/TenantContext";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Exams.css";

const EXAM_TYPES = ["Midterm", "Final", "Monthly", "Quiz", "Other"];
const SUBJECTS = [
  "Mathematics", "English", "Urdu", "Physics", "Chemistry", "Biology",
  "Computer Science", "Islamiat", "Pakistan Studies", "General",
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function classLabel(c) {
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

function contactPhone(s) {
  return s?.father_phone || s?.phone || s?.mother_phone || "";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function examStatus(exam) {
  if (exam.status) return exam.status;
  const today = todayISO();
  if (exam.start_date > today) return "Upcoming";
  if (exam.end_date < today) return "Completed";
  return "Ongoing";
}

const EMPTY_FORM = {
  title: "",
  class_name: "",
  exam_type: "Monthly",
  subject: "Mathematics",
  start_date: todayISO(),
  end_date: todayISO(),
  total_marks: "100",
  venue: "",
  description: "",
};

export default function Exams() {
  const tenant = useTenant();
  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [selectedClass, setSelectedClass] = useState(location.state?.className || "All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [resultsExam, setResultsExam] = useState(null);
  const [resultMarks, setResultMarks] = useState({});
  const [notifyExam, setNotifyExam] = useState(null);

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map(classLabel);
    const fromStudents = students.map((s) => s.class_name);
    const fromExams = exams.map((e) => e.class_name);
    return unique([...fromApi, ...fromStudents, ...fromExams]);
  }, [schoolClasses, students, exams]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [examRes, studentRes, classRes] = await Promise.all([
        getExams(),
        getStudents().catch(() => ({ data: [] })),
        getClasses().catch(() => ({ data: [] })),
      ]);
      setExams(Array.isArray(examRes.data) ? examRes.data : []);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setSchoolClasses(Array.isArray(classRes.data) ? classRes.data : []);
    } catch (err) {
      console.error("Failed to load exams:", err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const setField = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const classStudents = (className) =>
    students.filter((s) => (s.status || "Active") === "Active" && (!className || s.class_name === className));

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, class_name: classOptions[0] || "", start_date: todayISO(), end_date: todayISO() });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (exam) => {
    setFormData({
      title: exam.title || "",
      class_name: exam.class_name || "",
      exam_type: exam.exam_type || "Monthly",
      subject: exam.subject || "Mathematics",
      start_date: exam.start_date || todayISO(),
      end_date: exam.end_date || todayISO(),
      total_marks: String(exam.total_marks || 100),
      venue: exam.venue || "",
      description: exam.description || "",
    });
    setEditingId(exam.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Title is required");
    if (formData.end_date < formData.start_date) return alert("End date cannot be before start date");
    setSaving(true);
    try {
      const payload = { ...formData, total_marks: Number(formData.total_marks) || 100 };
      if (editingId) await updateExam(editingId, payload);
      else await createExam(payload);
      closeModal();
      await fetchAll();
    } catch {
      alert("Failed to save exam.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? Results for this exam will also be removed.`)) return;
    try {
      await deleteExam(id);
      setResultsExam(null);
      await fetchAll();
    } catch {
      alert("Failed to delete exam.");
    }
  };

  const openResults = async (exam) => {
    setResultsExam(exam);
    const roster = classStudents(exam.class_name);
    const next = {};
    roster.forEach((s) => {
      next[s.id] = { marks: "", remarks: "" };
    });
    try {
      const res = await getExamResults(exam.id);
      const rows = Array.isArray(res.data) ? res.data : res.data?.results || [];
      rows.forEach((row) => {
        next[row.student] = { marks: String(row.marks_obtained ?? ""), remarks: row.remarks || "" };
      });
    } catch {
      /* empty marks */
    }
    setResultMarks(next);
  };

  const saveResults = async () => {
    if (!resultsExam) return;
    const results = Object.entries(resultMarks)
      .filter(([, row]) => row.marks !== "" && row.marks != null)
      .map(([student_id, row]) => ({
        student_id: Number(student_id),
        marks_obtained: Number(row.marks),
        remarks: row.remarks || "",
      }));
    if (!results.length) return alert("Enter marks for at least one student.");
    setSaving(true);
    try {
      await saveExamResults(resultsExam.id, {
        subject: resultsExam.subject || "General",
        total_marks: resultsExam.total_marks || 100,
        results,
      });
      setResultsExam(null);
      await fetchAll();
    } catch {
      alert("Failed to save results.");
    } finally {
      setSaving(false);
    }
  };

  const notifyList = notifyExam ? classStudents(notifyExam.class_name) : [];

  const sendNotice = (student, exam) => {
    const phone = contactPhone(student);
    if (!phone) return;
    const msg = encodeURIComponent(
      `Exam notice\n\n${exam.title} (${exam.exam_type}) for ${exam.class_name || "your class"}.\nDates: ${formatDate(exam.start_date)} to ${formatDate(exam.end_date)}${exam.subject ? `\nSubject: ${exam.subject}` : ""}${exam.venue ? `\nVenue: ${exam.venue}` : ""}\n\n${tenant.schoolName || "School"}`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const filtered = exams.filter((exam) => {
    const q = search.toLowerCase().trim();
    const blob = [exam.title, exam.class_name, exam.exam_type, exam.subject, exam.venue].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchClass = selectedClass === "All" || exam.class_name === selectedClass;
    const st = examStatus(exam);
    const matchTab = tab === "All" || st === tab;
    return matchSearch && matchClass && matchTab;
  });

  const stats = {
    total: exams.length,
    upcoming: exams.filter((e) => examStatus(e) === "Upcoming").length,
    ongoing: exams.filter((e) => examStatus(e) === "Ongoing").length,
    completed: exams.filter((e) => examStatus(e) === "Completed").length,
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Assessments</p>
          <h1>Exams</h1>
          <p>Schedule papers, enter marks, and notify families at {tenant.schoolName || "your school"}.</p>
        </div>
        <div className="dash-hero-meta">
          <button type="button" className="st-add-btn" onClick={openAdd}>
            <Plus size={16} /> Schedule exam
          </button>
        </div>
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => setTab("All")}>
          <span>Total</span>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>exams</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setTab("Upcoming")}>
          <span>Upcoming</span>
          <strong>{loading ? "—" : stats.upcoming}</strong>
          <small>not started</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => setTab("Ongoing")}>
          <span>Ongoing</span>
          <strong>{loading ? "—" : stats.ongoing}</strong>
          <small>this week</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setTab("Completed")}>
          <span>Completed</span>
          <strong>{loading ? "—" : stats.completed}</strong>
          <small>ready for results</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search title, class, subject…"
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
          {["All", "Upcoming", "Ongoing", "Completed"].map((f) => (
            <button key={f} type="button" className={tab === f ? "is-on" : ""} onClick={() => setTab(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="st-classes">
        <button type="button" className={selectedClass === "All" ? "is-on" : ""} onClick={() => setSelectedClass("All")}>
          All classes
        </button>
        {classOptions.map((c) => (
          <button key={c} type="button" className={selectedClass === c ? "is-on" : ""} onClick={() => setSelectedClass(c)}>
            {c}
          </button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading exams…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <ClipboardList size={36} />
            <p>{exams.length ? "No exams match these filters." : "No exams yet. Schedule the first paper."}</p>
            {!exams.length && <button type="button" onClick={openAdd}>Schedule exam</button>}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Class</th>
                  <th>Dates</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((exam) => {
                  const st = examStatus(exam);
                  return (
                    <tr key={exam.id}>
                      <td>
                        <div className="st-cell-stack">
                          <b>{exam.title}</b>
                          <small>{exam.exam_type}{exam.subject ? ` · ${exam.subject}` : ""}{exam.venue ? ` · ${exam.venue}` : ""}</small>
                        </div>
                      </td>
                      <td>{exam.class_name || "—"}</td>
                      <td>{formatDate(exam.start_date)} – {formatDate(exam.end_date)}</td>
                      <td className="st-mono">{exam.total_marks || 100}</td>
                      <td>
                        <span className={`st-badge ${st === "Completed" ? "is-on" : st === "Ongoing" ? "is-warn" : "is-off"}`}>
                          {st}
                        </span>
                      </td>
                      <td>
                        <div className="st-actions">
                          <button type="button" title="Results" onClick={() => openResults(exam)}><ClipboardList size={15} /></button>
                          <button type="button" title="Notify" onClick={() => setNotifyExam(exam)}><MessageCircle size={15} /></button>
                          <button type="button" title="Edit" onClick={() => openEdit(exam)}><Edit size={15} /></button>
                          <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(exam.id, exam.title)}>
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

      <p className="st-count">Showing {filtered.length} of {exams.length} exams</p>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
              <div>
                <p>Exam record</p>
                <h2>{editingId ? "Edit exam" : "Schedule exam"}</h2>
              </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Details</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Title *
                  <input required value={formData.title} onChange={setField("title")} placeholder="e.g. Midterm Mathematics" />
                </label>
                <label>
                  Class
                  <select value={formData.class_name} onChange={setField("class_name")}>
                    <option value="">Select class</option>
                    {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  Type
                  <select value={formData.exam_type} onChange={setField("exam_type")}>
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Subject
                  <select value={formData.subject} onChange={setField("subject")}>
                    {unique([...SUBJECTS, formData.subject]).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Total marks
                  <input type="number" min="1" value={formData.total_marks} onChange={setField("total_marks")} />
                </label>
                <label>
                  Start date
                  <input type="date" value={formData.start_date} onChange={setField("start_date")} />
                </label>
                <label>
                  End date
                  <input type="date" value={formData.end_date} onChange={setField("end_date")} />
                </label>
                <label className="st-span-2">
                  Venue / room
                  <input value={formData.venue} onChange={setField("venue")} placeholder="e.g. Hall 2" />
                </label>
                <label className="st-span-2">
                  Syllabus / notes
                  <textarea rows={3} value={formData.description} onChange={setField("description")} placeholder="Chapters, instructions…" />
                </label>
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Create exam"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {resultsExam && (
        <AppModal onClose={() => setResultsExam(null)}>
          <div className="st-modal">
            <header>
              <div>
                <p>{resultsExam.class_name} · {resultsExam.subject || "General"}</p>
                <h2>Results · {resultsExam.title}</h2>
              </div>
              <button type="button" onClick={() => setResultsExam(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Total marks: {resultsExam.total_marks || 100}. Grade is calculated automatically.</p>
              {classStudents(resultsExam.class_name).length === 0 ? (
                <p className="st-hint">No students in this class yet.</p>
              ) : (
                <div className="exam-result-list">
                  {classStudents(resultsExam.class_name).map((s) => (
                    <div key={s.id} className="exam-result-row">
                      <div>
                        <b>{s.name}</b>
                        <small>{s.roll_no || "No roll"}</small>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={resultsExam.total_marks || 100}
                        placeholder="Marks"
                        value={resultMarks[s.id]?.marks || ""}
                        onChange={(e) => setResultMarks((prev) => ({
                          ...prev,
                          [s.id]: { ...(prev[s.id] || {}), marks: e.target.value },
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setResultsExam(null)}>Cancel</button>
              <button type="button" className="st-add-btn" disabled={saving} onClick={saveResults}>
                {saving ? <Loader2 size={16} className="spin" /> : "Save results"}
              </button>
            </footer>
          </div>
        </AppModal>
      )}

      {notifyExam && (
        <AppModal onClose={() => setNotifyExam(null)}>
          <div className="st-modal">
            <header>
              <div>
                <p>{notifyExam.class_name}</p>
                <h2>Notify · {notifyExam.title}</h2>
              </div>
              <button type="button" onClick={() => setNotifyExam(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Opens WhatsApp for one parent at a time. Use father/guardian phone from the student record.</p>
              {notifyList.length === 0 ? (
                <p className="st-hint">No students in this class.</p>
              ) : (
                <ul className="exam-notify-list">
                  {notifyList.map((s) => {
                    const phone = contactPhone(s);
                    return (
                      <li key={s.id}>
                        <div>
                          <b>{s.name}</b>
                          <small>{phone || "No phone"}</small>
                        </div>
                        <button type="button" className="fee-wa" disabled={!phone} onClick={() => sendNotice(s, notifyExam)}>
                          <MessageCircle size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setNotifyExam(null)}>Close</button>
            </footer>
          </div>
        </AppModal>
      )}
    </div>
  );
}
