import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Phone,
  School as SchoolIcon,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  getSchool,
  updateSchool,
  deleteSchool,
  approveSchool,
  rejectSchool,
  approvePlan,
  rejectPlan,
  suspendSchool,
} from "../api/adminApi";
import "./Schools.css";
import "./SchoolProfile.css";

const emptyForm = {
  name: "",
  code: "",
  domain: "",
  landing_contact_email: "",
  landing_contact_phone: "",
  status: "Approved",
  ai_api_key: "",
};

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || fallback;
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function statusClass(status) {
  if (status === "Approved" || status === "Active") return "badge-active";
  if (status === "Pending") return "badge-warning";
  return "badge-inactive";
}

function roleLabel(role) {
  const map = {
    admin: "Admin",
    teacher: "Teacher",
    parent: "Parent",
    accountant: "Accountant",
    student: "Student",
  };
  return map[role] || role || "—";
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

function enrollmentLabel(status) {
  const map = {
    Pending: "Class test",
    PendingIncharge: "Class test",
    PendingAdmin: "Admin approval",
    Accepted: "Registered",
    Rejected: "Rejected",
  };
  return map[status] || status;
}

function userDisplayName(u) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return name || u.username;
}

export default function SchoolProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [userRole, setUserRole] = useState("all");

  const landingPath = (s) => {
    const slug =
      (s?.domain || "").split(":")[0].replace(/^www\./i, "").split(".")[0] ||
      (s?.code || "").toLowerCase();
    return `/s/${slug}`;
  };

  const load = async () => {
    try {
      const res = await getSchool(id);
      setSchool(res.data);
      setError("");
    } catch (err) {
      setSchool(null);
      setError(apiError(err, "Could not load this school."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [id]);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const runAction = async (action) => {
    setBusy(true);
    setError("");
    try {
      if (action === "approve") await approveSchool(id);
      else if (action === "reject") await rejectSchool(id);
      else if (action === "suspend") await suspendSchool(id);
      else if (action === "approvePlan") await approvePlan(id);
      else if (action === "rejectPlan") await rejectPlan(id);
      await load();
      flash("Updated.");
    } catch (err) {
      setError(apiError(err, "Could not update school."));
    } finally {
      setBusy(false);
    }
  };

  const openEdit = () => {
    if (!school) return;
    setFormData({
      name: school.name || "",
      code: school.code || "",
      domain: school.domain || "",
      landing_contact_email: school.landing_contact_email || "",
      landing_contact_phone: school.landing_contact_phone || "",
      status: school.status || "Approved",
      ai_api_key: "",
    });
    setShowEdit(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("School name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...formData };
      if (!payload.ai_api_key) delete payload.ai_api_key;
      await updateSchool(id, payload);
      setShowEdit(false);
      await load();
      flash("School updated.");
    } catch (err) {
      setError(apiError(err, "Could not save school."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${school.name}"? This removes students, teachers, and all school data.`)) return;
    setBusy(true);
    try {
      await deleteSchool(id);
      navigate("/schools");
    } catch (err) {
      setError(apiError(err, "Could not delete school."));
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page sp-page">
        <div className="sp-empty">
          <Loader2 className="spin" size={36} />
          <p>Loading school profile…</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="page sp-page">
        <button type="button" className="sp-back" onClick={() => navigate("/schools")}>
          <ArrowLeft size={16} /> Back to schools
        </button>
        <div className="sch-alert">{error || "School not found."}</div>
      </div>
    );
  }

  const stats = school.stats || {};
  const users = Array.isArray(school.users) ? school.users : [];
  const features = asList(school.landing_features);
  const programs = asList(school.landing_programs);
  const testimonials = asList(school.landing_testimonials);
  const languages = asList(school.landing_languages);
  const enrollmentsByStatus = stats.enrollments_by_status || {};
  const statusLabel = school.status === "Rejected" ? "Suspended" : school.status;

  return (
    <div className="page sp-page">
      <button type="button" className="sp-back" onClick={() => navigate("/schools")}>
        <ArrowLeft size={16} /> Back to schools
      </button>

      {error && <div className="sch-alert">{error}</div>}
      {message && <div className="sch-alert is-ok">{message}</div>}

      <div className="sp-hero">
        <div className="sp-hero-main">
          {school.logo_url ? (
            <img className="sp-logo" src={school.logo_url} alt="" />
          ) : (
            <span className="sp-logo is-empty">
              <SchoolIcon size={28} />
            </span>
          )}
          <div>
            <p className="sch-kicker">School profile</p>
            <h1>{school.name}</h1>
            <p className="sp-meta">
              {[school.code, school.domain].filter(Boolean).join(" · ") || "No domain yet"}
            </p>
            <div className="sp-badges">
              <span className={`badge-status ${statusClass(school.status)}`}>{statusLabel}</span>
              {school.plan_type && school.plan_type !== "None" ? (
                <span className={`badge-status ${statusClass(school.plan_status)}`}>
                  {school.plan_type} · {school.plan_status}
                </span>
              ) : (
                <span className="badge-status badge-inactive">No plan</span>
              )}
            </div>
          </div>
        </div>
        <div className="sp-hero-actions">
          {school.status === "Pending" && (
            <>
              <button type="button" className="sch-pill is-ok" disabled={busy} onClick={() => runAction("approve")}>
                <CheckCircle2 size={14} /> Approve
              </button>
              <button type="button" className="sch-pill is-bad" disabled={busy} onClick={() => runAction("reject")}>
                <X size={14} /> Reject
              </button>
            </>
          )}
          {school.status === "Approved" && (
            <button
              type="button"
              className="sch-pill is-warn"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Suspend "${school.name}"? School users will be disabled.`)) runAction("suspend");
              }}
            >
              <Ban size={14} /> Suspend
            </button>
          )}
          {school.status === "Rejected" && (
            <button type="button" className="sch-pill is-ok" disabled={busy} onClick={() => runAction("approve")}>
              <Undo2 size={14} /> Restore
            </button>
          )}
          {school.plan_status === "Pending" && (
            <>
              <button type="button" className="sch-pill is-ok" disabled={busy} onClick={() => runAction("approvePlan")}>
                Approve plan
              </button>
              <button type="button" className="sch-pill is-bad" disabled={busy} onClick={() => runAction("rejectPlan")}>
                Reject plan
              </button>
            </>
          )}
          <button type="button" className="secondary-btn" onClick={() => window.open(landingPath(school), "_blank")}>
            <ExternalLink size={15} /> Landing
          </button>
          <button type="button" className="secondary-btn" onClick={openEdit}>
            <Pencil size={15} /> Edit
          </button>
          <button type="button" className="icon-btn-danger" title="Delete" onClick={handleDelete} disabled={busy}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="sp-stats">
        {[
          { label: "Students", value: stats.students ?? 0 },
          { label: "Teachers", value: stats.teachers ?? 0 },
          { label: "Classes", value: stats.classes ?? 0 },
          { label: "Parents", value: stats.parents ?? 0 },
          { label: "Admins", value: stats.admins ?? 0 },
          { label: "Admissions", value: stats.enrollments ?? 0 },
        ].map((row) => (
          <div key={row.label} className="sp-stat">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>

      <div className="sp-grid">
        <section className="card sp-card">
          <h3>Identity</h3>
          <dl className="sp-dl">
            <div><dt>Name</dt><dd>{school.name}</dd></div>
            <div><dt>Code</dt><dd>{school.code || "—"}</dd></div>
            <div>
              <dt>Domain</dt>
              <dd>
                <Globe size={14} /> {school.domain || "—"}
              </dd>
            </div>
            <div>
              <dt>Database</dt>
              <dd>
                <Database size={14} /> {school.database_name || "—"}
              </dd>
            </div>
            <div>
              <dt>Registered</dt>
              <dd>
                <Calendar size={14} /> {formatDate(school.created_at, true)}
              </dd>
            </div>
            <div><dt>Users</dt><dd>{stats.users ?? 0} accounts</dd></div>
          </dl>
        </section>

        <section className="card sp-card">
          <h3>Contact</h3>
          <dl className="sp-dl">
            <div>
              <dt>Email</dt>
              <dd>
                <Mail size={14} /> {school.landing_contact_email || "—"}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <Phone size={14} /> {school.landing_contact_phone || "—"}
              </dd>
            </div>
            <div>
              <dt>Public site</dt>
              <dd>
                <a href={landingPath(school)} target="_blank" rel="noreferrer">
                  {landingPath(school)}
                </a>
              </dd>
            </div>
            <div>
              <dt>AI key</dt>
              <dd>
                <KeyRound size={14} />{" "}
                {school.ai_api_key_set ? school.ai_api_key || "Set" : "Using platform key"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card sp-card">
          <h3>Subscription</h3>
          <dl className="sp-dl">
            <div><dt>Plan</dt><dd>{school.plan_type && school.plan_type !== "None" ? school.plan_type : "None"}</dd></div>
            <div><dt>Status</dt><dd>{school.plan_status || "Inactive"}</dd></div>
            <div>
              <dt>Amount</dt>
              <dd>{school.plan_amount ? `Rs ${Number(school.plan_amount).toLocaleString()}` : "—"}</dd>
            </div>
            <div><dt>Transaction</dt><dd>{school.transaction_id || "—"}</dd></div>
            <div><dt>Start</dt><dd>{formatDate(school.plan_start_date)}</dd></div>
            <div><dt>Expiry</dt><dd>{formatDate(school.plan_expiry_date)}</dd></div>
          </dl>
        </section>

        <section className="card sp-card">
          <h3>Branding</h3>
          <div className="sp-colors">
            {[
              ["Landing primary", school.landing_primary_color],
              ["Landing ink", school.landing_secondary_color],
              ["Dashboard primary", school.dashboard_primary_color],
              ["Dashboard navy", school.dashboard_secondary_color],
              ["Dashboard accent", school.dashboard_accent_color],
            ].map(([label, color]) => (
              <div key={label} className="sp-swatch">
                <span style={{ background: color || "#ddd" }} />
                <div>
                  <b>{label}</b>
                  <small>{color || "—"}</small>
                </div>
              </div>
            ))}
          </div>
          <dl className="sp-dl" style={{ marginTop: 16 }}>
            <div><dt>Logo</dt><dd>{school.logo_url ? "Uploaded" : "Not set"}</dd></div>
            <div><dt>Favicon</dt><dd>{school.favicon_url ? "Uploaded" : "Not set"}</dd></div>
          </dl>
        </section>

        <section className="card sp-card sp-span">
          <h3>Landing page</h3>
          <dl className="sp-dl">
            <div><dt>Hero title</dt><dd>{school.landing_hero_title || "—"}</dd></div>
            <div className="sp-full">
              <dt>Hero subtitle</dt>
              <dd>{school.landing_hero_subtitle || "—"}</dd>
            </div>
            <div className="sp-full">
              <dt>About</dt>
              <dd>{school.landing_about_text || "—"}</dd>
            </div>
            <div><dt>Show stats</dt><dd>{school.landing_show_stats ? "Yes" : "No"}</dd></div>
            <div><dt>Features</dt><dd>{features.length}</dd></div>
            <div><dt>Programs</dt><dd>{programs.length}</dd></div>
            <div><dt>Testimonials</dt><dd>{testimonials.length}</dd></div>
            <div>
              <dt>Languages</dt>
              <dd>{languages.length ? languages.map((lang) => lang.name || lang).join(", ") : "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="card sp-card">
          <h3>Admissions</h3>
          {Object.keys(enrollmentsByStatus).length === 0 ? (
            <p className="sp-muted">No admission applications yet.</p>
          ) : (
            <dl className="sp-dl">
              {Object.entries(enrollmentsByStatus).map(([status, count]) => (
                <div key={status}>
                  <dt>{enrollmentLabel(status)}</dt>
                  <dd>{count}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      <section className="card table-card">
        <div className="sp-table-head">
          <div>
            <h3>School users</h3>
            <p className="sp-muted">Teachers, parents, students, and staff of this school.</p>
          </div>
          <small>{stats.users ?? users.length} accounts</small>
        </div>
        <div className="sp-role-filters">
          {[
            { id: "all", label: "All", count: users.length },
            { id: "admin", label: "Admins", count: users.filter((u) => u.role === "admin").length },
            { id: "teacher", label: "Teachers", count: users.filter((u) => u.role === "teacher").length },
            { id: "parent", label: "Parents", count: users.filter((u) => u.role === "parent").length },
            { id: "accountant", label: "Accountants", count: users.filter((u) => u.role === "accountant").length },
            { id: "student", label: "Students", count: users.filter((u) => u.role === "student").length },
          ].map((row) => (
            <button
              key={row.id}
              type="button"
              className={`sch-pill ${userRole === row.id ? "is-ok" : ""}`}
              onClick={() => setUserRole(row.id)}
            >
              {row.label} ({row.count})
            </button>
          ))}
        </div>
        {users.length === 0 ? (
          <p className="sp-muted" style={{ padding: "8px 4px 16px" }}>No users linked to this school yet.</p>
        ) : (
          <div className="sch-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last login</th>
                </tr>
              </thead>
              <tbody>
                {(userRole === "all" ? users : users.filter((u) => u.role === userRole)).map((u) => (
                  <tr key={u.id} className="table-row">
                    <td><b>{userDisplayName(u)}</b></td>
                    <td style={{ color: "var(--text-secondary)" }}>{u.username}</td>
                    <td>{roleLabel(u.role)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{u.email || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{u.phone || "—"}</td>
                    <td>
                      <span className={`badge-status ${u.is_active ? "badge-active" : "badge-inactive"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatDate(u.date_joined)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatDate(u.last_login, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showEdit && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit school</h2>
              <button className="close-btn" onClick={() => setShowEdit(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="input-group">
                    <label className="input-label">School name *</label>
                    <input
                      required
                      className="input-field"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">School code</label>
                    <input
                      className="input-field"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Domain</label>
                    <input
                      className="input-field"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Contact email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={formData.landing_contact_email}
                      onChange={(e) => setFormData({ ...formData, landing_contact_email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Contact phone</label>
                    <input
                      className="input-field"
                      value={formData.landing_contact_phone}
                      onChange={(e) => setFormData({ ...formData, landing_contact_phone: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Status</label>
                    <select
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Suspended</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Groq API key</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Leave blank to keep current"
                      autoComplete="off"
                      value={formData.ai_api_key || ""}
                      onChange={(e) => setFormData({ ...formData, ai_api_key: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
