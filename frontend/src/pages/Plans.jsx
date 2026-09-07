import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  approvePlan,
  assignPlanToSchool,
  createPlan,
  deletePlan,
  getPlansOverview,
  getSchools,
  rejectPlan,
  updatePlan,
} from "../api/adminApi";
import "./Schools.css";
import "./Plans.css";

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  if (data.message) return data.message;
  const first = Object.values(data).flat()?.[0];
  return first || fallback;
}

const emptyForm = {
  code: "",
  name: "",
  description: "",
  price: 1500,
  duration_days: 30,
  student_limit: 100,
  teacher_limit: 5,
  feature_tier: "Basic",
  features_text: "",
  locked_features_text: "",
  color: "#F15A24",
  is_active: true,
  is_popular: false,
  sort_order: 0,
  unlimited_students: false,
  unlimited_teachers: false,
};

function planToForm(plan) {
  return {
    code: plan.code || "",
    name: plan.name || "",
    description: plan.description || "",
    price: Number(plan.price || 0),
    duration_days: plan.duration_days || 30,
    student_limit: plan.student_limit ?? 100,
    teacher_limit: plan.teacher_limit ?? 5,
    feature_tier: plan.feature_tier || "Basic",
    features_text: (plan.features || []).join("\n"),
    locked_features_text: (plan.locked_features || []).join("\n"),
    color: plan.color || "#F15A24",
    is_active: plan.is_active !== false,
    is_popular: !!plan.is_popular,
    sort_order: plan.sort_order || 0,
    unlimited_students: plan.student_limit == null,
    unlimited_teachers: plan.teacher_limit == null,
  };
}

function formToPayload(form) {
  return {
    code: form.code.trim().toLowerCase().replace(/\s+/g, "-"),
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price) || 0,
    duration_days: Number(form.duration_days) || 30,
    student_limit: form.unlimited_students ? null : Number(form.student_limit) || 0,
    teacher_limit: form.unlimited_teachers ? null : Number(form.teacher_limit) || 0,
    feature_tier: form.feature_tier,
    features: form.features_text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    locked_features: form.locked_features_text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    color: form.color || "#F15A24",
    is_active: !!form.is_active,
    is_popular: !!form.is_popular,
    sort_order: Number(form.sort_order) || 0,
  };
}

export default function Plans() {
  const [tab, setTab] = useState("approvals");
  const [plans, setPlans] = useState([]);
  const [pending, setPending] = useState([]);
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [assignSchoolId, setAssignSchoolId] = useState("");
  const [assignPlanId, setAssignPlanId] = useState("");

  const load = async (isFirst = false) => {
    if (isFirst) setLoading(true);
    try {
      const [overviewRes, schoolsRes] = await Promise.all([
        getPlansOverview(),
        getSchools(),
      ]);
      const data = overviewRes.data || {};
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      setPending(Array.isArray(data.pending) ? data.pending : []);
      setStats(data.stats || {});
      setSchools(Array.isArray(schoolsRes.data) ? schoolsRes.data : []);
      if (isFirst) setError("");
    } catch (err) {
      if (isFirst) setError(apiError(err, "Could not load plans."));
    } finally {
      if (isFirst) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3200);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    setForm(planToForm(plan));
    setShowForm(true);
  };

  const savePlan = async (e) => {
    e.preventDefault();
    const payload = formToPayload(form);
    if (!payload.code || !payload.name) {
      setError("Plan code and name are required.");
      return;
    }
    setBusyKey("save");
    setError("");
    try {
      if (editingId) {
        await updatePlan(editingId, payload);
        flash("Plan updated.");
      } else {
        await createPlan(payload);
        flash("Plan created.");
      }
      setShowForm(false);
      await load(false);
    } catch (err) {
      setError(apiError(err, "Could not save plan."));
    } finally {
      setBusyKey("");
    }
  };

  const removePlan = async (plan) => {
    if (!window.confirm(`Delete or deactivate "${plan.name}"?`)) return;
    setBusyKey(`del-${plan.id}`);
    try {
      const res = await deletePlan(plan.id);
      flash(res.data?.message || "Plan removed.");
      await load(false);
    } catch (err) {
      setError(apiError(err, "Could not delete plan."));
    } finally {
      setBusyKey("");
    }
  };

  const runApproval = async (schoolId, action) => {
    setBusyKey(`${action}-${schoolId}`);
    try {
      if (action === "approve") await approvePlan(schoolId);
      else await rejectPlan(schoolId);
      flash(action === "approve" ? "Plan approved." : "Plan rejected.");
      await load(false);
    } catch (err) {
      setError(apiError(err, "Action failed."));
    } finally {
      setBusyKey("");
    }
  };

  const runAssign = async (e) => {
    e.preventDefault();
    if (!assignPlanId || !assignSchoolId) {
      setError("Select a plan and a school.");
      return;
    }
    setBusyKey("assign");
    try {
      const res = await assignPlanToSchool(assignPlanId, { school_id: assignSchoolId });
      flash(res.data?.message || "Plan assigned.");
      setAssignSchoolId("");
      setAssignPlanId("");
      await load(false);
    } catch (err) {
      setError(apiError(err, "Could not assign plan."));
    } finally {
      setBusyKey("");
    }
  };

  const approvedSchools = useMemo(
    () => schools.filter((s) => s.status === "Approved"),
    [schools]
  );

  if (loading) {
    return (
      <div className="page sch-page plans-page">
        <div className="plans-loading">
          <Loader2 className="spin" size={22} /> Loading plans…
        </div>
      </div>
    );
  }

  return (
    <div className="page sch-page plans-page">
      <div className="sch-hero">
        <div>
          <p className="sch-kicker">Platform billing</p>
          <h1>Plans</h1>
          <p>Create catalog plans, approve school purchases, and assign subscriptions.</p>
        </div>
        <div className="plans-hero-actions">
          <button type="button" className="sch-pill" onClick={() => load(false)}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" className="sch-pill is-ok" onClick={openCreate}>
            <Plus size={14} /> Create plan
          </button>
        </div>
      </div>

      <div className="sch-stats">
        <button type="button" className={`sch-stat sch-stat-orange ${tab === "approvals" ? "is-on" : ""}`} onClick={() => setTab("approvals")}>
          <span>Pending approve</span>
          <strong>{stats.pending_approvals || 0}</strong>
          <small>awaiting review</small>
        </button>
        <button type="button" className={`sch-stat sch-stat-navy ${tab === "catalog" ? "is-on" : ""}`} onClick={() => setTab("catalog")}>
          <span>Catalog</span>
          <strong>{stats.catalog || 0}</strong>
          <small>{stats.active_catalog || 0} active</small>
        </button>
        <button type="button" className={`sch-stat sch-stat-green ${tab === "assign" ? "is-on" : ""}`} onClick={() => setTab("assign")}>
          <span>Active subs</span>
          <strong>{stats.active_subscriptions || 0}</strong>
          <small>live schools</small>
        </button>
        <div className="sch-stat sch-stat-gold">
          <span>Manage</span>
          <strong><CreditCard size={22} /></strong>
          <small>create · approve · assign</small>
        </div>
      </div>

      {error && <div className="plans-banner is-error">{error}</div>}
      {message && <div className="plans-banner is-ok">{message}</div>}

      <div className="plans-tabs">
        <button type="button" className={tab === "approvals" ? "is-on" : ""} onClick={() => setTab("approvals")}>
          Approve requests
        </button>
        <button type="button" className={tab === "catalog" ? "is-on" : ""} onClick={() => setTab("catalog")}>
          Manage catalog
        </button>
        <button type="button" className={tab === "assign" ? "is-on" : ""} onClick={() => setTab("assign")}>
          Assign plan
        </button>
      </div>

      {tab === "approvals" && (
        <section className="plans-panel">
          <div className="plans-panel-head">
            <h2>Pending plan approvals</h2>
            <p>Schools that submitted payment / transaction IDs.</p>
          </div>
          {pending.length === 0 ? (
            <div className="plans-empty">No pending plan requests.</div>
          ) : (
            <div className="plans-table-wrap">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Txn ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/schools/${s.id}`} className="plans-school-link">{s.name}</Link>
                        <div className="plans-muted">{s.domain || s.code}</div>
                      </td>
                      <td>
                        <strong>{s.plan_name || s.plan_type}</strong>
                        <div className="plans-muted">{s.plan_type}</div>
                      </td>
                      <td>RS {Number(s.plan_amount || 0).toLocaleString()}</td>
                      <td className="plans-mono">{s.transaction_id || "—"}</td>
                      <td className="plans-actions">
                        <button
                          type="button"
                          className="sch-pill is-ok"
                          disabled={!!busyKey}
                          onClick={() => runApproval(s.id, "approve")}
                        >
                          {busyKey === `approve-${s.id}` ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                          Approve
                        </button>
                        <button
                          type="button"
                          className="sch-pill is-bad"
                          disabled={!!busyKey}
                          onClick={() => runApproval(s.id, "reject")}
                        >
                          {busyKey === `reject-${s.id}` ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "catalog" && (
        <section className="plans-panel">
          <div className="plans-panel-head">
            <h2>Plan catalog</h2>
            <p>Create and edit subscription packages schools can buy.</p>
          </div>
          <div className="plans-grid">
            {plans.map((plan) => (
              <article key={plan.id} className={`plans-card ${plan.is_active ? "" : "is-off"}`}>
                <div className="plans-card-top" style={{ borderColor: plan.color || "var(--accent)" }}>
                  <div>
                    <p className="plans-card-code">{plan.code}</p>
                    <h3>{plan.name}</h3>
                  </div>
                  <strong>RS {Number(plan.price || 0).toLocaleString()}</strong>
                </div>
                <p className="plans-card-desc">{plan.description || "No description"}</p>
                <ul className="plans-meta">
                  <li>Tier: {plan.feature_tier}</li>
                  <li>Duration: {plan.duration_days} days</li>
                  <li>Students: {plan.student_limit == null ? "Unlimited" : plan.student_limit}</li>
                  <li>Teachers: {plan.teacher_limit == null ? "Unlimited" : plan.teacher_limit}</li>
                  <li>{plan.is_active ? "Active" : "Inactive"}{plan.is_popular ? " · Popular" : ""}</li>
                </ul>
                <div className="plans-actions">
                  <button type="button" className="sch-pill" onClick={() => openEdit(plan)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className="sch-pill is-bad"
                    disabled={busyKey === `del-${plan.id}`}
                    onClick={() => removePlan(plan)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "assign" && (
        <section className="plans-panel">
          <div className="plans-panel-head">
            <h2>Assign plan to school</h2>
            <p>Activate a plan immediately without a payment request.</p>
          </div>
          <form className="plans-assign" onSubmit={runAssign}>
            <label>
              School
              <select value={assignSchoolId} onChange={(e) => setAssignSchoolId(e.target.value)} required>
                <option value="">Select school…</option>
                {approvedSchools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.plan_status || "Inactive"})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Plan
              <select value={assignPlanId} onChange={(e) => setAssignPlanId(e.target.value)} required>
                <option value="">Select plan…</option>
                {plans.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — RS {Number(p.price).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="sch-pill is-ok" disabled={busyKey === "assign"}>
              {busyKey === "assign" ? <Loader2 size={14} className="spin" /> : <BadgeCheck size={14} />}
              Assign & activate
            </button>
          </form>
        </section>
      )}

      {showForm && (
        <div className="plans-modal-backdrop" onClick={() => setShowForm(false)}>
          <form className="plans-modal" onClick={(e) => e.stopPropagation()} onSubmit={savePlan}>
            <div className="plans-modal-head">
              <h3>{editingId ? "Edit plan" : "Create plan"}</h3>
              <button type="button" className="icon-btn-sm" onClick={() => setShowForm(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="plans-form-grid">
              <label>
                Code
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="basic"
                  required
                  disabled={!!editingId}
                />
              </label>
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Basic Plan"
                  required
                />
              </label>
              <label>
                Price (PKR)
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </label>
              <label>
                Duration (days)
                <input
                  type="number"
                  min="1"
                  value={form.duration_days}
                  onChange={(e) => setForm((f) => ({ ...f, duration_days: e.target.value }))}
                />
              </label>
              <label>
                Feature tier
                <select
                  value={form.feature_tier}
                  onChange={(e) => setForm((f) => ({ ...f, feature_tier: e.target.value }))}
                >
                  <option value="Basic">Basic</option>
                  <option value="Business">Business</option>
                  <option value="Pro">Pro</option>
                </select>
              </label>
              <label>
                Sort order
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                />
              </label>
              <label>
                Student limit
                <input
                  type="number"
                  min="0"
                  disabled={form.unlimited_students}
                  value={form.unlimited_students ? "" : form.student_limit}
                  onChange={(e) => setForm((f) => ({ ...f, student_limit: e.target.value }))}
                />
              </label>
              <label>
                Teacher limit
                <input
                  type="number"
                  min="0"
                  disabled={form.unlimited_teachers}
                  value={form.unlimited_teachers ? "" : form.teacher_limit}
                  onChange={(e) => setForm((f) => ({ ...f, teacher_limit: e.target.value }))}
                />
              </label>
              <label className="plans-span-2">
                Description
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label>
                Features (one per line)
                <textarea
                  rows={4}
                  value={form.features_text}
                  onChange={(e) => setForm((f) => ({ ...f, features_text: e.target.value }))}
                />
              </label>
              <label>
                Locked features (one per line)
                <textarea
                  rows={4}
                  value={form.locked_features_text}
                  onChange={(e) => setForm((f) => ({ ...f, locked_features_text: e.target.value }))}
                />
              </label>
              <label>
                Color
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
              </label>
              <div className="plans-checks">
                <label className="plans-check">
                  <input
                    type="checkbox"
                    checked={form.unlimited_students}
                    onChange={(e) => setForm((f) => ({ ...f, unlimited_students: e.target.checked }))}
                  />
                  Unlimited students
                </label>
                <label className="plans-check">
                  <input
                    type="checkbox"
                    checked={form.unlimited_teachers}
                    onChange={(e) => setForm((f) => ({ ...f, unlimited_teachers: e.target.checked }))}
                  />
                  Unlimited teachers
                </label>
                <label className="plans-check">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active
                </label>
                <label className="plans-check">
                  <input
                    type="checkbox"
                    checked={form.is_popular}
                    onChange={(e) => setForm((f) => ({ ...f, is_popular: e.target.checked }))}
                  />
                  Popular
                </label>
              </div>
            </div>
            <div className="plans-modal-actions">
              <button type="button" className="sch-pill" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="sch-pill is-ok" disabled={busyKey === "save"}>
                {busyKey === "save" ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                {editingId ? "Save changes" : "Create plan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
