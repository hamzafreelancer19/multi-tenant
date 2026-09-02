import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Eye,
  Filter,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Trash2,
  KeyRound,
  X,
} from "lucide-react";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, setTeacherLogin } from "../api/teachersApi";
import { getClasses } from "../api/classesApi";
import { useTenant } from "../context/TenantContext";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Teachers.css";

const SUBJECTS = [
  "Mathematics", "English", "Urdu", "Physics", "Chemistry", "Biology",
  "Computer Science", "Islamiat", "Pakistan Studies", "History",
  "Geography", "Art", "Physical Education", "Other",
];

const DESIGNATIONS = [
  "Subject Teacher", "Class Teacher", "HOD", "Vice Principal", "Principal",
];

const EMPTY_FORM = {
  name: "",
  subject: "Mathematics",
  custom_subject: "",
  designation: "Subject Teacher",
  gender: "",
  date_of_birth: "",
  cnic: "",
  qualification: "",
  experience: "",
  email: "",
  phone: "",
  emergency_phone: "",
  joining_date: "",
  status: "Active",
  address: "",
  city: "",
  notes: "",
  classes: [],
  password: "",
  password2: "",
};

const FALLBACK_CLASSES = [
  "Nursery", "KG-I", "KG-II",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "First Year", "Second Year",
];

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function teacherClasses(t) {
  if (Array.isArray(t?.classes)) return t.classes.filter(Boolean);
  if (typeof t?.classes === "string" && t.classes.trim()) {
    return t.classes.split(",").map((c) => c.trim()).filter(Boolean);
  }
  return [];
}

function formFromTeacher(t) {
  const known = SUBJECTS.includes(t.subject) ? t.subject : t.subject ? "Other" : "Mathematics";
  return {
    name: t.name || "",
    subject: known,
    custom_subject: known === "Other" ? (t.subject || "") : "",
    designation: t.designation || "Subject Teacher",
    gender: t.gender || "",
    date_of_birth: t.date_of_birth || "",
    cnic: t.cnic || "",
    qualification: t.qualification || "",
    experience: t.experience || "",
    email: t.email || "",
    phone: t.phone || "",
    emergency_phone: t.emergency_phone || "",
    joining_date: t.joining_date || "",
    status: t.status || "Active",
    address: t.address || "",
    city: t.city || "",
    notes: t.notes || "",
    classes: teacherClasses(t),
    password: "",
    password2: "",
  };
}

function payloadFromForm(form) {
  const subject = form.subject === "Other" ? (form.custom_subject.trim() || "Other") : form.subject;
  return {
    name: form.name.trim(),
    subject,
    designation: form.designation,
    gender: form.gender,
    date_of_birth: form.date_of_birth || null,
    cnic: form.cnic,
    qualification: form.qualification,
    experience: form.experience || null,
    email: form.email || null,
    phone: form.phone,
    emergency_phone: form.emergency_phone,
    joining_date: form.joining_date || null,
    status: form.status,
    address: form.address,
    city: form.city,
    notes: form.notes,
    classes: form.classes,
  };
}

export default function Teachers() {
  const tenant = useTenant();
  const [teachers, setTeachers] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingCode, setEditingCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [createdLogin, setCreatedLogin] = useState(null);

  const landingClasses = (tenant.landing?.classes || []).map((c) => c.label || c.name).filter(Boolean);

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map((c) => (c.section ? `${c.name} - ${c.section}` : c.name));
    const fromTeachers = teachers.flatMap(teacherClasses);
    const merged = unique([...fromApi, ...landingClasses, ...fromTeachers]);
    return merged.length ? merged : FALLBACK_CLASSES;
  }, [schoolClasses, landingClasses, teachers]);

  const subjectOptions = useMemo(() => {
    return unique(teachers.map((t) => t.subject));
  }, [teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const [res, classRes] = await Promise.all([
        getTeachers(),
        getClasses().catch(() => ({ data: [] })),
      ]);
      setTeachers(Array.isArray(res.data) ? res.data : []);
      setSchoolClasses(Array.isArray(classRes.data) ? classRes.data : []);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase().trim();
    const blob = [
      t.name, t.subject, t.email, t.phone, t.employee_id, t.designation,
      t.qualification, t.city, t.cnic, teacherClasses(t).join(" "),
    ].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchStatus = filterStatus === "All" || (t.status || "Active") === filterStatus;
    const matchSubject = selectedSubject === "All" || t.subject === selectedSubject;
    return matchSearch && matchStatus && matchSubject;
  });

  const stats = {
    total: teachers.length,
    active: teachers.filter((t) => (t.status || "Active") === "Active").length,
    inactive: teachers.filter((t) => t.status === "Inactive").length,
    subjects: unique(teachers.map((t) => t.subject)).length,
  };

  const setField = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleClass = (label) => {
    setFormData((prev) => {
      const has = prev.classes.includes(label);
      return { ...prev, classes: has ? prev.classes.filter((c) => c !== label) : [...prev.classes, label] };
    });
  };

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setEditingCode("");
    setShowModal(true);
  };

  const openEdit = (t) => {
    setFormData(formFromTeacher(t));
    setEditingId(t.id);
    setEditingCode(t.employee_id || "");
    setViewing(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setEditingCode("");
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Name is required");
    if (!formData.subject) return alert("Subject is required");
    if (!formData.email.trim()) return alert("Email is required for teacher login.");
    if (!editingId) {
      if (!formData.password || formData.password.length < 6) {
        return alert("Set a login password of at least 6 characters.");
      }
      if (formData.password !== formData.password2) {
        return alert("Password and confirm password do not match.");
      }
    } else if (formData.password) {
      if (formData.password.length < 6) return alert("Password must be at least 6 characters.");
      if (formData.password !== formData.password2) return alert("Password and confirm password do not match.");
    }
    setSaving(true);
    try {
      const payload = payloadFromForm(formData);
      if (formData.password) payload.password = formData.password;
      if (editingId) await updateTeacher(editingId, payload);
      else await createTeacher(payload);
      if (!editingId) {
        setCreatedLogin({ name: formData.name.trim(), email: formData.email.trim(), password: formData.password });
      }
      closeModal();
      await fetchTeachers();
    } catch (err) {
      const data = err.response?.data || {};
      const first = Object.values(data).flat().find(Boolean);
      alert(typeof first === "string" ? first : "Failed to save teacher.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetLogin = async (teacher) => {
    const email = window.prompt("Login email", teacher.email || "") || "";
    if (!email.trim()) return;
    const password = window.prompt("New login password (min 6 characters)") || "";
    if (password.length < 6) return alert("Password must be at least 6 characters.");
    try {
      await setTeacherLogin(teacher.id, { email: email.trim(), password });
      setCreatedLogin({ name: teacher.name, email: email.trim(), password });
      setViewing(null);
      await fetchTeachers();
    } catch (err) {
      const data = err.response?.data || {};
      const first = Object.values(data).flat().find(Boolean);
      alert(typeof first === "string" ? first : "Could not save login.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTeacher(id);
      setViewing(null);
      await fetchTeachers();
    } catch {
      alert("Failed to delete teacher");
    }
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Faculty</p>
          <h1>Teachers</h1>
          <p>Staff profiles, subjects, and assigned classes for {tenant.schoolName || "your school"}.</p>
        </div>
        <div className="dash-hero-meta">
          <button type="button" className="st-add-btn" onClick={openAdd}>
            <Plus size={16} /> Add teacher
          </button>
        </div>
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => { setFilterStatus("All"); setSelectedSubject("All"); }}>
          <span>Total</span>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>faculty</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setFilterStatus("Active")}>
          <span>Active</span>
          <strong>{loading ? "—" : stats.active}</strong>
          <small>currently teaching</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setFilterStatus("Inactive")}>
          <span>Inactive</span>
          <strong>{loading ? "—" : stats.inactive}</strong>
          <small>left or paused</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold">
          <span>Subjects</span>
          <strong>{loading ? "—" : stats.subjects}</strong>
          <small>being taught</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search name, subject, phone, class…"
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
        <button type="button" className={selectedSubject === "All" ? "is-on" : ""} onClick={() => setSelectedSubject("All")}>
          All subjects
        </button>
        {subjectOptions.map((s) => (
          <button key={s} type="button" className={selectedSubject === s ? "is-on" : ""} onClick={() => setSelectedSubject(s)}>
            {s}
          </button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading teachers…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <GraduationCap size={36} />
            <p>
              {search || filterStatus !== "All" || selectedSubject !== "All"
                ? "No teachers match these filters."
                : "No teachers yet. Add the first faculty record."}
            </p>
            {!search && filterStatus === "All" && selectedSubject === "All" && (
              <button type="button" onClick={openAdd}>Add teacher</button>
            )}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Classes</th>
                  <th>Phone</th>
                  <th>Login</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const assigned = teacherClasses(t);
                  return (
                    <tr key={t.id}>
                      <td>
                        <button type="button" className="st-person" onClick={() => setViewing(t)}>
                          <span>{t.name ? t.name[0].toUpperCase() : "T"}</span>
                          <div>
                            <b>{t.name}</b>
                            <small>{t.designation || t.qualification || "Faculty"}</small>
                          </div>
                        </button>
                      </td>
                      <td className="st-mono">{t.employee_id || "—"}</td>
                      <td>{t.subject || "—"}</td>
                      <td>
                        <div className="tc-chips">
                          {assigned.length ? assigned.slice(0, 3).map((c) => <em key={c}>{c}</em>) : <span>—</span>}
                          {assigned.length > 3 ? <em>+{assigned.length - 3}</em> : null}
                        </div>
                      </td>
                      <td>{t.phone || "—"}</td>
                      <td>
                        {t.has_login ? (
                          <span className="st-badge is-on">Ready</span>
                        ) : (
                          <button type="button" className="st-ghost" onClick={() => handleSetLogin(t)}>Create login</button>
                        )}
                      </td>
                      <td>
                        <span className={`st-badge ${t.status === "Inactive" ? "is-off" : "is-on"}`}>
                          {t.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="st-actions">
                          <button type="button" title="View" onClick={() => setViewing(t)}><Eye size={15} /></button>
                          <button type="button" title="Edit" onClick={() => openEdit(t)}><Edit size={15} /></button>
                          <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(t.id, t.name)}>
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

      <p className="st-count">Showing {filtered.length} of {teachers.length} teachers</p>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
              <div>
                <p>Faculty record</p>
                <h2>{editingId ? "Edit teacher" : "Add teacher"}</h2>
              </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>

            <div className="st-modal-body">
              <p className="st-section">Personal details</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Full name *
                  <input required value={formData.name} onChange={setField("name")} placeholder="e.g. Ahmed Raza" />
                </label>
                <label>
                  Gender
                  <select value={formData.gender} onChange={setField("gender")}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Date of birth
                  <input type="date" value={formData.date_of_birth} onChange={setField("date_of_birth")} />
                </label>
                <label>
                  CNIC
                  <input value={formData.cnic} onChange={setField("cnic")} placeholder="xxxxx-xxxxxxx-x" />
                </label>
                {editingId && (
                  <label>
                    Employee ID
                    <input readOnly value={editingCode || "—"} />
                  </label>
                )}
                <label>
                  Phone
                  <input value={formData.phone} onChange={setField("phone")} placeholder="03xx xxx xxxx" />
                </label>
                <label>
                  Email *
                  <input required type="email" value={formData.email} onChange={setField("email")} placeholder="teacher@school.com" />
                </label>
                <label>
                  Emergency phone
                  <input value={formData.emergency_phone} onChange={setField("emergency_phone")} placeholder="Optional" />
                </label>
              </div>

              <p className="st-section">Role & academics</p>
              <div className="st-grid">
                <label>
                  Subject *
                  <select required value={formData.subject} onChange={setField("subject")}>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                {formData.subject === "Other" && (
                  <label>
                    Custom subject
                    <input value={formData.custom_subject} onChange={setField("custom_subject")} placeholder="Subject name" />
                  </label>
                )}
                <label>
                  Designation
                  <select value={formData.designation} onChange={setField("designation")}>
                    {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
                <label>
                  Qualification
                  <input value={formData.qualification} onChange={setField("qualification")} placeholder="e.g. M.A Education" />
                </label>
                <label>
                  Experience
                  <input value={formData.experience} onChange={setField("experience")} placeholder="e.g. 5 yrs" />
                </label>
                <label>
                  Joining date
                  <input type="date" value={formData.joining_date} onChange={setField("joining_date")} />
                </label>
                <label>
                  Status
                  <select value={formData.status} onChange={setField("status")}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <p className="st-section">Assigned classes</p>
              <div className="tc-picker">
                {classOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={formData.classes.includes(c) ? "is-on" : ""}
                    onClick={() => toggleClass(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <p className="st-section">Teacher login</p>
              <p className="st-hint">
                This email and password are saved in the school database. The teacher uses them on the school login page to open the teacher portal.
              </p>
              <div className="st-grid">
                <label>
                  {editingId ? "New password" : "Password *"}
                  <input
                    type="password"
                    required={!editingId}
                    minLength={editingId ? undefined : 6}
                    value={formData.password}
                    onChange={setField("password")}
                    placeholder={editingId ? "Leave blank to keep current" : "At least 6 characters"}
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password2}
                    onChange={setField("password2")}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <p className="st-section">Address</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Home address
                  <textarea rows={3} value={formData.address} onChange={setField("address")} placeholder="House, street, area" />
                </label>
                <label>
                  City
                  <input value={formData.city} onChange={setField("city")} placeholder="City" />
                </label>
                <label>
                  Notes
                  <input value={formData.notes} onChange={setField("notes")} placeholder="Any special note" />
                </label>
              </div>

              {editingId && (
                <p className="st-hint">Employee ID is generated automatically. Change the password only if the teacher needs a new login.</p>
              )}
            </div>

            <footer>
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Create teacher"}
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
                <p>{viewing.employee_id || "Teacher"}</p>
                <h2>{viewing.name}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="st-view-grid">
                <ViewRow label="Subject" value={viewing.subject} />
                <ViewRow label="Designation" value={viewing.designation} />
                <ViewRow label="Gender" value={viewing.gender} />
                <ViewRow label="Date of birth" value={viewing.date_of_birth} />
                <ViewRow label="CNIC" value={viewing.cnic} />
                <ViewRow label="Qualification" value={viewing.qualification} />
                <ViewRow label="Experience" value={viewing.experience} />
                <ViewRow label="Joining date" value={viewing.joining_date} />
                <ViewRow label="Phone" value={viewing.phone} />
                <ViewRow label="Email / login" value={viewing.login_username || viewing.email} />
                <ViewRow label="Portal login" value={viewing.has_login ? "Ready — use school login page" : "Not created yet"} />
                <ViewRow label="Emergency" value={viewing.emergency_phone} />
                <ViewRow label="Status" value={viewing.status} />
                <ViewRow label="City" value={viewing.city} />
                <ViewRow label="Classes" value={teacherClasses(viewing).join(", ")} />
                <ViewRow label="Address" value={viewing.address} wide />
                <ViewRow label="Notes" value={viewing.notes} wide />
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost is-danger" onClick={() => handleDelete(viewing.id, viewing.name)}>Delete</button>
              <button type="button" className="st-ghost" onClick={() => handleSetLogin(viewing)}>
                <KeyRound size={14} /> {viewing.has_login ? "Reset login" : "Create login"}
              </button>
              <button type="button" className="st-add-btn" onClick={() => openEdit(viewing)}>Edit record</button>
            </footer>
          </div>
        </AppModal>
      )}

      {createdLogin && (
        <AppModal onClose={() => setCreatedLogin(null)}>
          <div className="st-modal st-view">
            <header>
              <div>
                <p>Teacher portal</p>
                <h2>Login saved</h2>
              </div>
              <button type="button" onClick={() => setCreatedLogin(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Give these details to {createdLogin.name}. They log in on this school website.</p>
              <div className="st-view-grid">
                <ViewRow label="Email" value={createdLogin.email} />
                <ViewRow label="Password" value={createdLogin.password} />
              </div>
            </div>
            <footer>
              <button type="button" className="st-add-btn" onClick={() => setCreatedLogin(null)}>Done</button>
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
