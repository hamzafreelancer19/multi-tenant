import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Edit,
  Eye,
  Loader2,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getNotices, createNotice, updateNotice, deleteNotice } from "../api/noticesApi";
import { getClasses } from "../api/classesApi";
import { getStudents } from "../api/studentsApi";
import { useTenant } from "../context/TenantContext";
import { getRole } from "../store/authStore";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Notices.css";

const CATEGORIES = ["General", "Holiday", "Exam", "Fee", "Event", "Emergency"];
const AUDIENCES = ["All", "Students", "Teachers", "Parents", "Class"];
const PRIORITIES = ["Normal", "Important", "Urgent"];

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function classLabel(c) {
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function noticeStatus(n) {
  if (n.status) return n.status;
  if (n.expires_at && n.expires_at < new Date().toISOString().slice(0, 10)) return "Expired";
  return n.is_active ? "Active" : "Archived";
}

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "General",
  audience: "All",
  class_name: "",
  priority: "Normal",
  expires_at: "",
  is_active: true,
  is_pinned: false,
};

export default function Notices() {
  const tenant = useTenant();
  const role = getRole();
  const canManage = role === "admin" || role === "teacher";
  const [notices, setNotices] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [category, setCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map(classLabel);
    const fromStudents = students.map((s) => s.class_name);
    return unique([...fromApi, ...fromStudents]);
  }, [schoolClasses, students]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [noticeRes, classRes, studentRes] = await Promise.all([
        getNotices(),
        getClasses().catch(() => ({ data: [] })),
        getStudents().catch(() => ({ data: [] })),
      ]);
      setNotices(Array.isArray(noticeRes.data) ? noticeRes.data : []);
      setSchoolClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
    } catch (err) {
      console.error("Failed to load notices:", err);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const setField = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (n) => {
    setFormData({
      title: n.title || "",
      content: n.content || "",
      category: n.category || "General",
      audience: n.audience || "All",
      class_name: n.class_name || "",
      priority: n.priority || "Normal",
      expires_at: n.expires_at || "",
      is_active: n.is_active !== false,
      is_pinned: !!n.is_pinned,
    });
    setEditingId(n.id);
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
    if (!formData.title.trim() || !formData.content.trim()) return alert("Title and content are required");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null,
        class_name: formData.audience === "Class" ? formData.class_name : "",
      };
      if (editingId) await updateNotice(editingId, payload);
      else await createNotice(payload);
      closeModal();
      await fetchAll();
    } catch {
      alert("Could not save notice.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteNotice(id);
      setViewing(null);
      await fetchAll();
    } catch {
      alert("Could not delete notice.");
    }
  };

  const togglePin = async (n) => {
    try {
      await updateNotice(n.id, { is_pinned: !n.is_pinned });
      await fetchAll();
    } catch {
      alert("Could not update pin.");
    }
  };

  const filtered = notices.filter((n) => {
    const q = search.toLowerCase().trim();
    const blob = [n.title, n.content, n.category, n.audience, n.class_name, n.posted_by].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const st = noticeStatus(n);
    const matchTab = tab === "All" || st === tab || (tab === "Pinned" && n.is_pinned);
    const matchCat = category === "All" || n.category === category;
    return matchSearch && matchTab && matchCat;
  });

  const stats = {
    total: notices.length,
    active: notices.filter((n) => noticeStatus(n) === "Active").length,
    pinned: notices.filter((n) => n.is_pinned).length,
    urgent: notices.filter((n) => n.priority === "Urgent" && noticeStatus(n) === "Active").length,
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Communication</p>
          <h1>Notice board</h1>
          <p>
            {canManage
              ? `Published notices also appear on the ${tenant.schoolName || "school"} website.`
              : `School notices for ${tenant.schoolName || "your school"}.`}
          </p>
        </div>
        {canManage && (
          <div className="dash-hero-meta">
            <button type="button" className="st-add-btn" onClick={openAdd}>
              <Plus size={16} /> Post notice
            </button>
          </div>
        )}
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => setTab("All")}>
          <span>Total</span>
          <strong>{loading ? "—" : stats.total}</strong>
          <small>notices</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setTab("Active")}>
          <span>Active</span>
          <strong>{loading ? "—" : stats.active}</strong>
          <small>published</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setTab("Pinned")}>
          <span>Pinned</span>
          <strong>{loading ? "—" : stats.pinned}</strong>
          <small>on top</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => setTab("Active")}>
          <span>Urgent</span>
          <strong>{loading ? "—" : stats.urgent}</strong>
          <small>need attention</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search title or message…"
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
          {["All", "Active", "Archived", "Expired", "Pinned"].map((f) => (
            <button key={f} type="button" className={tab === f ? "is-on" : ""} onClick={() => setTab(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="st-classes">
        <button type="button" className={category === "All" ? "is-on" : ""} onClick={() => setCategory("All")}>
          All types
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={category === c ? "is-on" : ""} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading notices…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <Bell size={36} />
            <p>{notices.length ? "No notices match these filters." : "No notices yet. Post the first announcement."}</p>
            {canManage && !notices.length && <button type="button" onClick={openAdd}>Post notice</button>}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Notice</th>
                  <th>Audience</th>
                  <th>Priority</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => {
                  const st = noticeStatus(n);
                  return (
                    <tr key={n.id}>
                      <td>
                        <button type="button" className="st-person" onClick={() => setViewing(n)}>
                          <span>{(n.title?.[0] || "N").toUpperCase()}</span>
                          <div>
                            <b>{n.title}</b>
                            <small>
                              {n.is_pinned ? "Pinned · " : ""}
                              {n.category || "General"}
                              {n.class_name ? ` · ${n.class_name}` : ""}
                            </small>
                          </div>
                        </button>
                      </td>
                      <td>{n.audience === "Class" ? (n.class_name || "Class") : (n.audience || "All")}</td>
                      <td>
                        <span className={`st-badge ${n.priority === "Urgent" ? "is-warn" : n.priority === "Important" ? "is-off" : "is-on"}`}>
                          {n.priority || "Normal"}
                        </span>
                      </td>
                      <td>{formatDate(n.created_at)}</td>
                      <td>
                        <span className={`st-badge ${st === "Active" ? "is-on" : "is-off"}`}>{st}</span>
                      </td>
                      <td>
                        <div className="st-actions">
                          <button type="button" title="View" onClick={() => setViewing(n)}><Eye size={15} /></button>
                          {canManage && (
                            <>
                              <button type="button" title={n.is_pinned ? "Unpin" : "Pin"} onClick={() => togglePin(n)}>
                                <Pin size={15} />
                              </button>
                              <button type="button" title="Edit" onClick={() => openEdit(n)}><Edit size={15} /></button>
                              <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(n.id, n.title)}>
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

      <p className="st-count">Showing {filtered.length} of {notices.length} notices</p>

      {showModal && (
        <AppModal onClose={closeModal}>
          <form className="st-modal" onSubmit={handleSave}>
            <header>
              <div>
                <p>Announcement</p>
                <h2>{editingId ? "Edit notice" : "Post notice"}</h2>
              </div>
              <button type="button" onClick={closeModal}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Details</p>
              <div className="st-grid">
                <label className="st-span-2">
                  Title *
                  <input required value={formData.title} onChange={setField("title")} placeholder="e.g. School closed tomorrow" />
                </label>
                <label>
                  Category
                  <select value={formData.category} onChange={setField("category")}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  Priority
                  <select value={formData.priority} onChange={setField("priority")}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label>
                  Audience
                  <select value={formData.audience} onChange={setField("audience")}>
                    {AUDIENCES.map((a) => <option key={a} value={a}>{a === "All" ? "Everyone" : a === "Class" ? "Specific class" : a}</option>)}
                  </select>
                </label>
                {formData.audience === "Class" && (
                  <label>
                    Class
                    <select value={formData.class_name} onChange={setField("class_name")}>
                      <option value="">Select class</option>
                      {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                )}
                <label>
                  Expires on
                  <input type="date" value={formData.expires_at} onChange={setField("expires_at")} />
                </label>
                <label className="st-span-2">
                  Message *
                  <textarea required rows={5} value={formData.content} onChange={setField("content")} placeholder="Write the announcement…" />
                </label>
                <label className="nt-check">
                  <input type="checkbox" checked={formData.is_active} onChange={setField("is_active")} />
                  Publish on school website
                </label>
                <label className="nt-check">
                  <input type="checkbox" checked={formData.is_pinned} onChange={setField("is_pinned")} />
                  Pin to top
                </label>
                {formData.audience === "Teachers" ? (
                  <p className="st-span-2" style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                    Teacher-only notices stay on the dashboard, not the school website.
                  </p>
                ) : formData.is_active ? (
                  <p className="st-span-2" style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                    This will appear on the school website until it expires.
                  </p>
                ) : null}
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Publish"}
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
                <p>{viewing.category} · {viewing.priority}</p>
                <h2>{viewing.title}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="st-view-grid">
                <ViewRow label="Audience" value={viewing.audience === "Class" ? viewing.class_name : viewing.audience} />
                <ViewRow label="Status" value={noticeStatus(viewing)} />
                <ViewRow label="Posted" value={formatDate(viewing.created_at)} />
                <ViewRow label="Expires" value={viewing.expires_at ? formatDate(viewing.expires_at) : "No expiry"} />
                <ViewRow label="Posted by" value={viewing.posted_by} />
              </div>
              <p className="st-section">Message</p>
              <p className="nt-body">{viewing.content}</p>
            </div>
            <footer>
              {canManage ? (
                <>
                  <button type="button" className="st-ghost is-danger" onClick={() => handleDelete(viewing.id, viewing.title)}>Delete</button>
                  <button type="button" className="st-add-btn" onClick={() => openEdit(viewing)}>Edit notice</button>
                </>
              ) : (
                <button type="button" className="st-ghost" onClick={() => setViewing(null)}>Close</button>
              )}
            </footer>
          </div>
        </AppModal>
      )}
    </div>
  );
}

function ViewRow({ label, value }) {
  return (
    <div>
      <small>{label}</small>
      <b>{value || "—"}</b>
    </div>
  );
}
