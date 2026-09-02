import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Ban,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  School as SchoolIcon,
  Search,
  Trash2,
  Undo2,
  X,
  Pencil,
} from "lucide-react";
import {
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  approveSchool,
  rejectSchool,
  approvePlan,
  rejectPlan,
  suspendSchool,
} from "../api/adminApi";
import "./Schools.css";

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

function slugFromName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export default function Schools() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  const schoolLandingPath = (s) => {
    const slug =
      (s.domain || "").split(":")[0].replace(/^www\./i, "").split(".")[0] ||
      (s.code || "").toLowerCase();
    return `/s/${slug}`;
  };

  const fetchSchools = async (isFirst = false) => {
    if (isFirst) setLoading(true);
    try {
      const res = await getSchools();
      setSchools(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (isFirst) setError(apiError(err, "Could not load schools."));
      setSchools([]);
    } finally {
      if (isFirst) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools(true);
    const interval = setInterval(() => fetchSchools(false), 12000);
    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(
    () => ({
      all: schools.length,
      pending: schools.filter((s) => s.status === "Pending").length,
      approved: schools.filter((s) => s.status === "Approved").length,
      suspended: schools.filter((s) => s.status === "Rejected").length,
      plans: schools.filter((s) => s.plan_status === "Pending").length,
    }),
    [schools]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (filter === "pending" && s.status !== "Pending") return false;
      if (filter === "approved" && s.status !== "Approved") return false;
      if (filter === "suspended" && s.status !== "Rejected") return false;
      if (filter === "plans" && s.plan_status !== "Pending") return false;
      if (!q) return true;
      const blob = [s.name, s.code, s.domain, s.landing_contact_email, s.landing_contact_phone, s.plan_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [schools, search, filter]);

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setFormData({
      name: s.name || "",
      code: s.code || "",
      domain: s.domain || "",
      landing_contact_email: s.landing_contact_email || "",
      landing_contact_phone: s.landing_contact_phone || "",
      status: s.status || "Approved",
      ai_api_key: s.ai_api_key || "",
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
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
      const slug = slugFromName(formData.name);
      const payload = {
        ...formData,
        code: formData.code.trim() || slug.toUpperCase(),
        domain: formData.domain.trim() || `${slug}.localhost`,
      };
      if (editingId) await updateSchool(editingId, payload);
      else await createSchool(payload);
      closeModal();
      setMessage(editingId ? "School updated." : "School registered.");
      setTimeout(() => setMessage(""), 3500);
      await fetchSchools();
    } catch (err) {
      setError(apiError(err, "Could not save school. Code and domain must be unique."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      if (action === "approve") await approveSchool(id);
      else if (action === "reject") await rejectSchool(id);
      else if (action === "suspend") await suspendSchool(id);
      else if (action === "approvePlan") await approvePlan(id);
      else if (action === "rejectPlan") await rejectPlan(id);
      await fetchSchools();
      setMessage("Updated.");
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(apiError(err, "Could not update school."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This removes students, teachers, and all school data.`)) return;
    setBusyId(id);
    try {
      await deleteSchool(id);
      await fetchSchools();
    } catch (err) {
      setError(apiError(err, "Could not delete school."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page sch-page">
      <div className="sch-hero">
        <div>
          <p className="sch-kicker">Platform</p>
          <h1>Schools</h1>
          <p>Approve tenants, manage plans, and open each school's public site.</p>
        </div>
        <button className="primary-btn" onClick={openAdd}>
          <Plus size={18} /> Add school
        </button>
      </div>

      <div className="sch-stats">
        {[
          { id: "all", label: "Total", value: counts.all, hint: "All tenants", tone: "navy" },
          { id: "approved", label: "Approved", value: counts.approved, hint: "Live schools", tone: "green" },
          { id: "pending", label: "Pending", value: counts.pending, hint: "Awaiting review", tone: "gold" },
          { id: "plans", label: "Plan review", value: counts.plans, hint: "Subscription requests", tone: "orange" },
        ].map((row) => (
          <button
            key={row.id}
            type="button"
            className={`sch-stat sch-stat-${row.tone} ${filter === row.id ? "is-on" : ""}`}
            onClick={() => setFilter(row.id)}
          >
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <small>{row.hint}</small>
          </button>
        ))}
      </div>

      {error && <div className="sch-alert">{error}</div>}
      {message && <div className="sch-alert is-ok">{message}</div>}

      <div className="sch-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search name, code, domain, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button type="button" className={`sch-pill ${filter === "suspended" ? "is-warn" : ""}`} onClick={() => setFilter(filter === "suspended" ? "all" : "suspended")}>
          Suspended ({counts.suspended})
        </button>
      </div>

      <div className="card table-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 className="spin" size={36} />
            <p style={{ marginTop: 12 }}>Loading schools…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sch-empty">
            <SchoolIcon size={36} />
            <h3>{search || filter !== "all" ? "No matching schools" : "No schools yet"}</h3>
            <p>{search || filter !== "all" ? "Try another search or filter." : "Register the first school to start."}</p>
            {!search && filter === "all" && (
              <button className="primary-btn" style={{ margin: "16px auto 0" }} onClick={openAdd}>
                <Plus size={16} /> Add school
              </button>
            )}
          </div>
        ) : (
          <div className="sch-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="table-row sch-row"
                    title="Open school profile"
                    onClick={() => navigate(`/schools/${s.id}`)}
                  >
                    <td>
                      <Link className="sch-name" to={`/schools/${s.id}`} onClick={(e) => e.stopPropagation()}>
                        {s.logo_url ? (
                          <img src={s.logo_url} alt="" />
                        ) : (
                          <span className="sch-logo">
                            <SchoolIcon size={16} />
                          </span>
                        )}
                        <div>
                          <b>{s.name}</b>
                          <small>{[s.code, s.domain].filter(Boolean).join(" · ") || "No domain yet"}</small>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          s.status === "Approved" ? "badge-active" : s.status === "Pending" ? "badge-warning" : "badge-inactive"
                        }`}
                      >
                        {s.status === "Rejected" ? "Suspended" : s.status}
                      </span>
                    </td>
                    <td>
                      {s.plan_type && s.plan_type !== "None" ? (
                        <div className="sch-plan">
                          <b>
                            {s.plan_type}{" "}
                            <span
                              className={`badge-status ${
                                s.plan_status === "Active" ? "badge-active" : s.plan_status === "Pending" ? "badge-warning" : "badge-inactive"
                              }`}
                            >
                              {s.plan_status}
                            </span>
                          </b>
                          <small style={{ color: "var(--text-muted)" }}>
                            {s.plan_amount ? `Rs ${Number(s.plan_amount).toLocaleString()}` : ""}
                            {s.transaction_id ? ` · ${s.transaction_id}` : ""}
                          </small>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No plan</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {s.landing_contact_email || s.landing_contact_phone || "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                        <Calendar size={14} />
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="sch-actions">
                        <Link className="icon-btn-sm" to={`/schools/${s.id}`} title="Open profile">
                          <Eye size={15} />
                        </Link>
                        {s.status === "Pending" && (
                          <>
                            <button type="button" className="sch-pill is-ok" disabled={busyId === s.id} onClick={() => runAction(s.id, "approve")}>
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button type="button" className="sch-pill is-bad" disabled={busyId === s.id} onClick={() => runAction(s.id, "reject")}>
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}
                        {s.status === "Approved" && (
                          <button
                            type="button"
                            className="sch-pill is-warn"
                            disabled={busyId === s.id}
                            onClick={() => {
                              if (window.confirm(`Suspend "${s.name}"? School users will be disabled.`)) runAction(s.id, "suspend");
                            }}
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        )}
                        {s.status === "Rejected" && (
                          <button type="button" className="sch-pill is-ok" disabled={busyId === s.id} onClick={() => runAction(s.id, "approve")}>
                            <Undo2 size={14} /> Restore
                          </button>
                        )}
                        {s.plan_status === "Pending" && (
                          <>
                            <button type="button" className="sch-pill is-ok" disabled={busyId === s.id} onClick={() => runAction(s.id, "approvePlan")}>
                              Approve plan
                            </button>
                            <button type="button" className="sch-pill is-bad" disabled={busyId === s.id} onClick={() => runAction(s.id, "rejectPlan")}>
                              Reject plan
                            </button>
                          </>
                        )}
                        <button className="icon-btn-sm" title="Open landing page" onClick={() => window.open(schoolLandingPath(s), "_blank")}>
                          <ExternalLink size={15} />
                        </button>
                        <button className="icon-btn-sm" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn-danger" title="Delete" onClick={() => handleDelete(s.id, s.name)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Edit school" : "Register school"}</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="input-group">
                    <label className="input-label">School name *</label>
                    <input
                      required
                      className="input-field"
                      placeholder="e.g. Greenway International"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">School code</label>
                    <input
                      className="input-field"
                      placeholder="Auto from name if empty"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Domain</label>
                    <input
                      className="input-field"
                      placeholder="e.g. greenway.localhost"
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
                      placeholder="gsk_…"
                      autoComplete="off"
                      value={formData.ai_api_key || ""}
                      onChange={(e) => setFormData({ ...formData, ai_api_key: e.target.value })}
                    />
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                      Optional. School admins cannot see this. Leave blank to use the platform key.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Register school"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
