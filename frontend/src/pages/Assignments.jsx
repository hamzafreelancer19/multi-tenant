import { useEffect, useMemo, useState } from "react";
import { 
  ClipboardList, 
  Edit,
  Eye,
  Loader2,
  MessageCircle,
  Plus, 
  Search, 
  Trash2,
  X,
} from "lucide-react";
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from "../api/assignmentsApi";
import { getTeachers } from "../api/teachersApi";
import { getClasses } from "../api/classesApi";
import { getStudents } from "../api/studentsApi";
import { useTenant } from "../context/TenantContext";
import { getRole, getUser } from "../store/authStore";
import { isTeacherRole, mergeClassOptions } from "../utils/classOptions";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Assignments.css";

const TYPES = ["Homework", "Project", "Worksheet", "Quiz", "Practical", "Reading"];
const STATUSES = ["Assigned", "Draft", "Closed"];
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

function hhmm(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function dueStatus(item) {
  if (item.due_status) return item.due_status;
  if (item.status === "Draft") return "Draft";
  if (item.status === "Closed") return "Closed";
  const today = todayISO();
  if (item.due_date < today) return "Overdue";
  if (item.due_date === today) return "Due today";
  return "Assigned";
}

function badgeClass(st) {
  if (st === "Overdue") return "is-off as-overdue";
  if (st === "Due today" || st === "Due soon") return "is-warn";
  if (st === "Closed" || st === "Draft") return "is-off";
  return "is-on";
}

function apiError(err) {
  const data = err.response?.data;
  if (!data) return "Could not save assignment.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || "Could not save assignment.";
}

const EMPTY_FORM = {
  title: "",
  description: "",
  class_name: "",
  subject: "",
  teacher: "",
  assignment_type: "Homework",
  status: "Assigned",
  due_date: todayISO(),
  due_time: "",
  max_marks: "100",
  notes: "",
  attachment_url: "",
};

export default function Assignments() {
  const tenant = useTenant();
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
  const [tab, setTab] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [notifyItem, setNotifyItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const landingClasses = (tenant.landing?.classes || []).map((c) => c.label || c.name).filter(Boolean);

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map(classLabel);
    const fromStudents = students.map((s) => s.class_name);
    const fromRows = rows.map((r) => r.class_name);
    return mergeClassOptions([fromApi, isTeacherRole() ? [] : landingClasses, fromStudents, fromRows]);
  }, [schoolClasses, landingClasses, students, rows]);

  const subjectOptions = useMemo(() => {
    return unique([...SUBJECTS, ...teachers.map((t) => t.subject), ...rows.map((r) => r.subject), formData.subject]);
  }, [teachers, rows, formData.subject]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, tRes, cRes, sRes] = await Promise.all([
        getAssignments(),
        getTeachers().catch(() => ({ data: [] })),
        getClasses().catch(() => ({ data: [] })),
        getStudents().catch(() => ({ data: [] })),
      ]);
      const nextRows = Array.isArray(aRes.data) ? aRes.data : [];
      const nextStudents = Array.isArray(sRes.data) ? sRes.data : [];
      setRows(nextRows);
      setTeachers(Array.isArray(tRes.data) ? tRes.data : []);
      setSchoolClasses(Array.isArray(cRes.data) ? cRes.data : []);
      setStudents(nextStudents);
      const mine = nextStudents.find((s) => {
        const email = (s.email || "").toLowerCase();
        return email && (email === (user?.email || "").toLowerCase() || email === (user?.username || "").toLowerCase());
      });
      if (role === "student" && mine?.class_name) setSelectedClass(mine.class_name);
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
      return next;
    });
  };

  const classStudents = (className) =>
    students.filter((s) => (s.status || "Active") === "Active" && (!className || s.class_name === className));

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, class_name: selectedClass !== "All" ? selectedClass : classOptions[0] || "", due_date: todayISO() });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setFormData({
      title: item.title || "",
      description: item.description || "",
      class_name: item.class_name || "",
      subject: item.subject || "",
      teacher: item.teacher ? String(item.teacher) : "",
      assignment_type: item.assignment_type || "Homework",
      status: item.status || "Assigned",
      due_date: item.due_date || todayISO(),
      due_time: hhmm(item.due_time),
      max_marks: String(item.max_marks || 100),
      notes: item.notes || "",
      attachment_url: item.attachment_url || "",
    });
    setEditingId(item.id);
    setViewing(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Title is required");
    if (!formData.class_name) return alert("Class is required");
    if (!formData.subject.trim()) return alert("Subject is required");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        max_marks: Number(formData.max_marks) || 100,
        teacher: formData.teacher ? Number(formData.teacher) : null,
        due_time: formData.due_time || null,
      };
      if (editingId) await updateAssignment(editingId, payload);
      else await createAssignment(payload);
      closeModal();
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteAssignment(id);
      setViewing(null);
      await fetchAll();
    } catch {
      alert("Could not delete assignment.");
    }
  };

  const sendNotice = (student, item) => {
    const phone = contactPhone(student);
    if (!phone) return;
    const msg = encodeURIComponent(
      `Homework reminder\n\n${item.title} (${item.assignment_type || "Homework"}) for ${item.class_name}.\nSubject: ${item.subject || "—"}\nDue: ${formatDate(item.due_date)}${item.due_time ? ` ${hhmm(item.due_time)}` : ""}${item.max_marks ? `\nMarks: ${item.max_marks}` : ""}\n\n${item.description || ""}\n\n${tenant.schoolName || "School"}`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const filtered = rows.filter((item) => {
    const q = search.trim().toLowerCase();
    const blob = [item.title, item.class_name, item.subject, item.teacher_name, item.assignment_type, item.description].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchClass = selectedClass === "All" || item.class_name === selectedClass;
    const st = dueStatus(item);
    const matchTab =
      tab === "All" ||
      st === tab ||
      (tab === "Assigned" && ["Assigned", "Due soon", "Due today"].includes(st)) ||
      (tab === "Due soon" && ["Due soon", "Due today"].includes(st));
    return matchSearch && matchClass && matchTab;
  });

  const stats = {
    total: rows.length,
    assigned: rows.filter((r) => ["Assigned", "Due soon", "Due today"].includes(dueStatus(r))).length,
    dueSoon: rows.filter((r) => ["Due soon", "Due today"].includes(dueStatus(r))).length,
    overdue: rows.filter((r) => dueStatus(r) === "Overdue").length,
  };

  const notifyList = notifyItem ? classStudents(notifyItem.class_name) : [];

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Learning</p>
          <h1>Homework</h1>
          <p>
            {canManage
              ? `Set tasks and deadlines for ${tenant.schoolName || "your school"}.`
              : `Your assignments at ${tenant.schoolName || "your school"}.`}
          </p>
        </div>
        {canManage && (
          <div className="dash-hero-meta">
            <button type="button" className="st-add-btn" onClick={openAdd}>
              <Plus size={16} /> Create assignment
            </button>
          </div>
        )}
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => setTab("All")}>
          <span>Total</span>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>tasks</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setTab("Assigned")}>
          <span>Assigned</span>
          <strong>{loading ? "—" : stats.assigned}</strong>
          <small>open</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => setTab("Due soon")}>
          <span>Due soon</span>
          <strong>{loading ? "—" : stats.dueSoon}</strong>
          <small>next 3 days</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setTab("Overdue")}>
          <span>Overdue</span>
          <strong>{loading ? "—" : stats.overdue}</strong>
          <small>past due</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
            <input 
            placeholder="Search title, subject, teacher…"
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
          {["All", "Assigned", "Due soon", "Overdue", "Closed"].map((f) => (
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
            <p>Loading homework…</p>
                </div>
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <ClipboardList size={36} />
            <p>{rows.length ? "No assignments match these filters." : "No homework yet. Create the first assignment."}</p>
            {canManage && !rows.length && <button type="button" onClick={openAdd}>Create assignment</button>}
              </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Class</th>
                  <th>Due</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const st = dueStatus(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <button type="button" className="st-person" onClick={() => setViewing(item)}>
                          <span>{(item.subject || "H").slice(0, 1)}</span>
                    <div>
                            <b>{item.title}</b>
                            <small>
                              {item.assignment_type || "Homework"}
                              {item.subject ? ` · ${item.subject}` : ""}
                              {item.teacher_name ? ` · ${item.teacher_name}` : ""}
                            </small>
                    </div>
                        </button>
                      </td>
                      <td>{item.class_name || "—"}</td>
                      <td>
                        <div className="st-cell-stack">
                          <b>{formatDate(item.due_date)}</b>
                          <small>{item.due_time ? hhmm(item.due_time) : "No time"}</small>
                 </div>
                      </td>
                      <td className="st-mono">{item.max_marks || 100}</td>
                      <td>
                        <span className={`st-badge ${badgeClass(st)}`}>{st}</span>
                      </td>
                      <td>
                        <div className="st-actions">
                          <button type="button" title="View" onClick={() => setViewing(item)}><Eye size={15} /></button>
                          {canManage && (
                            <>
                              <button type="button" title="Notify" onClick={() => setNotifyItem(item)}><MessageCircle size={15} /></button>
                              <button type="button" title="Edit" onClick={() => openEdit(item)}><Edit size={15} /></button>
                              <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(item.id, item.title)}>
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
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

      <p className="st-count">Showing {filtered.length} of {rows.length} assignments</p>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
                 <div>
                <p>Homework</p>
                <h2>{editingId ? "Edit assignment" : "Create assignment"}</h2>
                 </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Details</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Title *
                  <input required value={formData.title} onChange={setField("title")} placeholder="e.g. Chapter 4 exercise" />
                </label>
                <label>
                  Class *
                  <select required value={formData.class_name} onChange={setField("class_name")}>
                    <option value="">Select class</option>
                    {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  Type
                  <select value={formData.assignment_type} onChange={setField("assignment_type")}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Subject *
                  <input list="as-subjects" required value={formData.subject} onChange={setField("subject")} placeholder="e.g. Mathematics" />
                  <datalist id="as-subjects">
                    {subjectOptions.map((s) => <option key={s} value={s} />)}
                  </datalist>
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
                  Due date *
                  <input type="date" required value={formData.due_date} onChange={setField("due_date")} />
                </label>
                <label>
                  Due time
                  <input type="time" value={formData.due_time} onChange={setField("due_time")} />
                </label>
                <label>
                  Max marks
                  <input type="number" min="1" value={formData.max_marks} onChange={setField("max_marks")} />
                </label>
                <label>
                  Status
                  <select value={formData.status} onChange={setField("status")}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="st-span-2">
                  Instructions
                  <textarea rows={4} value={formData.description} onChange={setField("description")} placeholder="What students should do…" />
                </label>
                <label>
                  Resource link
                  <input value={formData.attachment_url} onChange={setField("attachment_url")} placeholder="https://…" />
                </label>
                <label>
                  Notes
                  <input value={formData.notes} onChange={setField("notes")} placeholder="Optional" />
                </label>
              </div>
                    </div>
            <footer>
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Assign homework"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {viewing && (
        <AppModal onClose={() => setViewing(null)}>
          <div className="st-modal">
            <header>
                    <div>
                <p>{viewing.class_name} · {viewing.subject || "General"}</p>
                <h2>{viewing.title}</h2>
                    </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="as-view-grid">
                <ViewRow label="Type" value={viewing.assignment_type || "Homework"} />
                <ViewRow label="Due" value={`${formatDate(viewing.due_date)}${viewing.due_time ? ` · ${hhmm(viewing.due_time)}` : ""}`} />
                <ViewRow label="Marks" value={viewing.max_marks || 100} />
                <ViewRow label="Status" value={dueStatus(viewing)} />
                <ViewRow label="Teacher" value={viewing.teacher_name || "Unassigned"} />
                <ViewRow label="Posted by" value={viewing.posted_by || "—"} />
                    </div>
              {viewing.description && <p className="as-body">{viewing.description}</p>}
              {viewing.notes && <p className="st-hint">{viewing.notes}</p>}
              {viewing.attachment_url && (
                <a className="as-link" href={viewing.attachment_url} target="_blank" rel="noreferrer">Open resource</a>
              )}
                 </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setViewing(null)}>Close</button>
              {canManage && (
                <>
                  <button type="button" className="st-ghost" onClick={() => setNotifyItem(viewing)}>Notify</button>
                  <button type="button" className="st-add-btn" onClick={() => openEdit(viewing)}>Edit</button>
                </>
              )}
            </footer>
                 </div>
        </AppModal>
      )}

      {notifyItem && (
        <AppModal onClose={() => setNotifyItem(null)}>
          <div className="st-modal">
            <header>
                    <div>
                <p>{notifyItem.class_name}</p>
                <h2>Notify · {notifyItem.title}</h2>
                    </div>
              <button type="button" onClick={() => setNotifyItem(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Opens WhatsApp for one parent at a time. Uses father/guardian phone from the student record.</p>
              {notifyList.length === 0 ? (
                <p className="st-hint">No students in this class.</p>
              ) : (
                <ul className="as-notify-list">
                  {notifyList.map((s) => {
                    const phone = contactPhone(s);
                    return (
                      <li key={s.id}>
                    <div>
                          <b>{s.name}</b>
                          <small>{phone || "No phone"}</small>
                    </div>
                        <button type="button" className="as-wa" disabled={!phone} onClick={() => sendNotice(s, notifyItem)}>
                          <MessageCircle size={14} />
                    </button>
                      </li>
                    );
                  })}
                </ul>
              )}
                 </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setNotifyItem(null)}>Close</button>
            </footer>
           </div>
        </AppModal>
      )}
    </div>
  );
}

function ViewRow({ label, value }) {
  return (
    <div className="as-view-row">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}
