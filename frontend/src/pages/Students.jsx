import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Edit,
  Eye,
  Filter,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { getStudents, createStudent, deleteStudent, updateStudent, setParentLogin } from "../api/studentsApi";
import { getFees } from "../api/feesApi";
import { getClasses } from "../api/classesApi";
import { useTenant } from "../context/TenantContext";
import { getRole } from "../store/authStore";
import { isTeacherRole, mergeClassOptions } from "../utils/classOptions";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";

const FALLBACK_CLASSES = [
  "Nursery", "KG-I", "KG-II",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "First Year", "Second Year",
];

const EMPTY_FORM = {
  name: "",
  class_name: "",
  gender: "",
  date_of_birth: "",
  bform_cnic: "",
  previous_school: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  father_name: "",
  father_phone: "",
  father_cnic: "",
  father_occupation: "",
  mother_name: "",
  mother_phone: "",
  emergency_phone: "",
  notes: "",
  status: "Active",
};

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function contactPhone(s) {
  return s?.father_phone || s?.phone || s?.mother_phone || s?.emergency_phone || "";
}

function feeState(student, fees) {
  const rows = (fees || []).filter((f) => f.student === student.id);
  const hasPaid = rows.some((f) => f.status === "Paid");
  const isPending = rows.some((f) => f.status === "Pending" || f.status === "Overdue");
  return hasPaid && !isPending ? "Paid" : "Unpaid";
}

function formFromStudent(s) {
  return {
    name: s.name || "",
    class_name: s.class_name || "",
    gender: s.gender || "",
    date_of_birth: s.date_of_birth || "",
    bform_cnic: s.bform_cnic || "",
    previous_school: s.previous_school || "",
    email: s.email || "",
    phone: s.phone || "",
    address: s.address || "",
    city: s.city || "",
    father_name: s.father_name || "",
    father_phone: s.father_phone || "",
    father_cnic: s.father_cnic || "",
    father_occupation: s.father_occupation || "",
    mother_name: s.mother_name || "",
    mother_phone: s.mother_phone || "",
    emergency_phone: s.emergency_phone || "",
    notes: s.notes || "",
    status: s.status || "Active",
  };
}

function sendFeeReminder(s) {
  const phone = contactPhone(s);
  if (!phone) return;
  const msg = encodeURIComponent(
    `Dear Parent,\nThis is a gentle reminder that the school fee for your child, ${s.name}, is currently pending. Kindly submit the dues by the 10th of this month to avoid any inconvenience.\n\nThank you!`
  );
  window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
}

export default function Students() {
  const tenant = useTenant();
  const location = useLocation();
  const canManage = getRole() === "admin";
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedClass, setSelectedClass] = useState(location.state?.className || "All");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingRoll, setEditingRoll] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [createdLogin, setCreatedLogin] = useState(null);

  const landingClasses = (tenant.landing?.classes || []).map((c) => c.label || c.name).filter(Boolean);

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map((c) => (c.section ? `${c.name} - ${c.section}` : c.name));
    const fromStudents = students.map((s) => s.class_name);
    return mergeClassOptions(
      [fromApi, isTeacherRole() ? [] : landingClasses, fromStudents],
      FALLBACK_CLASSES
    );
  }, [schoolClasses, landingClasses, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [res, feesRes, classRes] = await Promise.all([
        getStudents(),
        getFees().catch(() => ({ data: [] })),
        getClasses().catch(() => ({ data: [] })),
      ]);
      setStudents(Array.isArray(res.data) ? res.data : []);
      setFees(Array.isArray(feesRes.data) ? feesRes.data : []);
      setSchoolClasses(Array.isArray(classRes.data) ? classRes.data : []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = Array.isArray(students)
    ? students.filter((s) => {
        const q = search.toLowerCase().trim();
        const blob = [
          s.name, s.roll_no, s.class_name, s.email, s.phone, s.gender,
          s.father_name, s.father_phone, s.mother_name, s.city, s.bform_cnic,
        ].join(" ").toLowerCase();
        const matchSearch = !q || blob.includes(q);
        const matchStatus = filterStatus === "All" || (s.status || "Active") === filterStatus;
        const matchClass = selectedClass === "All" || s.class_name === selectedClass;
        return matchSearch && matchStatus && matchClass;
      })
    : [];

  const stats = {
    total: students.length,
    active: students.filter((s) => (s.status || "Active") === "Active").length,
    inactive: students.filter((s) => s.status === "Inactive").length,
    unpaid: students.filter((s) => feeState(s, fees) === "Unpaid").length,
  };

  const setField = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, class_name: classOptions[0] || "" });
    setEditingId(null);
    setEditingRoll("");
    setShowModal(true);
  };

  const openEdit = (s) => {
    setFormData(formFromStudent(s));
    setEditingId(s.id);
    setEditingRoll(s.roll_no || "");
    setViewing(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setEditingRoll("");
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Name is required");
    if (!formData.class_name) return alert("Class is required");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        email: formData.email || null,
      };
      if (editingId) {
        await updateStudent(editingId, payload);
      } else {
        const res = await createStudent(payload);
        if (res.data?.parent_username || res.data?.student_username || res.data?.student_login) {
          setCreatedLogin({
            name: res.data.name,
            student_username: res.data.student_username || res.data.student_login || "",
            student_password: res.data.student_password || "Student@123",
            parent_username: res.data.parent_username || "",
            parent_password: res.data.parent_password || res.data.parent_username || "",
          });
        }
      }
      closeModal();
      await fetchStudents();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error;
      alert(detail ? `${detail}` : editingId ? "Failed to update student." : "Failed to create student.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      setViewing(null);
      await fetchStudents();
    } catch {
      alert("Failed to delete student");
    }
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Directory</p>
          <h1>Students</h1>
          <p>Full student records, guardian details, and fee reminders for {tenant.schoolName || "your school"}.</p>
        </div>
        <div className="dash-hero-meta">
          {canManage && (
            <button type="button" className="st-add-btn" onClick={openAdd}>
              <Plus size={16} /> Add student
            </button>
          )}
        </div>
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => { setFilterStatus("All"); setSelectedClass("All"); }}>
          <span>Total</span>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>enrolled</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setFilterStatus("Active")}>
          <span>Active</span>
          <strong>{loading ? "—" : stats.active}</strong>
          <small>currently studying</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setFilterStatus("Inactive")}>
          <span>Inactive</span>
          <strong>{loading ? "—" : stats.inactive}</strong>
          <small>left or paused</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => setFilterStatus("All")}>
          <span>Unpaid</span>
          <strong>{loading ? "—" : stats.unpaid}</strong>
          <small>fee reminders</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search name, roll no, parent, phone, city…"
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
            <button
              key={f}
              type="button"
              className={filterStatus === f ? "is-on" : ""}
              onClick={() => setFilterStatus(f)}
            >
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
          <button
            key={c}
            type="button"
            className={selectedClass === c ? "is-on" : ""}
            onClick={() => setSelectedClass(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <Users size={36} />
            <p>
              {search || filterStatus !== "All" || selectedClass !== "All"
                ? "No students match these filters."
                : canManage
                  ? "No students yet. Add the first record."
                  : "No students in your assigned classes yet."}
            </p>
            {!search && filterStatus === "All" && selectedClass === "All" && canManage && (
              <button type="button" onClick={openAdd}>Add student</button>
            )}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Class</th>
                  <th>Guardian</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const unpaid = feeState(s, fees) === "Unpaid";
                  const phone = contactPhone(s);
                  return (
                    <tr key={s.id}>
                      <td>
                        <button type="button" className="st-person" onClick={() => setViewing(s)}>
                          <span>{s.name ? s.name[0].toUpperCase() : "S"}</span>
                          <div>
                            <b>{s.name}</b>
                            <small>
                              {s.parent_username
                                ? `Parent login: ${s.parent_username}`
                                : s.gender || s.email || "Profile"}
                            </small>
                          </div>
                        </button>
                      </td>
                      <td className="st-mono">{s.roll_no || "—"}</td>
                      <td>{s.class_name || "—"}</td>
                      <td>
                        <div className="st-cell-stack">
                          <b>{s.father_name || "—"}</b>
                          {s.city ? <small>{s.city}</small> : null}
                        </div>
                      </td>
                      <td>{phone || "—"}</td>
                      <td>
                        <span className={`st-badge ${s.status === "Inactive" ? "is-off" : "is-on"}`}>
                          {s.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="st-fee">
                          <span className={`st-badge ${unpaid ? "is-warn" : "is-on"}`}>
                            {unpaid ? "Unpaid" : "Paid"}
                          </span>
                          {unpaid && (
                            <button
                              type="button"
                              title={phone ? "WhatsApp reminder" : "No phone number"}
                              disabled={!phone}
                              onClick={() => sendFeeReminder(s)}
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="st-actions">
                          <button type="button" title="View" onClick={() => setViewing(s)}><Eye size={15} /></button>
                          {canManage && (
                            <>
                              <button type="button" title="Edit" onClick={() => openEdit(s)}><Edit size={15} /></button>
                              <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(s.id, s.name)}>
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

      <p className="st-count">Showing {filtered.length} of {students.length} students</p>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
              <div>
                <p>Student record</p>
                <h2>{editingId ? "Edit student" : "Add student"}</h2>
              </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>

            <div className="st-modal-body">
              <p className="st-section">Student details</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Full name *
                  <input required value={formData.name} onChange={setField("name")} placeholder="e.g. Ali Hassan" />
                </label>
                <label>
                  Class *
                  <select required value={formData.class_name} onChange={setField("class_name")}>
                    <option value="">Select class</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
                  B-Form / CNIC
                  <input value={formData.bform_cnic} onChange={setField("bform_cnic")} placeholder="xxxxx-xxxxxxx-x" />
                </label>
                {editingId && (
                  <label>
                    Roll number
                    <input readOnly value={editingRoll || "—"} />
                  </label>
                )}
                <label className={editingId ? "" : "st-span-2"}>
                  Previous school
                  <input value={formData.previous_school} onChange={setField("previous_school")} placeholder="If transferring" />
                </label>
                <label>
                  Student phone
                  <input value={formData.phone} onChange={setField("phone")} placeholder="Optional" />
                </label>
                <label>
                  Email
                  <input type="email" value={formData.email} onChange={setField("email")} placeholder="parent@email.com" />
                </label>
                <label>
                  Status
                  <select value={formData.status} onChange={setField("status")}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <p className="st-section">Parent / guardian</p>
              <div className="st-grid">
                <label>
                  Father / guardian name
                  <input value={formData.father_name} onChange={setField("father_name")} placeholder="Full name" />
                </label>
                <label>
                  Guardian phone
                  <input value={formData.father_phone} onChange={setField("father_phone")} placeholder="03xx xxx xxxx" />
                </label>
                <label>
                  Guardian CNIC
                  <input value={formData.father_cnic} onChange={setField("father_cnic")} placeholder="xxxxx-xxxxxxx-x" />
                </label>
                <label>
                  Occupation
                  <input value={formData.father_occupation} onChange={setField("father_occupation")} placeholder="Job / business" />
                </label>
                <label>
                  Mother’s name
                  <input value={formData.mother_name} onChange={setField("mother_name")} placeholder="Full name" />
                </label>
                <label>
                  Mother’s phone
                  <input value={formData.mother_phone} onChange={setField("mother_phone")} placeholder="03xx xxx xxxx" />
                </label>
                <label>
                  Emergency phone
                  <input value={formData.emergency_phone} onChange={setField("emergency_phone")} placeholder="Optional" />
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

              {!editingId && (
                <p className="st-hint">Student login is roll no @ school name, password Student@123. Parent login is made from the student name — username and password are the same.</p>
              )}
            </div>

            <footer>
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Create student"}
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
                <p>{viewing.roll_no || "Student"}</p>
                <h2>{viewing.name}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="st-view-grid">
                <ViewRow label="Class" value={viewing.class_name} />
                <ViewRow label="Gender" value={viewing.gender} />
                <ViewRow label="Date of birth" value={viewing.date_of_birth} />
                <ViewRow label="B-Form / CNIC" value={viewing.bform_cnic} />
                <ViewRow label="Previous school" value={viewing.previous_school} />
                <ViewRow label="Email" value={viewing.email} />
                <ViewRow label="Student phone" value={viewing.phone} />
                <ViewRow label="Status" value={viewing.status} />
                <ViewRow label="Father / guardian" value={viewing.father_name} />
                <ViewRow label="Guardian phone" value={viewing.father_phone} />
                <ViewRow label="Guardian CNIC" value={viewing.father_cnic} />
                <ViewRow label="Occupation" value={viewing.father_occupation} />
                <ViewRow label="Mother" value={viewing.mother_name} />
                <ViewRow label="Mother’s phone" value={viewing.mother_phone} />
                <ViewRow label="Emergency" value={viewing.emergency_phone} />
                <ViewRow label="City" value={viewing.city} />
                <ViewRow label="Address" value={viewing.address} wide />
                <ViewRow label="Notes" value={viewing.notes} wide />
                <ViewRow label="Student portal username" value={viewing.student_username || "Not created"} wide />
                <ViewRow label="Student portal password" value="Student@123" wide />
                <ViewRow label="Parent portal username" value={viewing.parent_username || "Not created"} wide />
              </div>
            </div>
            <footer>
              {canManage && (
                <>
                  <button type="button" className="st-ghost" onClick={async () => {
                    try {
                      const res = await setParentLogin(viewing.id);
                      setCreatedLogin({
                        name: viewing.name,
                        parent_username: res.data.parent_username,
                        parent_password: res.data.parent_password,
                      });
                      setViewing({ ...viewing, parent_username: res.data.parent_username, has_parent_login: true });
                    } catch {
                      alert("Could not create parent login.");
                    }
                  }}>
                    {viewing.has_parent_login ? "Reset parent login" : "Create parent login"}
                  </button>
                  <button type="button" className="st-ghost is-danger" onClick={() => handleDelete(viewing.id, viewing.name)}>Delete</button>
                  <button type="button" className="st-add-btn" onClick={() => openEdit(viewing)}>Edit record</button>
                </>
              )}
            </footer>
          </div>
        </AppModal>
      )}

      {createdLogin && (
        <AppModal onClose={() => setCreatedLogin(null)}>
          <div className="st-modal st-view">
            <header>
              <div>
                <p>Portal logins</p>
                <h2>Save these details</h2>
              </div>
              <button type="button" onClick={() => setCreatedLogin(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-hint">Give the student login to {createdLogin.name}, and the parent login to the guardian. They both log in on this school website.</p>
              <div className="st-view-grid">
                <ViewRow label="Student username" value={createdLogin.student_username} />
                <ViewRow label="Student password" value={createdLogin.student_password} />
                <ViewRow label="Parent username" value={createdLogin.parent_username} />
                <ViewRow label="Parent password" value={createdLogin.parent_password} />
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
