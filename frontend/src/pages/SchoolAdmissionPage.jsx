import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, ClipboardList, Mail, MapPin, Phone } from "lucide-react";
import { useTenant } from "../context/TenantContext";
import api from "../api/axios";
import { listAdmissions, saveAdmission, removeAdmission } from "./admissionStorage";
import "./SchoolLandingPage.css";
import "./SchoolAdmissionPage.css";

const EMPTY_ENROLL = {
  student_name: "",
  student_age: "",
  gender: "",
  date_of_birth: "",
  class_applying: "",
  previous_school: "",
  bform_cnic: "",
  address: "",
  city: "",
  father_name: "",
  father_phone: "",
  father_cnic: "",
  father_occupation: "",
  mother_name: "",
  mother_phone: "",
  email: "",
  emergency_phone: "",
  notes: "",
};

const FIELD_LABELS = [
  ["student_name", "Student name"],
  ["gender", "Gender"],
  ["student_age", "Age"],
  ["date_of_birth", "Date of birth"],
  ["bform_cnic", "B-Form / CNIC"],
  ["class_applying", "Class applying for"],
  ["previous_school", "Previous school"],
  ["father_name", "Father / guardian"],
  ["father_phone", "Phone"],
  ["father_cnic", "Guardian CNIC"],
  ["father_occupation", "Occupation"],
  ["mother_name", "Mother’s name"],
  ["mother_phone", "Mother’s phone"],
  ["email", "Email"],
  ["emergency_phone", "Emergency phone"],
  ["address", "Home address"],
  ["city", "City"],
  ["notes", "Additional notes"],
];

const DEFAULT_CLASSES = [
  "Nursery", "KG-I", "KG-II",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "First Year", "Second Year",
];

const GENERIC = new Set(["#3b82f6", "#1e40af", "#1d4ed8", "#2563eb", "#1e293b"]);

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#e8b86d");
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "232, 184, 109";
}

function newLocalId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `local-${Date.now()}`;
}

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function schoolHomePath(schoolSlug, tenantSlug) {
  if (schoolSlug) return `/s/${schoolSlug}`;
  if (tenantSlug) return `/s/${tenantSlug}`;
  return "/";
}

export function schoolApplyPath(schoolSlug, tenantSlug) {
  if (schoolSlug) return `/s/${schoolSlug}/apply`;
  if (tenantSlug) return `/s/${tenantSlug}/apply`;
  return "/apply";
}

export default function SchoolAdmissionPage() {
  const tenant = useTenant();
  const navigate = useNavigate();
  const { school_slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrollData, setEnrollData] = useState(EMPTY_ENROLL);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [savedApps, setSavedApps] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const schoolKey = tenant.schoolSlug || school_slug;
  const schoolId = tenant.schoolId;

  const refreshSaved = () => {
    const rows = listAdmissions(schoolId, schoolKey);
    setSavedApps(rows);
    return rows;
  };

  useEffect(() => {
    if (school_slug) tenant.setForcedSchool(school_slug);
  }, [school_slug]);

  useEffect(() => {
    if (!schoolId && !schoolKey) return;
    const rows = refreshSaved();
    if (searchParams.get("saved") === "1" && rows.length) {
      setShowSaved(true);
      setSelectedId(rows[0].id);
      setSearchParams({}, { replace: true });
    }
  }, [schoolId, schoolKey]);

  const schoolName = tenant.schoolName || "Our School";
  const homePath = schoolHomePath(school_slug, tenant.schoolSlug);

  useEffect(() => {
    document.title = `Apply | ${schoolName}`;
    window.scrollTo(0, 0);
    return () => {
      document.title = "Classora";
    };
  }, [schoolName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const snapshot = { ...enrollData };
    try {
      const res = await api.post("/enrollments/", {
        ...snapshot,
        school: tenant.schoolId,
        status: "Pending",
        date_of_birth: snapshot.date_of_birth || null,
        student_age: Number(snapshot.student_age),
      });
      const record = {
        id: String(res.data?.id || newLocalId()),
        submittedAt: new Date().toISOString(),
        status: res.data?.status || "Pending",
        schoolId: tenant.schoolId,
        schoolName,
        data: snapshot,
      };
      const rows = saveAdmission(schoolId, schoolKey, record);
      setSavedApps(rows);
      setSelectedId(record.id);
      setSubmitSuccess(true);
      setShowSaved(false);
      setEnrollData(EMPTY_ENROLL);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err.response?.data?.detail || "Could not submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openSaved = (id) => {
    setSubmitSuccess(false);
    setShowSaved(true);
    setSelectedId(id || savedApps[0]?.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewForm = () => {
    setSubmitSuccess(false);
    setShowSaved(false);
    setSubmitError("");
  };

  const reuseDetails = (app) => {
    setEnrollData({ ...EMPTY_ENROLL, ...(app?.data || {}) });
    startNewForm();
  };

  const deleteSaved = (id) => {
    const rows = removeAdmission(schoolId, schoolKey, id);
    setSavedApps(rows);
    if (!rows.length) {
      setShowSaved(false);
      setSelectedId(null);
      return;
    }
    if (String(selectedId) === String(id)) setSelectedId(rows[0].id);
  };

  if (tenant.loading) {
    return (
      <div className="slp-loading">
        <div className="slp-spinner" />
        <p>Loading school…</p>
      </div>
    );
  }

  if (!tenant.schoolName) {
    return (
      <div className="slp-loading">
        <h2>School not found</h2>
        <p>Open the school website first, then start an application.</p>
        <button className="slp-btn-primary" onClick={() => navigate("/")}>
          Go to platform
        </button>
      </div>
    );
  }

  const rawPrimary = (tenant.branding?.landing?.primary_color || tenant.landing?.primary_color || "").toLowerCase();
  const rawSecondary = (tenant.branding?.landing?.secondary_color || tenant.landing?.secondary_color || "").toLowerCase();
  const usingGeneric = !rawPrimary || GENERIC.has(rawPrimary) || GENERIC.has(rawSecondary);
  const primaryColor = usingGeneric ? "#e8b86d" : (tenant.branding?.landing?.primary_color || tenant.landing?.primary_color);
  const secondaryColor = usingGeneric ? "#08131c" : (tenant.branding?.landing?.secondary_color || tenant.landing?.secondary_color || "#08131c");
  const logoUrl = tenant.branding?.logo
    ? tenant.branding.logo.startsWith("http")
      ? tenant.branding.logo
      : `${api.defaults.baseURL.replace("/api", "")}${tenant.branding.logo}`
    : null;
  const copy = tenant.landing?.copy || {};
  const email = tenant.landing?.contact_email || "";
  const phone = tenant.landing?.contact_phone || "";
  const classes = tenant.landing?.classes?.length
    ? tenant.landing.classes.map((c) => c.label)
    : DEFAULT_CLASSES;
  const applySteps = copy.apply_steps?.length
    ? copy.apply_steps
    : [
        { title: "1. Submit", desc: "Share student, class, and parent details." },
        { title: "2. Review", desc: "The school checks the application." },
        { title: "3. Next step", desc: "You will be contacted for a visit or confirmation." },
      ];
  const initials = schoolName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const setField = (key) => (e) => setEnrollData({ ...enrollData, [key]: e.target.value });
  const selected = savedApps.find((row) => String(row.id) === String(selectedId)) || savedApps[0] || null;

  return (
    <div
      className="slp-wrapper sap-page"
      style={{
        "--slp-primary": primaryColor,
        "--slp-secondary": secondaryColor,
        "--slp-primary-rgb": hexToRgb(primaryColor),
        "--slp-secondary-rgb": hexToRgb(secondaryColor),
      }}
    >
      <header className="sap-top">
        <button className="sap-back" type="button" onClick={() => navigate(homePath)}>
          <ArrowLeft size={18} /> Back to {schoolName}
        </button>
        <div className="slp-logo sap-brand">
          <div className="slp-crest">
            {logoUrl ? <img src={logoUrl} alt="" /> : <span>{initials || "S"}</span>}
          </div>
          <div className="slp-logo-copy">
            <strong>{schoolName}</strong>
            <small>{copy.nav_tagline || "Admission application"}</small>
          </div>
        </div>
        {savedApps.length > 0 && (
          <button className="sap-saved-nav" type="button" onClick={() => openSaved()}>
            <ClipboardList size={16} /> My applications ({savedApps.length})
          </button>
        )}
      </header>

      <div className="sap-layout">
        <aside className="sap-aside">
          <p className="slp-kicker">{copy.apply_kicker || `Admissions ${new Date().getFullYear()}`}</p>
          <h1>{copy.apply_title || "Apply for a place"}</h1>
          <p>
            {copy.apply_intro || `Complete this form for ${schoolName}. The admissions team will review it and contact you with the next steps.`}
          </p>
          <ol className="sap-steps">
            {applySteps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.desc}</span>
              </li>
            ))}
          </ol>
          <div className="sap-contact">
            {email && (
              <a href={`mailto:${email}`}>
                <Mail size={16} /> {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`}>
                <Phone size={16} /> {phone}
              </a>
            )}
            <p>
              <MapPin size={16} /> {copy.footer_address || "School campus"}
            </p>
          </div>
        </aside>

        {submitSuccess ? (
          <section className="sap-success">
            <CheckCircle size={42} />
            <h2>{copy.apply_success_title || "Application received"}</h2>
            <p>
              {copy.apply_success_text || `Thank you. ${schoolName} will contact you soon about this admission request.`}
            </p>
            <p className="sap-success-note">A copy is saved on this device so you can open it again later.</p>
            <div className="sap-success-actions">
              <button className="slp-btn-gold slp-btn-lg" type="button" onClick={() => openSaved(selectedId)}>
                View my request
              </button>
              <button className="slp-btn-light slp-btn-lg" type="button" onClick={startNewForm}>
                Submit another
              </button>
              <button className="slp-btn-light slp-btn-lg" type="button" onClick={() => navigate(homePath)}>
                Back to website
              </button>
            </div>
          </section>
        ) : showSaved && selected ? (
          <section className="sap-saved">
            <div className="sap-saved-head">
              <div>
                <p className="slp-kicker">Saved on this browser</p>
                <h2>Your applications</h2>
              </div>
              <button className="slp-btn-gold" type="button" onClick={startNewForm}>
                Submit another
              </button>
            </div>
            {savedApps.length > 1 && (
              <div className="sap-saved-list">
                {savedApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`sap-saved-chip ${String(app.id) === String(selected.id) ? "is-active" : ""}`}
                    onClick={() => setSelectedId(app.id)}
                  >
                    <strong>{app.data?.student_name || "Application"}</strong>
                    <span>{app.data?.class_applying || "Class"} · {formatWhen(app.submittedAt)}</span>
                  </button>
                ))}
              </div>
            )}
            <article className="sap-saved-card">
              <header>
                <div>
                  <h3>{selected.data?.student_name || "Admission request"}</h3>
                  <p>Sent {formatWhen(selected.submittedAt)}</p>
                </div>
                <span className="sap-status">{selected.status || "Pending"}</span>
              </header>
              <dl className="sap-saved-fields">
                {FIELD_LABELS.filter(([key]) => String(selected.data?.[key] || "").trim()).map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{selected.data[key]}</dd>
                  </div>
                ))}
              </dl>
              <div className="sap-saved-actions">
                <button className="slp-btn-gold" type="button" onClick={() => reuseDetails(selected)}>
                  Use these details again
                </button>
                <button className="slp-btn-light" type="button" onClick={() => deleteSaved(selected.id)}>
                  Remove from this device
                </button>
              </div>
            </article>
          </section>
        ) : (
          <form className="slp-form sap-form" onSubmit={handleSubmit}>
            <h3>Admission application</h3>
            <p className="slp-form-hint">Required fields are marked with *</p>
            {savedApps.length > 0 && (
              <button className="sap-saved-banner" type="button" onClick={() => openSaved()}>
                You already sent {savedApps.length} application{savedApps.length === 1 ? "" : "s"} from this browser. View {savedApps.length === 1 ? "it" : "them"}.
              </button>
            )}

            <p className="slp-form-section">Student details</p>
            <div className="slp-form-grid">
              <label className="slp-span-2">
                Full name *
                <input required value={enrollData.student_name} onChange={setField("student_name")} placeholder="Student full name" />
              </label>
              <label>
                Gender *
                <select required value={enrollData.gender} onChange={setField("gender")}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>
                Age *
                <input required type="number" min="3" max="22" value={enrollData.student_age} onChange={setField("student_age")} placeholder="Years" />
              </label>
              <label>
                Date of birth
                <input type="date" value={enrollData.date_of_birth} onChange={setField("date_of_birth")} />
              </label>
              <label>
                B-Form / CNIC
                <input value={enrollData.bform_cnic} onChange={setField("bform_cnic")} placeholder="xxxxx-xxxxxxx-x" />
              </label>
            </div>

            <p className="slp-form-section">Class & academics</p>
            <div className="slp-form-grid">
              <label>
                Class applying for *
                <select required value={enrollData.class_applying} onChange={setField("class_applying")}>
                  <option value="">Select class</option>
                  {classes.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Previous school
                <input value={enrollData.previous_school} onChange={setField("previous_school")} placeholder="If transferring" />
              </label>
            </div>

            <p className="slp-form-section">Parent / guardian</p>
            <div className="slp-form-grid">
              <label>
                Father / guardian name *
                <input required value={enrollData.father_name} onChange={setField("father_name")} placeholder="Full name" />
              </label>
              <label>
                Phone *
                <input required type="tel" value={enrollData.father_phone} onChange={setField("father_phone")} placeholder="03xx xxx xxxx" />
              </label>
              <label>
                CNIC
                <input value={enrollData.father_cnic} onChange={setField("father_cnic")} placeholder="xxxxx-xxxxxxx-x" />
              </label>
              <label>
                Occupation
                <input value={enrollData.father_occupation} onChange={setField("father_occupation")} placeholder="Job / business" />
              </label>
              <label>
                Mother’s name
                <input value={enrollData.mother_name} onChange={setField("mother_name")} placeholder="Full name" />
              </label>
              <label>
                Mother’s phone
                <input type="tel" value={enrollData.mother_phone} onChange={setField("mother_phone")} placeholder="03xx xxx xxxx" />
              </label>
              <label>
                Email
                <input type="email" value={enrollData.email} onChange={setField("email")} placeholder="parent@email.com" />
              </label>
              <label>
                Emergency phone
                <input type="tel" value={enrollData.emergency_phone} onChange={setField("emergency_phone")} placeholder="Optional" />
              </label>
            </div>

            <p className="slp-form-section">Address</p>
            <div className="slp-form-grid">
              <label className="slp-span-2">
                Home address *
                <textarea required rows={3} value={enrollData.address} onChange={setField("address")} placeholder="House, street, area" />
              </label>
              <label>
                City *
                <input required value={enrollData.city} onChange={setField("city")} placeholder="City" />
              </label>
              <label>
                Additional notes
                <input value={enrollData.notes} onChange={setField("notes")} placeholder="Any special request" />
              </label>
            </div>

            <button className="slp-btn-gold slp-btn-lg" type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Submit application"}
            </button>
            {submitError && <p className="slp-form-err">{submitError}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
