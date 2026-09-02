import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Calendar,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  Lock,
  Save,
  School,
  Shield,
  User,
} from "lucide-react";
import { getUserProfile, updateUserProfile, changePassword } from "../auth/authService";
import api from "../api/axios";
import { getUser, getRole, setUser, isDemoMode, getDisplayName } from "../store/authStore";
import { useTenant } from "../context/TenantContext";
import "./LandingPageSettings.css";
import "./Settings.css";
import "./Profile.css";

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
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role) {
  if (!role) return "User";
  if (role === "superadmin") return "Super Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const EMPTY_FORM = { first_name: "", last_name: "", email: "", phone: "" };

export default function Profile() {
  const navigate = useNavigate();
  const tenant = useTenant();
  const role = getRole();
  const [profile, setProfile] = useState(getUser() || {});
  const [form, setForm] = useState(EMPTY_FORM);
  const [snapshot, setSnapshot] = useState(JSON.stringify(EMPTY_FORM));
  const [loading, setLoading] = useState(!isDemoMode());
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const applyProfile = (row) => {
    setProfile(row);
    setUser(row);
    const next = {
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      email: row.email || "",
      phone: row.phone || "",
    };
    setForm(next);
    setSnapshot(JSON.stringify(next));
  };

  useEffect(() => {
    if (isDemoMode()) {
      applyProfile(getUser());
      setLoading(false);
      return;
    }
    getUserProfile()
      .then(applyProfile)
      .catch(() => setError("Could not load your profile."))
      .finally(() => setLoading(false));
  }, []);

  const dirty = JSON.stringify(form) !== snapshot;
  const display = [form.first_name, form.last_name].filter(Boolean).join(" ").trim() || profile.username || getDisplayName();
  const initial = (display || "U").charAt(0).toUpperCase();
  const schoolName = profile.school_name || tenant.schoolName || "";

  const saveProfile = async (e) => {
    e.preventDefault();
    if (isDemoMode()) {
      setError("Demo mode cannot save profile changes.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const row = await updateUserProfile(form);
      applyProfile(row);
      setMessage("Profile saved.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(apiError(err, "Could not save profile."));
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file || isDemoMode()) return;
    const type = (file.type || "").toLowerCase();
    if (type && !type.startsWith("image/")) {
      setError("Please choose a photo (JPG, PNG, or WebP).");
      return;
    }
    setUploadingPhoto(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/school/upload-image/", formData);
      const url = res.data?.url;
      if (!url) throw new Error("Upload did not return a photo URL.");
      const row = await updateUserProfile({ avatar_url: url });
      applyProfile(row);
      setMessage("Profile photo saved.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(apiError(err, "Could not upload photo. Try a smaller JPG or PNG."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (isDemoMode()) {
      setError("Demo mode cannot change passwords.");
      return;
    }
    if (pwForm.new_password !== pwForm.confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setPwSaving(true);
    setMessage("");
    setError("");
    try {
      await changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ current_password: "", new_password: "", confirm: "" });
      setMessage("Password updated.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(apiError(err, "Could not update password."));
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page pf-page" style={{ alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
        <Loader2 className="spin" size={28} />
      </div>
    );
  }

  return (
    <div className="page lps-page pf-page">
      <header className="lps-header">
        <div>
          <p className="lps-kicker">Account</p>
          <h1>Your profile</h1>
          <p>Update your name, contact details, and password. Your login username stays the same.</p>
        </div>
        <div className="lps-header-actions">
          {dirty && <span className="lps-dirty">Unsaved changes</span>}
          <button className="lps-btn lps-btn-primary" type="submit" form="profile-form" disabled={saving || !dirty || isDemoMode()}>
            {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </header>

      {message && (
        <div className="lps-banner is-ok">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}
      {error && <div className="lps-banner is-err">{error}</div>}

      <div className="pf-layout">
        <aside>
          <section className="lps-card pf-side">
            <label className="pf-avatar">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
              <input type="file" accept="image/*" hidden onChange={(e) => uploadPhoto(e.target.files?.[0])} />
              <span className="pf-avatar-cam">{uploadingPhoto ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}</span>
            </label>
            <h2>{display}</h2>
            <div className="pf-role">{roleLabel(role || profile.role)}</div>
            <div className="pf-meta">
              <div className="pf-meta-row">
                <div className="pf-icon"><User size={16} /></div>
                <div>
                  <span>Username</span>
                  {profile.username || "—"}
                </div>
              </div>
              <div className="pf-meta-row">
                <div className="pf-icon"><Clock size={16} /></div>
                <div>
                  <span>Last login</span>
                  {formatWhen(profile.last_login)}
                </div>
              </div>
              <div className="pf-meta-row">
                <div className="pf-icon"><Calendar size={16} /></div>
                <div>
                  <span>Joined</span>
                  {formatWhen(profile.date_joined)}
                </div>
              </div>
              <div className="pf-meta-row">
                <div className="pf-icon"><Shield size={16} /></div>
                <div>
                  <span>Status</span>
                  {profile.is_active === false ? "Disabled" : "Active"}
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className="lps-editor">
          <form id="profile-form" className="lps-card" onSubmit={saveProfile}>
            <h2>Personal details</h2>
            <p className="lps-help">This name appears in the top bar. Username is used only to sign in.</p>
            <div className="lps-row">
              <label className="lps-label">
                First name
                <input className="lps-input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="e.g. Ali" />
              </label>
              <label className="lps-label">
                Last name
                <input className="lps-input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="e.g. Khan" />
              </label>
            </div>
            <label className="lps-label">
              Email
              <input className="lps-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@school.com" />
            </label>
            <label className="lps-label">
              Phone
              <input className="lps-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx xxx xxxx" />
            </label>
            <label className="lps-label">
              Username
              <div className="ss-readonly" style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 14px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
                <Lock size={14} /> {profile.username || "—"}
              </div>
            </label>
          </form>

          <form className="lps-card" onSubmit={savePassword}>
            <h2>Password</h2>
            <p className="lps-help">
              {profile.has_usable_password === false
                ? "This account was created with Google. Set a password to also sign in with email."
                : "Enter your current password, then choose a new one."}
            </p>
            {profile.has_usable_password !== false && (
              <label className="lps-label">
                Current password
                <input className="lps-input" type="password" autoComplete="current-password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
              </label>
            )}
            <div className="lps-row">
              <label className="lps-label">
                New password
                <input className="lps-input" type="password" autoComplete="new-password" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
              </label>
              <label className="lps-label">
                Confirm password
                <input className="lps-input" type="password" autoComplete="new-password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
              </label>
            </div>
            <button className="lps-btn lps-btn-primary" type="submit" disabled={pwSaving || isDemoMode() || !pwForm.new_password}>
              {pwSaving ? <Loader2 className="spin" size={16} /> : <KeyRound size={16} />}
              {pwSaving ? "Updating…" : "Update password"}
            </button>
          </form>

          <section className="lps-card">
            <h2>School</h2>
            {schoolName ? (
              <div className="ss-identity">
                <div className="ss-logo-wrap">
                  {tenant.branding?.logo ? <img src={tenant.branding.logo} alt="" /> : <School size={28} />}
                </div>
                <div>
                  <strong>{schoolName}</strong>
                  <p className="lps-help" style={{ margin: "4px 0 0" }}>
                    {role === "superadmin" ? "Platform account" : `Signed in as ${roleLabel(role)}`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="lps-help">No school is linked to this account.</p>
            )}
            {role === "admin" && (
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <button className="lps-btn lps-btn-ghost" type="button" onClick={() => navigate("/settings")}>
                  <School size={16} /> School settings
                </button>
                <button className="lps-btn lps-btn-ghost" type="button" onClick={() => navigate("/subscription")}>
                  Manage subscription
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
