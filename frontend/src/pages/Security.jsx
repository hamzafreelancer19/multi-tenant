import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  School,
  Search,
  Unlock,
  UserX,
  X,
} from "lucide-react";
import {
  getSchools,
  approveSchool,
  rejectSchool,
  suspendSchool,
  approvePlan,
  rejectPlan,
  getPlatformUsers,
  updatePlatformUser,
} from "../api/adminApi";
import { getActivities } from "../api/dashboardApi";
import "./Schools.css";
import "./Security.css";

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  if (data.is_active) return Array.isArray(data.is_active) ? data.is_active[0] : data.is_active;
  const first = Object.values(data).flat()?.[0];
  return first || fallback;
}

function formatWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  if (status === "Rejected") return "Suspended";
  return status || "—";
}

export default function Security() {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async (isFirst = false) => {
    if (isFirst) setLoading(true);
    try {
      const [sRes, uRes, aRes] = await Promise.all([
        getSchools(),
        getPlatformUsers(),
        getActivities({ days: 30 }),
      ]);
      const schoolRows = Array.isArray(sRes.data) ? sRes.data : [];
      const userRows = (Array.isArray(uRes.data) ? uRes.data : []).filter((u) => u.role === "admin" && u.school);
      const actRows = Array.isArray(aRes.data) ? aRes.data : [];
      setSchools(schoolRows);
      setUsers(userRows);
      setActivities(actRows);
      if (isFirst) setError("");
    } catch (err) {
      if (isFirst) setError(apiError(err, "Could not load security data."));
    } finally {
      if (isFirst) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const counts = useMemo(
    () => ({
      live: schools.filter((s) => s.status === "Approved").length,
      pending: schools.filter((s) => s.status === "Pending").length,
      suspended: schools.filter((s) => s.status === "Rejected").length,
      plans: schools.filter((s) => s.plan_status === "Pending").length,
      disabled: users.filter((u) => !u.is_active).length,
    }),
    [schools, users]
  );

  const q = search.trim().toLowerCase();
  const matchSchool = (s) =>
    !q || [s.name, s.code, s.domain].filter(Boolean).join(" ").toLowerCase().includes(q);
  const matchUser = (u) =>
    !q || [u.username, u.email, u.school_name].filter(Boolean).join(" ").toLowerCase().includes(q);

  const accessSchools = schools.filter((s) => {
    if (filter === "pending") return false;
    if (filter === "plans") return false;
    if (filter === "disabled") return false;
    if (filter === "live" && s.status !== "Approved") return false;
    if (filter === "suspended" && s.status !== "Rejected") return false;
    if (s.status === "Pending") return false;
    return matchSchool(s);
  });

  const pendingSchools = schools.filter((s) => s.status === "Pending" && matchSchool(s));
  const pendingPlans = schools.filter((s) => s.plan_status === "Pending" && matchSchool(s));
  const shownUsers = users.filter((u) => {
    if (filter === "disabled" && u.is_active) return false;
    if (filter === "live" || filter === "pending" || filter === "suspended" || filter === "plans") return matchUser(u);
    return matchUser(u);
  });

  const run = async (key, fn, okMessage) => {
    setBusyKey(key);
    setError("");
    try {
      await fn();
      await load(false);
      flash(okMessage);
    } catch (err) {
      setError(apiError(err, "Could not complete that action."));
    } finally {
      setBusyKey("");
    }
  };

  if (loading) {
    return (
      <div className="page sec-page">
        <div className="sp-empty">
          <Loader2 className="spin" size={36} />
          <p>Loading security…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page sec-page">
      <div className="sch-hero">
        <div>
          <p className="sch-kicker">Platform</p>
          <h1>Security</h1>
          <p>Approve tenants, suspend access, lock school admins, and review the audit log.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={() => load(true)} disabled={!!busyKey}>
          <RefreshCw size={16} className={busyKey ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="sch-stats sec-stats">
        {[
          { id: "all", label: "Live schools", value: counts.live, hint: "Approved tenants", tone: "green" },
          { id: "pending", label: "Pending", value: counts.pending, hint: "Awaiting approval", tone: "gold" },
          { id: "suspended", label: "Suspended", value: counts.suspended, hint: "Access blocked", tone: "navy" },
          { id: "plans", label: "Plan review", value: counts.plans, hint: "Subscription requests", tone: "orange" },
          { id: "disabled", label: "Disabled admins", value: counts.disabled, hint: "Locked accounts", tone: "navy" },
        ].map((row) => (
          <button
            key={row.id}
            type="button"
            className={`sch-stat sch-stat-${row.tone} ${filter === row.id ? "is-on" : ""}`}
            onClick={() => setFilter(filter === row.id ? "all" : row.id)}
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
            placeholder="Search school or admin"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="sec-grid">
        <section className="card sec-panel">
          <header className="sec-head">
            <h3><School size={18} /> School access</h3>
            <small>{accessSchools.length}</small>
          </header>
          {accessSchools.length === 0 ? (
            <p className="sec-empty">No schools in this view.</p>
          ) : (
            <ul className="sec-list">
              {accessSchools.map((s) => (
                <li key={s.id}>
                  <Link to={`/schools/${s.id}`} className="sec-name">
                    <strong>{s.name}</strong>
                    <span>
                      {statusLabel(s.status)} · {s.plan_type && s.plan_type !== "None" ? `${s.plan_type} / ${s.plan_status}` : "No plan"}
                    </span>
                  </Link>
                  {s.status === "Approved" ? (
                    <button
                      type="button"
                      className="sch-pill is-warn"
                      disabled={busyKey === `s-${s.id}`}
                      onClick={() => {
                        if (window.confirm(`Suspend "${s.name}"? School users will be disabled.`)) {
                          run(`s-${s.id}`, () => suspendSchool(s.id), `${s.name} suspended.`);
                        }
                      }}
                    >
                      {busyKey === `s-${s.id}` ? <Loader2 size={14} className="spin" /> : <Ban size={14} />} Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sch-pill is-ok"
                      disabled={busyKey === `s-${s.id}`}
                      onClick={() => {
                        if (window.confirm(`Restore "${s.name}" and re-enable its users?`)) {
                          run(`s-${s.id}`, () => approveSchool(s.id), `${s.name} restored.`);
                        }
                      }}
                    >
                      {busyKey === `s-${s.id}` ? <Loader2 size={14} className="spin" /> : <Unlock size={14} />} Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card sec-panel">
          <header className="sec-head">
            <h3><UserX size={18} /> School admins</h3>
            <small>{shownUsers.length}</small>
          </header>
          {shownUsers.length === 0 ? (
            <p className="sec-empty">No school admins in this view.</p>
          ) : (
            <ul className="sec-list">
              {shownUsers.map((u) => (
                <li key={u.id}>
                  <div className="sec-name">
                    <strong>{u.username}</strong>
                    <span>
                      {u.school_name || "No school"} · {u.is_active ? "Active" : "Disabled"}
                      {u.last_login ? ` · last login ${formatWhen(u.last_login)}` : " · never logged in"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={u.is_active ? "sch-pill is-warn" : "sch-pill is-ok"}
                    disabled={busyKey === `u-${u.id}`}
                    title={u.is_active ? "Disable this admin" : "Enable this admin"}
                    onClick={() => {
                      const next = !u.is_active;
                      const prompt = next
                        ? `Enable "${u.username}"?`
                        : `Disable "${u.username}"? They will not be able to sign in.`;
                      if (!window.confirm(prompt)) return;
                      run(
                        `u-${u.id}`,
                        () => updatePlatformUser(u.id, { is_active: next }),
                        next ? `${u.username} enabled.` : `${u.username} disabled.`
                      );
                    }}
                  >
                    {busyKey === `u-${u.id}` ? <Loader2 size={14} className="spin" /> : u.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                    {u.is_active ? "Disable" : "Enable"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card sec-panel">
        <header className="sec-head">
          <h3><AlertTriangle size={18} /> Needs review</h3>
        </header>
        <div className="sec-review">
          <div>
            <h4>Pending schools</h4>
            {pendingSchools.length === 0 ? (
              <p className="sec-empty">No school registrations waiting.</p>
            ) : (
              <ul className="sec-list">
                {pendingSchools.map((s) => (
                  <li key={s.id}>
                    <Link to={`/schools/${s.id}`} className="sec-name">
                      <strong>{s.name}</strong>
                      <span>{[s.code, s.domain].filter(Boolean).join(" · ") || "Waiting for approval"}</span>
                    </Link>
                    <div className="sec-actions">
                      <button
                        type="button"
                        className="sch-pill is-ok"
                        disabled={busyKey === `p-${s.id}`}
                        onClick={() => run(`p-${s.id}`, () => approveSchool(s.id), `${s.name} approved.`)}
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        type="button"
                        className="sch-pill is-bad"
                        disabled={busyKey === `p-${s.id}`}
                        onClick={() => {
                          if (window.confirm(`Reject "${s.name}"?`)) {
                            run(`p-${s.id}`, () => rejectSchool(s.id), `${s.name} rejected.`);
                          }
                        }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4>Pending plans</h4>
            {pendingPlans.length === 0 ? (
              <p className="sec-empty">No subscription requests waiting.</p>
            ) : (
              <ul className="sec-list">
                {pendingPlans.map((s) => (
                  <li key={s.id}>
                    <Link to={`/schools/${s.id}`} className="sec-name">
                      <strong>{s.name}</strong>
                      <span>
                        {s.plan_type} · {s.plan_amount ? `Rs ${Number(s.plan_amount).toLocaleString()}` : ""}
                        {s.transaction_id ? ` · ${s.transaction_id}` : ""}
                      </span>
                    </Link>
                    <div className="sec-actions">
                      <button
                        type="button"
                        className="sch-pill is-ok"
                        disabled={busyKey === `pl-${s.id}`}
                        onClick={() => run(`pl-${s.id}`, () => approvePlan(s.id), `${s.name} plan approved.`)}
                      >
                        <CheckCircle2 size={14} /> Approve plan
                      </button>
                      <button
                        type="button"
                        className="sch-pill is-bad"
                        disabled={busyKey === `pl-${s.id}`}
                        onClick={() => {
                          if (window.confirm(`Reject the ${s.plan_type} plan for "${s.name}"?`)) {
                            run(`pl-${s.id}`, () => rejectPlan(s.id), `${s.name} plan rejected.`);
                          }
                        }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="card sec-panel">
        <header className="sec-head">
          <h3><Clock size={18} /> Security audit</h3>
          <small>Last 30 days</small>
        </header>
        {activities.length === 0 ? (
          <p className="sec-empty">No security events yet. Approvals, suspensions, and account locks will appear here.</p>
        ) : (
          <ul className="sec-list">
            {activities.map((a) => (
              <li key={a.id}>
                <div className="sec-name">
                  <strong>{a.name}</strong>
                  <span>{a.action}</span>
                </div>
                <small className="sec-time">{formatWhen(a.created_at)}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
