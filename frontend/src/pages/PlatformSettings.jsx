import { useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  Wrench,
} from "lucide-react";
import { getPlatformSettings, updatePlatformSettings } from "../api/adminApi";
import "./Schools.css";
import "./PlatformSettings.css";

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const empty = {
  name: "Classora",
  support_email: "",
  support_phone: "",
  allow_signup: true,
  maintenance_mode: false,
  groq_api_key: "",
};

export default function PlatformSettings() {
  const [form, setForm] = useState(empty);
  const [keySet, setKeySet] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingToggle, setSavingToggle] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPlatformSettings();
      const d = res.data || {};
      setForm({
        name: d.name || "Classora",
        support_email: d.support_email || "",
        support_phone: d.support_phone || "",
        allow_signup: d.allow_signup !== false,
        maintenance_mode: !!d.maintenance_mode,
        groq_api_key: "",
      });
      setKeySet(!!d.groq_api_key_set);
      setUpdatedAt(d.updated_at || "");
      setError("");
    } catch (err) {
      setError(apiError(err, "Could not load platform settings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const persistToggle = async (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSavingToggle(field);
    setError("");
    setMessage("");
    try {
      const res = await updatePlatformSettings({ [field]: value });
      const d = res.data || {};
      setUpdatedAt(d.updated_at || "");
      setMessage(
        field === "allow_signup"
          ? (value ? "New school signups are open." : "New school signups are closed.")
          : (value ? "Maintenance mode is on. School users cannot log in." : "Maintenance mode is off.")
      );
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setForm((prev) => ({ ...prev, [field]: !value }));
      setError(apiError(err, "Could not update this setting."));
    } finally {
      setSavingToggle("");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name.trim() || "Classora",
        support_email: form.support_email.trim(),
        support_phone: form.support_phone.trim(),
        allow_signup: form.allow_signup,
        maintenance_mode: form.maintenance_mode,
      };
      if (form.groq_api_key.trim() && !form.groq_api_key.includes("•")) {
        payload.groq_api_key = form.groq_api_key.trim();
      }
      const res = await updatePlatformSettings(payload);
      const d = res.data || {};
      setKeySet(!!d.groq_api_key_set);
      setUpdatedAt(d.updated_at || "");
      setForm((prev) => ({ ...prev, groq_api_key: "" }));
      setMessage("Settings saved.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(apiError(err, "Could not save platform settings."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page ps-page">
        <div className="ps-empty">
          <Loader2 className="spin" size={36} />
          <p>Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page ps-page">
      <div className="sch-hero">
        <div>
          <p className="sch-kicker">Platform</p>
          <h1>Platform settings</h1>
          <p>Brand name, support contacts, registrations, maintenance, and the global AI key.</p>
        </div>
      </div>

      {error && <div className="sch-alert">{error}</div>}
      {message && <div className="sch-alert is-ok">{message}</div>}

      <form className="card ps-card" onSubmit={handleSave}>
        <h3><Shield size={18} /> Identity</h3>
        <div className="ps-grid">
          <div className="input-group">
            <label className="input-label">Platform name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label"><Mail size={12} /> Support email</label>
            <input
              type="email"
              className="input-field"
              placeholder="support@classora.com"
              value={form.support_email}
              onChange={(e) => setForm({ ...form, support_email: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label"><Phone size={12} /> Support phone</label>
            <input
              className="input-field"
              placeholder="03xx…"
              value={form.support_phone}
              onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
            />
          </div>
        </div>

          <h3><Wrench size={18} /> Access</h3>
        <p className="ps-hint">These switches save the moment you toggle them — no need to click Save.</p>
        <div className="ps-toggles">
          <label className={`ps-toggle ${form.allow_signup ? "is-on" : ""} ${savingToggle === "allow_signup" ? "is-saving" : ""}`}>
            <input
              type="checkbox"
              checked={form.allow_signup}
              disabled={!!savingToggle}
              onChange={(e) => persistToggle("allow_signup", e.target.checked)}
            />
            <div>
              <b>Allow new school signups {savingToggle === "allow_signup" ? <Loader2 size={12} className="spin" /> : null}</b>
              <span>Off = landing and /signup cannot register a new school. Applies immediately.</span>
            </div>
          </label>
          <label className={`ps-toggle ${form.maintenance_mode ? "is-warn" : ""} ${savingToggle === "maintenance_mode" ? "is-saving" : ""}`}>
            <input
              type="checkbox"
              checked={form.maintenance_mode}
              disabled={!!savingToggle}
              onChange={(e) => persistToggle("maintenance_mode", e.target.checked)}
            />
            <div>
              <b>Maintenance mode {savingToggle === "maintenance_mode" ? <Loader2 size={12} className="spin" /> : null}</b>
              <span>On = school users are logged out and cannot sign in. Superadmin stays open. Applies immediately.</span>
            </div>
          </label>
        </div>

        <h3><KeyRound size={18} /> AI assistant</h3>
        <div className="input-group">
          <label className="input-label">Global Groq API key</label>
          <input
            type="password"
            className="input-field"
            placeholder={keySet ? "Key is saved — paste a new one only to replace it" : "gsk_…"}
            autoComplete="off"
            value={form.groq_api_key}
            onChange={(e) => setForm({ ...form, groq_api_key: e.target.value })}
          />
          <p className="ps-hint">
            {keySet ? "A platform key is already set. Leave this blank to keep it." : "No platform key yet. Schools without their own key will use this one."}
            {" "}School admins cannot see or change this.
          </p>
        </div>

        <div className="ps-foot">
          <small>Last saved {formatWhen(updatedAt)}</small>
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : message ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : message ? "Saved" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
