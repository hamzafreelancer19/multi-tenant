import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Hash,
  Image as ImageIcon,
  Layout,
  Loader2,
  Mail,
  Palette,
  Phone,
  Save,
  School,
  ShieldCheck,
  Upload,
} from "lucide-react";
import api from "../api/axios";
import { getUser } from "../store/authStore";
import { useTenant } from "../context/TenantContext";
import "./LandingPageSettings.css";
import "./Settings.css";

const GENERIC = new Set(["#3b82f6", "#1e40af", "#1d4ed8", "#2563eb", "#1e293b", "#10b981", "#e8b86d", "#08131c"]);

const DASH_PRESETS = [
  { name: "Classora", primary: "#F15A24", secondary: "#0F172A", accent: "#FF8C42" },
  { name: "Navy", primary: "#1e3a8a", secondary: "#020617", accent: "#38bdf8" },
  { name: "Forest", primary: "#059669", secondary: "#022c22", accent: "#34d399" },
  { name: "Berry", primary: "#db2777", secondary: "#1f0a16", accent: "#fb7185" },
];

const EMPTY_FORM = {
  name: "",
  landing_contact_email: "",
  landing_contact_phone: "",
  dashboard_primary_color: "#F15A24",
  dashboard_secondary_color: "#0F172A",
  dashboard_accent_color: "#FF8C42",
};

function dashColor(value, fallback) {
  const hex = (value || "").toLowerCase();
  return !hex || GENERIC.has(hex) ? fallback : value;
}

export default function Settings() {
  const navigate = useNavigate();
  const tenant = useTenant();
  const user = getUser();
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snapshot, setSnapshot] = useState(JSON.stringify(EMPTY_FORM));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const applySchool = (row) => {
    setSchool(row);
    const next = {
      name: row.name || "",
      landing_contact_email: row.landing_contact_email || "",
      landing_contact_phone: row.landing_contact_phone || "",
      dashboard_primary_color: dashColor(row.dashboard_primary_color, "#F15A24"),
      dashboard_secondary_color: dashColor(row.dashboard_secondary_color, "#0F172A"),
      dashboard_accent_color: dashColor(row.dashboard_accent_color, "#FF8C42"),
    };
    setForm(next);
    setSnapshot(JSON.stringify(next));
  };

  const fetchSchool = async () => {
    try {
      const res = await api.get("schools/");
      const schools = Array.isArray(res.data) ? res.data : [];
      const mine =
        schools.find((s) => s.id === Number(user?.school) || s.id === Number(user?.school_id) || s.id === Number(tenant.schoolId)) ||
        schools[0];
      if (mine) applySchool(mine);
    } catch {
      setError("Could not load school settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool();
  }, []);

  const dirty = JSON.stringify(form) !== snapshot;
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const landingPath = tenant.schoolSlug ? `/s/${tenant.schoolSlug}` : "/";

  const save = async () => {
    if (!school?.id) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        ...form,
        landing_contact_email: form.landing_contact_email || null,
      };
      const res = await api.patch(`schools/${school.id}/`, payload);
      applySchool(res.data);
      setMessage("School settings saved. Dashboard colors apply immediately.");
      if (tenant.refreshTenant) await tenant.refreshTenant();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file, field) => {
    if (!file || !school?.id) return;
    const body = new FormData();
    body.append(field, file);
    setUploading(field);
    setError("");
    try {
      const res = await api.patch(`schools/${school.id}/`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      applySchool(res.data);
      setMessage(field === "logo" ? "Logo updated." : "Favicon updated.");
      if (tenant.refreshTenant) await tenant.refreshTenant();
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setError("Upload failed. Use a PNG or JPG under 2MB.");
    } finally {
      setUploading("");
    }
  };

  const preview = useMemo(
    () => ({
      primary: form.dashboard_primary_color,
      secondary: form.dashboard_secondary_color,
      accent: form.dashboard_accent_color,
    }),
    [form]
  );

  if (loading) {
    return (
      <div className="page" style={{ alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spin" size={28} />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="page lps-page">
        <h1>School settings</h1>
        <p>No school profile is linked to this admin account.</p>
      </div>
    );
  }

  return (
    <div className="page lps-page">
      <header className="lps-header">
        <div>
          <p className="lps-kicker">Admin panel</p>
          <h1>School settings</h1>
          <p>School identity, dashboard colors, and contact details. Public website copy stays on Landing page settings.</p>
        </div>
        <div className="lps-header-actions">
          {dirty && <span className="lps-dirty">Unsaved changes</span>}
          <button className="lps-btn lps-btn-ghost" type="button" onClick={() => navigate("/landing-settings")}>
            <Layout size={16} /> Public website
          </button>
          <button className="lps-btn lps-btn-primary" type="button" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {message && (
        <div className="lps-banner is-ok">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}
      {error && <div className="lps-banner is-err">{error}</div>}

      <div className="lps-layout">
        <div className="lps-editor">
          <section className="lps-card">
            <h2>School profile</h2>
            <p className="lps-help">This name appears in the sidebar and on the public website.</p>
            <div className="ss-identity">
              <div className="ss-logo-wrap">
                {school.logo_url ? <img src={school.logo_url} alt="" /> : <School size={28} />}
              </div>
              <div>
                <strong>{form.name || school.name}</strong>
                <span className={`badge-status ${school.status === "Approved" ? "badge-active" : "badge-warning"}`}>{school.status}</span>
              </div>
            </div>
            <label className="lps-label">
              School name
              <input className="lps-input" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
            </label>
            <div className="lps-row">
              <label className="lps-label">
                School code
                <div className="ss-readonly"><Hash size={14} /> {school.code}</div>
              </label>
              <label className="lps-label">
                Domain
                <div className="ss-readonly"><Globe size={14} /> {school.domain || "Not set"}</div>
              </label>
            </div>
            <div className="lps-row">
              <FileUpload
                label="Logo"
                preview={school.logo_url}
                uploading={uploading === "logo"}
                onFile={(file) => uploadFile(file, "logo")}
              />
              <FileUpload
                label="Favicon"
                preview={school.favicon_url}
                uploading={uploading === "favicon"}
                onFile={(file) => uploadFile(file, "favicon")}
              />
            </div>
          </section>

          <section className="lps-card">
            <h2>Contact</h2>
            <p className="lps-help">Used on the public website header and admission page.</p>
            <div className="lps-row">
              <label className="lps-label">
                Email
                <input className="lps-input" type="email" value={form.landing_contact_email} onChange={(e) => setField("landing_contact_email", e.target.value)} placeholder="admissions@school.com" />
              </label>
              <label className="lps-label">
                Phone
                <input className="lps-input" value={form.landing_contact_phone} onChange={(e) => setField("landing_contact_phone", e.target.value)} placeholder="03xx xxx xxxx" />
              </label>
            </div>
          </section>

          <section className="lps-card">
            <h2>Dashboard colors</h2>
            <p className="lps-help">These colors are for the admin panel only. Landing page gold/navy stays separate.</p>
            <div className="lps-presets">
              {DASH_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className="lps-preset"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      dashboard_primary_color: preset.primary,
                      dashboard_secondary_color: preset.secondary,
                      dashboard_accent_color: preset.accent,
                    }))
                  }
                >
                  <span style={{ background: preset.secondary }}>
                    <i style={{ background: preset.primary }} />
                  </span>
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="ss-color-grid">
              <ColorField label="Primary" value={form.dashboard_primary_color} onChange={(v) => setField("dashboard_primary_color", v)} />
              <ColorField label="Sidebar" value={form.dashboard_secondary_color} onChange={(v) => setField("dashboard_secondary_color", v)} />
              <ColorField label="Accent" value={form.dashboard_accent_color} onChange={(v) => setField("dashboard_accent_color", v)} />
            </div>
          </section>
        </div>

        <aside className="lps-preview">
          <div className="lps-preview-card">
            <p>Dashboard preview</p>
            <div
              className="ss-dash-preview"
              style={{
                "--ss-primary": preview.primary,
                "--ss-secondary": preview.secondary,
                "--ss-accent": preview.accent,
              }}
            >
              <aside>
                <strong>{form.name || "School"}</strong>
                <span>Dashboard</span>
                <span>Students</span>
                <span className="is-active">Settings</span>
              </aside>
              <main>
                <b>Welcome</b>
                <i />
                <i />
              </main>
            </div>
            <div className="lps-preview-meta">
              <span><Mail size={14} /> {form.landing_contact_email || "Email not set"}</span>
              <a href={landingPath} target="_blank" rel="noreferrer">
                Open website <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <section className="lps-card ss-plan-card">
            <h2><ShieldCheck size={18} /> Plan</h2>
            <div className="ss-plan-row">
              <div>
                <small>Current plan</small>
                <strong>{school.plan_type || "None"}</strong>
              </div>
              <span className={`badge-status ${school.plan_status === "Active" ? "badge-active" : "badge-warning"}`}>
                {school.plan_status}
              </span>
            </div>
            {school.plan_status === "Active" ? (
              <p className="ss-plan-note is-ok"><CheckCircle2 size={16} /> Account is active.</p>
            ) : (
              <p className="ss-plan-note is-warn"><AlertTriangle size={16} /> Upgrade required for locked modules.</p>
            )}
            {school.plan_expiry_date && (
              <p className="lps-help" style={{ marginBottom: 12 }}>Expires {new Date(school.plan_expiry_date).toLocaleDateString()}</p>
            )}
            <button className="lps-btn lps-btn-ghost" type="button" style={{ width: "100%" }} onClick={() => navigate("/subscription")}>
              Manage subscription
            </button>
          </section>

          <section className="lps-card ss-plan-card">
            <h2><Phone size={18} /> Quick links</h2>
            <button className="lps-btn lps-btn-ghost" type="button" style={{ width: "100%", marginBottom: 8 }} onClick={() => navigate("/landing-settings")}>
              Edit public landing page
            </button>
            <button className="lps-btn lps-btn-ghost" type="button" style={{ width: "100%" }} onClick={() => navigate("/profile")}>
              My profile
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="lps-label">
      {label}
      <div className="lps-color">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <span>{value}</span>
      </div>
    </label>
  );
}

function FileUpload({ label, preview, uploading, onFile }) {
  return (
    <div className="lps-field">
      <span className="lps-label-text">{label}</span>
      <div className="lps-image-field">
        <div className="lps-thumb">{preview ? <img src={preview} alt="" /> : <ImageIcon size={20} />}</div>
        <label className="lps-btn lps-btn-ghost lps-upload">
          <Upload size={16} />
          {uploading ? "Uploading…" : "Upload"}
          <input type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
    </div>
  );
}
