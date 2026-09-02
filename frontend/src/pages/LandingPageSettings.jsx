import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  CheckCircle,
  ClipboardList,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Layout,
  Palette,
  Phone,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useTenant } from "../context/TenantContext";
import api from "../api/axios";
import "./LandingPageSettings.css";

const TABS = [
  { id: "hero", label: "Hero", icon: Layout },
  { id: "about", label: "About", icon: FileText },
  { id: "highlights", label: "Highlights", icon: Award },
  { id: "programs", label: "Programs", icon: GraduationCap },
  { id: "admissions", label: "Admissions", icon: ClipboardList },
  { id: "families", label: "Families", icon: Heart },
  { id: "look", label: "Look & contact", icon: Palette },
];

const COLOR_PRESETS = [
  { name: "Gold & navy", primary: "#e8b86d", secondary: "#08131c" },
  { name: "Emerald", primary: "#6ee7b7", secondary: "#042f2e" },
  { name: "Sky", primary: "#93c5fd", secondary: "#0b1220" },
  { name: "Rose", primary: "#f0ab9a", secondary: "#1c0b12" },
];

const GENERIC = new Set(["#3b82f6", "#1e40af", "#1d4ed8", "#2563eb", "#1e293b"]);

const EMPTY_COPY = {
  topbar_text: "",
  nav_tagline: "",
  hero_kicker: "",
  hero_primary_btn: "",
  hero_secondary_btn: "",
  campus_caption: "",
  about_kicker: "",
  about_title: "",
  about_fallback: "",
  about_points: ["", "", ""],
  features_kicker: "",
  features_title: "",
  features_subtitle: "",
  languages_kicker: "",
  languages_title: "",
  programs_kicker: "",
  programs_title: "",
  programs_subtitle: "",
  program_enroll_label: "",
  program_apply_btn: "",
  admissions_kicker: "",
  admissions_title: "",
  admissions_subtitle: "",
  admissions_points: ["", "", ""],
  admissions_button: "",
  admissions_steps: [
    { title: "", desc: "" },
    { title: "", desc: "" },
    { title: "", desc: "" },
  ],
  reviews_kicker: "",
  reviews_title: "",
  cta_title: "",
  cta_subtitle: "",
  cta_apply_btn: "",
  cta_login_btn: "",
  footer_address: "",
  apply_kicker: "",
  apply_title: "",
  apply_intro: "",
  apply_steps: [
    { title: "", desc: "" },
    { title: "", desc: "" },
    { title: "", desc: "" },
  ],
  apply_success_title: "",
  apply_success_text: "",
  stats_students_label: "",
  stats_teachers_label: "",
  stats_classes_label: "",
  stats_admissions_value: "",
  stats_admissions_label: "",
};

const EMPTY = {
  hero_title: "",
  hero_subtitle: "",
  about: "",
  primary_color: "#e8b86d",
  secondary_color: "#08131c",
  contact_email: "",
  contact_phone: "",
  show_stats: true,
  hero_image_url: "",
  center_image_url: "",
  features: [],
  testimonials: [],
  programs: [],
  languages: [],
  copy: EMPTY_COPY,
};

function landingColors(landing = {}) {
  const primary = (landing.primary_color || "").toLowerCase();
  const secondary = (landing.secondary_color || "").toLowerCase();
  return {
    primary: !primary || GENERIC.has(primary) ? "#e8b86d" : landing.primary_color,
    secondary: !secondary || GENERIC.has(secondary) ? "#08131c" : landing.secondary_color,
  };
}

function padPoints(list) {
  const next = [...(list || [])].map((item) => item || "");
  while (next.length < 3) next.push("");
  return next.slice(0, 5);
}

function padSteps(list) {
  const next = [...(list || [])].map((item) => ({ title: item?.title || "", desc: item?.desc || "" }));
  while (next.length < 3) next.push({ title: "", desc: "" });
  return next;
}

function fromTenant(landing) {
  if (!landing) return EMPTY;
  const colors = landingColors(landing);
  const copy = { ...EMPTY_COPY, ...(landing.copy || {}) };
  return {
    hero_title: landing.hero_title || "",
    hero_subtitle: landing.hero_subtitle || "",
    about: landing.about || "",
    primary_color: colors.primary,
    secondary_color: colors.secondary,
    contact_email: landing.contact_email || "",
    contact_phone: landing.contact_phone || "",
    show_stats: landing.show_stats !== false,
    hero_image_url: landing.hero_image_url || "",
    center_image_url: landing.center_image_url || "",
    features: landing.features || [],
    testimonials: landing.testimonials || [],
    programs: landing.programs || [],
    languages: (landing.languages || []).map((lang) => ({
      name: lang.name || "",
      flag: lang.flag || "",
    })),
    copy: {
      ...copy,
      about_points: padPoints(copy.about_points),
      admissions_points: padPoints(copy.admissions_points),
      admissions_steps: padSteps(copy.admissions_steps),
      apply_steps: padSteps(copy.apply_steps),
    },
  };
}

function TextField({ label, value, onChange, textarea, placeholder, maxLength }) {
  return (
    <label className="lps-label">
      {label}
      {textarea ? (
        <textarea className="lps-input lps-textarea" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
      ) : (
        <input className="lps-input" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
      )}
    </label>
  );
}

export default function LandingPageSettings() {
  const tenant = useTenant();
  const [tab, setTab] = useState("hero");
  const [settings, setSettings] = useState(EMPTY);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(EMPTY));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const hydrated = useRef(false);
  const copy = settings.copy || EMPTY_COPY;

  useEffect(() => {
    if (!tenant.landing || hydrated.current) return;
    const next = fromTenant(tenant.landing);
    setSettings(next);
    setSavedSnapshot(JSON.stringify(next));
    hydrated.current = true;
  }, [tenant.landing]);

  const dirty = JSON.stringify(settings) !== savedSnapshot;
  const previewUrl = tenant.schoolSlug ? `/s/${tenant.schoolSlug}` : "/";
  const applyUrl = tenant.schoolSlug ? `/s/${tenant.schoolSlug}/apply` : "/apply";
  const stats = tenant.landing?.stats || {};

  const setField = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const setCopy = (key, value) =>
    setSettings((prev) => ({ ...prev, copy: { ...prev.copy, [key]: value } }));

  const updateItem = (listKey, index, field, value) => {
    setSettings((prev) => {
      const next = [...prev[listKey]];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [listKey]: next };
    });
  };

  const addItem = (listKey, item) => {
    setSettings((prev) => ({ ...prev, [listKey]: [...prev[listKey], item] }));
  };

  const removeItem = (listKey, index) => {
    setSettings((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== index),
    }));
  };

  const uploadImage = async (file, field) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setUploading(field);
    setError("");
    try {
      const res = await api.post("/school/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setField(field, res.data.url);
    } catch {
      setError("Image upload failed. Try a smaller JPG or PNG.");
    } finally {
      setUploading("");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await api.put("/school/landing-settings/", settings);
      const snap = JSON.stringify(settings);
      setSavedSnapshot(snap);
      setMessage("All website pages updated. Open Preview to see landing and admission form.");
      if (tenant.refreshTenant) await tenant.refreshTenant();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save landing settings.");
    } finally {
      setLoading(false);
    }
  };

  const preview = useMemo(
    () => ({
      title: settings.hero_title || `A brighter future begins at ${tenant.schoolName || "your school"}`,
      subtitle: settings.hero_subtitle || "Quality education, caring teachers, and a campus where every student is known.",
      kicker: copy.hero_kicker || tenant.schoolName || "Your school",
      primary: settings.primary_color || "#e8b86d",
      secondary: settings.secondary_color || "#08131c",
    }),
    [settings.hero_title, settings.hero_subtitle, settings.primary_color, settings.secondary_color, copy.hero_kicker, tenant.schoolName]
  );

  return (
    <div className="page lps-page">
      <header className="lps-header">
        <div>
          <p className="lps-kicker">Public website</p>
          <h1>Landing page</h1>
          <p>
            Hero, About, Programs, Admissions form, and footer — har section ki text yahan se update hoti hai.
          </p>
        </div>
        <div className="lps-header-actions">
          {dirty && <span className="lps-dirty">Unsaved changes</span>}
          <a href={previewUrl} target="_blank" rel="noreferrer" className="lps-btn lps-btn-ghost">
            <ExternalLink size={16} /> Landing
          </a>
          <a href={applyUrl} target="_blank" rel="noreferrer" className="lps-btn lps-btn-ghost">
            <ExternalLink size={16} /> Apply page
          </a>
          <button className="lps-btn lps-btn-primary" onClick={handleSave} disabled={loading || !dirty}>
            <Save size={16} />
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {message && (
        <div className="lps-banner is-ok">
          <CheckCircle size={16} /> {message}
        </div>
      )}
      {error && <div className="lps-banner is-err">{error}</div>}

      <nav className="lps-tabs">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="lps-layout">
        <div className="lps-editor">
          {tab === "hero" && (
            <section className="lps-card">
              <h2>Hero & header</h2>
              <p className="lps-help">Top bar, logo line, headline, buttons, and campus caption.</p>
              <TextField label="Top bar" value={copy.topbar_text} onChange={(v) => setCopy("topbar_text", v)} placeholder="Admissions 2026 are open" />
              <TextField label="Logo tagline" value={copy.nav_tagline} onChange={(v) => setCopy("nav_tagline", v)} placeholder="Excellence in education" />
              <TextField label="Small kicker" value={copy.hero_kicker} onChange={(v) => setCopy("hero_kicker", v)} placeholder={`Welcome to ${tenant.schoolName || "school"}`} />
              <TextField label="Headline" value={settings.hero_title} onChange={(v) => setField("hero_title", v)} maxLength={80} />
              <TextField label="Introduction" value={settings.hero_subtitle} onChange={(v) => setField("hero_subtitle", v)} textarea />
              <div className="lps-row">
                <TextField label="Primary button" value={copy.hero_primary_btn} onChange={(v) => setCopy("hero_primary_btn", v)} placeholder="Apply for admission" />
                <TextField label="Secondary button" value={copy.hero_secondary_btn} onChange={(v) => setCopy("hero_secondary_btn", v)} placeholder="Learn about us" />
              </div>
              <TextField label="Campus caption" value={copy.campus_caption} onChange={(v) => setCopy("campus_caption", v)} placeholder="A tradition of excellence" />
              <ImageField
                label="Hero photo"
                value={settings.hero_image_url}
                uploading={uploading === "hero_image_url"}
                onUrl={(url) => setField("hero_image_url", url)}
                onFile={(file) => uploadImage(file, "hero_image_url")}
              />
            </section>
          )}

          {tab === "about" && (
            <section className="lps-card">
              <h2>About</h2>
              <p className="lps-help">About section headings, story, checklist, and photo.</p>
              <TextField label="Kicker" value={copy.about_kicker} onChange={(v) => setCopy("about_kicker", v)} />
              <TextField label="Title" value={copy.about_title} onChange={(v) => setCopy("about_title", v)} />
              <TextField label="About text" value={settings.about} onChange={(v) => setField("about", v)} textarea />
              <TextField label="Photo fallback text" value={copy.about_fallback} onChange={(v) => setCopy("about_fallback", v)} />
              <p className="lps-label-text">Checklist points</p>
              {copy.about_points.map((point, i) => (
                <input key={i} className="lps-input" style={{ marginBottom: 10 }} value={point} onChange={(e) => {
                  const next = [...copy.about_points];
                  next[i] = e.target.value;
                  setCopy("about_points", next);
                }} placeholder={`Point ${i + 1}`} />
              ))}
              <ImageField
                label="About / campus photo"
                value={settings.center_image_url}
                uploading={uploading === "center_image_url"}
                onUrl={(url) => setField("center_image_url", url)}
                onFile={(file) => uploadImage(file, "center_image_url")}
              />
            </section>
          )}

          {tab === "highlights" && (
            <section className="lps-card">
              <div className="lps-card-head">
                <div>
                  <h2>Highlights</h2>
                  <p className="lps-help">Section headings plus the cards shown on the website.</p>
                </div>
                <button className="lps-btn lps-btn-ghost" type="button" onClick={() => addItem("features", { title: "", desc: "" })}>
                  <Plus size={16} /> Add highlight
                </button>
              </div>
              <TextField label="Kicker" value={copy.features_kicker} onChange={(v) => setCopy("features_kicker", v)} />
              <TextField label="Title" value={copy.features_title} onChange={(v) => setCopy("features_title", v)} />
              <TextField label="Subtitle" value={copy.features_subtitle} onChange={(v) => setCopy("features_subtitle", v)} textarea />
              {settings.features.map((feature, i) => (
                <article key={i} className="lps-item">
                  <header>
                    <span>Highlight {i + 1}</span>
                    <button type="button" onClick={() => removeItem("features", i)} aria-label="Remove"><Trash2 size={16} /></button>
                  </header>
                  <input className="lps-input" value={feature.title || ""} placeholder="Title" onChange={(e) => updateItem("features", i, "title", e.target.value)} />
                  <textarea className="lps-input lps-textarea" value={feature.desc || ""} placeholder="Description" onChange={(e) => updateItem("features", i, "desc", e.target.value)} />
                </article>
              ))}
            </section>
          )}

          {tab === "programs" && (
            <section className="lps-card">
              <div className="lps-card-head">
                <div>
                  <h2>Programs</h2>
                  <p className="lps-help">Academics headings and each programme card.</p>
                </div>
                <button className="lps-btn lps-btn-ghost" type="button" onClick={() => addItem("programs", { title: "", age: "", price: "", badge: "", desc: "" })}>
                  <Plus size={16} /> Add program
                </button>
              </div>
              <TextField label="Kicker" value={copy.programs_kicker} onChange={(v) => setCopy("programs_kicker", v)} />
              <TextField label="Title" value={copy.programs_title} onChange={(v) => setCopy("programs_title", v)} />
              <TextField label="Subtitle" value={copy.programs_subtitle} onChange={(v) => setCopy("programs_subtitle", v)} textarea />
              <div className="lps-row">
                <TextField label="Default fee label" value={copy.program_enroll_label} onChange={(v) => setCopy("program_enroll_label", v)} placeholder="Now enrolling" />
                <TextField label="Card button" value={copy.program_apply_btn} onChange={(v) => setCopy("program_apply_btn", v)} placeholder="Apply" />
              </div>
              {settings.programs.map((program, i) => (
                <article key={i} className="lps-item">
                  <header>
                    <span>Program {i + 1}</span>
                    <button type="button" onClick={() => removeItem("programs", i)} aria-label="Remove"><Trash2 size={16} /></button>
                  </header>
                  <div className="lps-row">
                    <input className="lps-input" value={program.title || ""} placeholder="Program title" onChange={(e) => updateItem("programs", i, "title", e.target.value)} />
                    <input className="lps-input" value={program.age || ""} placeholder="Grades / ages" onChange={(e) => updateItem("programs", i, "age", e.target.value)} />
                  </div>
                  <div className="lps-row">
                    <input className="lps-input" value={program.price || ""} placeholder="Fee note (optional)" onChange={(e) => updateItem("programs", i, "price", e.target.value)} />
                    <input className="lps-input" value={program.badge || ""} placeholder="Badge, e.g. Popular" onChange={(e) => updateItem("programs", i, "badge", e.target.value)} />
                  </div>
                  <textarea className="lps-input lps-textarea" value={program.desc || ""} placeholder="Description" onChange={(e) => updateItem("programs", i, "desc", e.target.value)} />
                </article>
              ))}
            </section>
          )}

          {tab === "admissions" && (
            <>
              <section className="lps-card">
                <h2>Landing admissions block</h2>
                <p className="lps-help">The Apply section on the school website, before the form page.</p>
                <TextField label="Kicker" value={copy.admissions_kicker} onChange={(v) => setCopy("admissions_kicker", v)} />
                <TextField label="Title" value={copy.admissions_title} onChange={(v) => setCopy("admissions_title", v)} />
                <TextField label="Description" value={copy.admissions_subtitle} onChange={(v) => setCopy("admissions_subtitle", v)} textarea />
                <TextField label="Button" value={copy.admissions_button} onChange={(v) => setCopy("admissions_button", v)} placeholder="Open admission form" />
                <p className="lps-label-text">Checklist</p>
                {copy.admissions_points.map((point, i) => (
                  <input key={i} className="lps-input" style={{ marginBottom: 10 }} value={point} onChange={(e) => {
                    const next = [...copy.admissions_points];
                    next[i] = e.target.value;
                    setCopy("admissions_points", next);
                  }} placeholder={`Point ${i + 1}`} />
                ))}
                <p className="lps-label-text">Three steps</p>
                {copy.admissions_steps.map((step, i) => (
                  <div key={i} className="lps-row" style={{ marginBottom: 10 }}>
                    <input className="lps-input" value={step.title} placeholder={`Step ${i + 1} title`} onChange={(e) => {
                      const next = [...copy.admissions_steps];
                      next[i] = { ...next[i], title: e.target.value };
                      setCopy("admissions_steps", next);
                    }} />
                    <input className="lps-input" value={step.desc} placeholder="Description" onChange={(e) => {
                      const next = [...copy.admissions_steps];
                      next[i] = { ...next[i], desc: e.target.value };
                      setCopy("admissions_steps", next);
                    }} />
                  </div>
                ))}
              </section>
              <section className="lps-card">
                <h2>Admission form page</h2>
                <p className="lps-help">The separate apply page parents open after clicking Apply.</p>
                <TextField label="Kicker" value={copy.apply_kicker} onChange={(v) => setCopy("apply_kicker", v)} />
                <TextField label="Title" value={copy.apply_title} onChange={(v) => setCopy("apply_title", v)} />
                <TextField label="Intro" value={copy.apply_intro} onChange={(v) => setCopy("apply_intro", v)} textarea />
                <p className="lps-label-text">Apply page steps</p>
                {copy.apply_steps.map((step, i) => (
                  <div key={i} className="lps-row" style={{ marginBottom: 10 }}>
                    <input className="lps-input" value={step.title} placeholder={`Step ${i + 1}`} onChange={(e) => {
                      const next = [...copy.apply_steps];
                      next[i] = { ...next[i], title: e.target.value };
                      setCopy("apply_steps", next);
                    }} />
                    <input className="lps-input" value={step.desc} placeholder="Description" onChange={(e) => {
                      const next = [...copy.apply_steps];
                      next[i] = { ...next[i], desc: e.target.value };
                      setCopy("apply_steps", next);
                    }} />
                  </div>
                ))}
                <TextField label="Success title" value={copy.apply_success_title} onChange={(v) => setCopy("apply_success_title", v)} />
                <TextField label="Success message" value={copy.apply_success_text} onChange={(v) => setCopy("apply_success_text", v)} textarea />
                <TextField label="Final CTA title" value={copy.cta_title} onChange={(v) => setCopy("cta_title", v)} />
                <TextField label="Final CTA text" value={copy.cta_subtitle} onChange={(v) => setCopy("cta_subtitle", v)} textarea />
                <div className="lps-row">
                  <TextField label="Apply button" value={copy.cta_apply_btn} onChange={(v) => setCopy("cta_apply_btn", v)} />
                  <TextField label="Login button" value={copy.cta_login_btn} onChange={(v) => setCopy("cta_login_btn", v)} />
                </div>
              </section>
            </>
          )}

          {tab === "families" && (
            <>
              <section className="lps-card">
                <div className="lps-card-head">
                  <div>
                    <h2>Parent testimonials</h2>
                    <p className="lps-help">Section headings and quotes shown on the website.</p>
                  </div>
                  <button className="lps-btn lps-btn-ghost" type="button" onClick={() => addItem("testimonials", { name: "", role: "", quote: "", img: "" })}>
                    <Plus size={16} /> Add quote
                  </button>
                </div>
                <TextField label="Kicker" value={copy.reviews_kicker} onChange={(v) => setCopy("reviews_kicker", v)} />
                <TextField label="Title" value={copy.reviews_title} onChange={(v) => setCopy("reviews_title", v)} />
                {settings.testimonials.map((item, i) => (
                  <article key={i} className="lps-item">
                    <header>
                      <span>Quote {i + 1}</span>
                      <button type="button" onClick={() => removeItem("testimonials", i)} aria-label="Remove"><Trash2 size={16} /></button>
                    </header>
                    <div className="lps-row">
                      <input className="lps-input" value={item.name || ""} placeholder="Parent name" onChange={(e) => updateItem("testimonials", i, "name", e.target.value)} />
                      <input className="lps-input" value={item.role || ""} placeholder="Role" onChange={(e) => updateItem("testimonials", i, "role", e.target.value)} />
                    </div>
                    <textarea className="lps-input lps-textarea" value={item.quote || ""} placeholder="Their words" onChange={(e) => updateItem("testimonials", i, "quote", e.target.value)} />
                  </article>
                ))}
              </section>
              <section className="lps-card">
                <div className="lps-card-head">
                  <div>
                    <h2>Languages</h2>
                    <p className="lps-help">Optional. Leave empty to hide this block on the website.</p>
                  </div>
                  <button className="lps-btn lps-btn-ghost" type="button" onClick={() => addItem("languages", { name: "", flag: "" })}>
                    <Plus size={16} /> Add language
                  </button>
                </div>
                <div className="lps-row">
                  <TextField label="Kicker" value={copy.languages_kicker} onChange={(v) => setCopy("languages_kicker", v)} />
                  <TextField label="Title" value={copy.languages_title} onChange={(v) => setCopy("languages_title", v)} />
                </div>
                {settings.languages.map((lang, i) => (
                  <div key={i} className="lps-lang-row">
                    <Globe size={16} />
                    <input className="lps-input lps-flag" value={lang.flag || ""} placeholder="🇵🇰" onChange={(e) => updateItem("languages", i, "flag", e.target.value)} />
                    <input className="lps-input" value={lang.name || ""} placeholder="Language name" onChange={(e) => updateItem("languages", i, "name", e.target.value)} />
                    <button type="button" onClick={() => removeItem("languages", i)} aria-label="Remove"><Trash2 size={16} /></button>
                  </div>
                ))}
              </section>
            </>
          )}

          {tab === "look" && (
            <>
              <section className="lps-card">
                <h2>Website colors</h2>
                <p className="lps-help">Public school site only — admin dashboard colors stay the same.</p>
                <div className="lps-presets">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="lps-preset"
                      onClick={() => setSettings((prev) => ({ ...prev, primary_color: preset.primary, secondary_color: preset.secondary }))}
                    >
                      <span style={{ background: preset.secondary }}><i style={{ background: preset.primary }} /></span>
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="lps-row">
                  <label className="lps-label">
                    Accent
                    <div className="lps-color">
                      <input type="color" value={settings.primary_color} onChange={(e) => setField("primary_color", e.target.value)} />
                      <span>{settings.primary_color}</span>
                    </div>
                  </label>
                  <label className="lps-label">
                    Dark base
                    <div className="lps-color">
                      <input type="color" value={settings.secondary_color} onChange={(e) => setField("secondary_color", e.target.value)} />
                      <span>{settings.secondary_color}</span>
                    </div>
                  </label>
                </div>
              </section>
              <section className="lps-card">
                <h2>Contact & footer</h2>
                <div className="lps-row">
                  <TextField label="Email" value={settings.contact_email} onChange={(v) => setField("contact_email", v)} placeholder="admissions@school.com" />
                  <TextField label="Phone" value={settings.contact_phone} onChange={(v) => setField("contact_phone", v)} placeholder="03xx xxx xxxx" />
                </div>
                <TextField label="Address line" value={copy.footer_address} onChange={(v) => setCopy("footer_address", v)} placeholder="School campus" />
                <div className="lps-toggle">
                  <div>
                    <strong>Show live stats</strong>
                    <p>Currently {stats.students ?? "—"} students, {stats.teachers ?? "—"} teachers, {stats.courses ?? "—"} classes.</p>
                  </div>
                  <label className="lps-switch">
                    <input type="checkbox" checked={settings.show_stats} onChange={(e) => setField("show_stats", e.target.checked)} />
                    <span />
                  </label>
                </div>
                <div className="lps-row">
                  <TextField label="Students label" value={copy.stats_students_label} onChange={(v) => setCopy("stats_students_label", v)} />
                  <TextField label="Teachers label" value={copy.stats_teachers_label} onChange={(v) => setCopy("stats_teachers_label", v)} />
                </div>
                <div className="lps-row">
                  <TextField label="Classes label" value={copy.stats_classes_label} onChange={(v) => setCopy("stats_classes_label", v)} />
                  <TextField label="Admissions value" value={copy.stats_admissions_value} onChange={(v) => setCopy("stats_admissions_value", v)} />
                </div>
                <TextField label="Admissions label" value={copy.stats_admissions_label} onChange={(v) => setCopy("stats_admissions_label", v)} />
              </section>
            </>
          )}
        </div>

        <aside className="lps-preview">
          <div className="lps-preview-card" style={{ "--preview-primary": preview.primary, "--preview-secondary": preview.secondary }}>
            <p>Live preview</p>
            <div className="lps-hero-mock">
              {settings.hero_image_url ? <img src={settings.hero_image_url} alt="" /> : <div className="lps-hero-fallback">{(tenant.schoolName || "S").slice(0, 1)}</div>}
              <div className="lps-hero-copy">
                <small>{preview.kicker}</small>
                <strong>{preview.title}</strong>
                <span>{preview.subtitle}</span>
              </div>
            </div>
            <div className="lps-preview-meta">
              <span><Phone size={14} /> {settings.contact_phone || "Phone not set"}</span>
              <a href={tab === "admissions" ? applyUrl : previewUrl} target="_blank" rel="noreferrer">
                Open {tab === "admissions" ? "apply page" : "website"} <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ImageField({ label, value, uploading, onUrl, onFile }) {
  return (
    <div className="lps-field">
      <span className="lps-label-text">{label}</span>
      <div className="lps-image-field">
        <div className="lps-thumb">{value ? <img src={value} alt="" /> : <ImageIcon size={22} />}</div>
        <div className="lps-image-controls">
          <input className="lps-input" value={value} onChange={(e) => onUrl(e.target.value)} placeholder="Paste image URL" />
          <label className="lps-btn lps-btn-ghost lps-upload">
            <Upload size={16} />
            {uploading ? "Uploading…" : "Upload from PC"}
            <input type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
      </div>
    </div>
  );
}
