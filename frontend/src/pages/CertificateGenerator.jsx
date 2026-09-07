import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  CheckCircle2,
  CreditCard,
  FileBadge,
  FileText,
  LayoutGrid,
  Printer,
  RefreshCw,
  Search,
  Settings,
  School as SchoolIcon,
  Shield,
  User,
  X,
  AlertTriangle,
  Upload,
  RotateCcw,
} from "lucide-react";
import { getStudents } from "../api/studentsApi";
import { getClasses } from "../api/classesApi";
import { useTenant } from "../context/TenantContext";
import "./CertificateGenerator.css";

function classLabel(c) {
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

function isHex(value) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value || "");
}

function academicYear() {
  const d = new Date();
  const y = d.getFullYear();
  const start = d.getMonth() >= 7 ? y : y - 1;
  return `${start}-${start + 1}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatLongDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });
}

function relation(gender) {
  const g = (gender || "").toLowerCase();
  if (g === "male") return { child: "son", his: "his", him: "him" };
  if (g === "female") return { child: "daughter", his: "her", him: "her" };
  return { child: "son/daughter", his: "his/her", him: "him/her" };
}

function contactPhone(s) {
  return s?.father_phone || s?.phone || s?.mother_phone || "";
}

function missingFields(s) {
  const miss = [];
  if (!s?.name) miss.push("name");
  if (!s?.class_name) miss.push("class");
  if (!s?.roll_no) miss.push("roll");
  if (!s?.father_name) miss.push("father");
  return miss;
}

function refCode(student, certType, issueDate) {
  const roll = String(student?.roll_no || student?.id || "X").replace(/\s+/g, "");
  const day = (issueDate || "").replace(/-/g, "") || "00000000";
  return `${String(certType).slice(0, 3).toUpperCase()}-${roll}-${day.slice(-6)}`;
}

const DOC_TYPES = [
  { id: "id-card", label: "ID Card", icon: CreditCard },
  { id: "leaving", label: "Transfer", icon: FileText },
  { id: "bonafide", label: "Bonafide", icon: Shield },
  { id: "character", label: "Character", icon: FileBadge },
  { id: "award", label: "Award", icon: Award },
];

const STYLE_PRESETS = [
  { id: "classora", label: "Classora", color: "#F15A24" },
  { id: "navy", label: "Navy", color: "#0F172A" },
  { id: "emerald", label: "Emerald", color: "#059669" },
  { id: "royal", label: "Royal", color: "#2563EB" },
  { id: "maroon", label: "Maroon", color: "#9F1239" },
];

const DEFAULT_SETTINGS = {
  schoolName: "",
  primaryColor: "#F15A24",
  academicYear: academicYear(),
  principalName: "",
  signatureUrl: null,
  logoUrl: "",
  issueDate: todayISO(),
  awardTitle: "Certificate of Excellence",
  awardReason: "For achieving outstanding marks and demonstrating consistent growth in character and academics.",
  idValidityNote: "Valid for the current academic session only.",
  idRules: "This card remains school property. Report loss immediately. Carry while on campus.",
};

function storageKey(schoolId) {
  return `classora-cert-studio:${schoolId || "default"}`;
}

function loadStoredSettings(schoolId) {
  try {
    const raw = localStorage.getItem(storageKey(schoolId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const CertificateGenerator = () => {
  const tenant = useTenant();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [certType, setCertType] = useState("id-card");
  const [customSettings, setCustomSettings] = useState(DEFAULT_SETTINGS);
  const [showSignPad, setShowSignPad] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const brandedOnce = useRef(false);

  const patchSettings = useCallback((patch) => {
    setCustomSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (tenant.loading) return;
    const stored = loadStoredSettings(tenant.schoolId);
    const brandColor =
      tenant.branding?.dashboard?.primary_color ||
      tenant.branding?.landing?.primary_color ||
      "#F15A24";
    setCustomSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      ...prev,
      ...(stored || {}),
      schoolName: stored?.schoolName || tenant.schoolName || prev.schoolName || "School",
      primaryColor: isHex(stored?.primaryColor)
        ? stored.primaryColor
        : isHex(brandColor)
          ? brandColor
          : "#F15A24",
      logoUrl: stored?.logoUrl || tenant.branding?.logo || "",
      academicYear: stored?.academicYear || academicYear(),
      issueDate: stored?.issueDate || todayISO(),
    }));
    brandedOnce.current = true;
    setSettingsReady(true);
  }, [tenant.loading, tenant.schoolId, tenant.schoolName, tenant.branding]);

  useEffect(() => {
    if (!settingsReady) return;
    try {
      localStorage.setItem(
        storageKey(tenant.schoolId),
        JSON.stringify({
          schoolName: customSettings.schoolName,
          primaryColor: customSettings.primaryColor,
          academicYear: customSettings.academicYear,
          principalName: customSettings.principalName,
          signatureUrl: customSettings.signatureUrl,
          logoUrl: customSettings.logoUrl,
          issueDate: customSettings.issueDate,
          awardTitle: customSettings.awardTitle,
          awardReason: customSettings.awardReason,
          idValidityNote: customSettings.idValidityNote,
          idRules: customSettings.idRules,
        })
      );
    } catch {
      /* ignore quota */
    }
  }, [customSettings, settingsReady, tenant.schoolId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [sRes, cRes] = await Promise.all([getStudents(), getClasses()]);
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
      setClasses(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (err) {
      console.error(err);
      setStudents([]);
      setClasses([]);
      setLoadError("Could not load students. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classOptions = useMemo(() => classes.map(classLabel), [classes]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesSearch =
        !q ||
        (s.name || "").toLowerCase().includes(q) ||
        String(s.roll_no || "").toLowerCase().includes(q);
      const matchesClass = selectedClass === "all" || s.class_name === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [students, search, selectedClass]);

  const selectedStudents = useMemo(
    () => selectedIds.map((id) => students.find((s) => s.id === id)).filter(Boolean),
    [selectedIds, students]
  );

  const toggleStudent = (student) => {
    setSelectedIds((prev) =>
      prev.includes(student.id) ? prev.filter((id) => id !== student.id) : [...prev, student.id]
    );
  };

  const selectFiltered = () => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      filteredStudents.forEach((s) => set.add(s.id));
      return [...set];
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const removeSelected = (id) => setSelectedIds((prev) => prev.filter((x) => x !== id));

  const resetSettings = () => {
    const brandColor =
      tenant.branding?.dashboard?.primary_color ||
      tenant.branding?.landing?.primary_color ||
      "#F15A24";
    setCustomSettings({
      ...DEFAULT_SETTINGS,
      schoolName: tenant.schoolName || "School",
      primaryColor: isHex(brandColor) ? brandColor : "#F15A24",
      logoUrl: tenant.branding?.logo || "",
      academicYear: academicYear(),
      issueDate: todayISO(),
    });
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.beginPath();
    ctx.moveTo((point.clientX - rect.left) * scaleX, (point.clientY - rect.top) * scaleY);
    drawing.current = true;
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.lineTo((point.clientX - rect.left) * scaleX, (point.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvas = () => {
    if (!canvasRef.current) return;
    patchSettings({ signatureUrl: canvasRef.current.toDataURL("image/png") });
    setShowSignPad(false);
  };

  const handleImageUpload = (e, key) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => patchSettings({ [key]: reader.result });
    reader.readAsDataURL(file);
  };

  const color = isHex(customSettings.primaryColor) ? customSettings.primaryColor : "#F15A24";
  const schoolName = customSettings.schoolName || tenant.schoolName || "School";
  const logo = customSettings.logoUrl || tenant.branding?.logo;
  const activePreset = STYLE_PRESETS.find((p) => p.color.toLowerCase() === color.toLowerCase())?.id;

  const renderLogo = (size = 24, light = false) =>
    logo ? (
      <span className="cg-logo">
        <img
          src={logo}
          alt=""
          style={{
            height: size,
            maxWidth: size * 2.4,
            filter: light ? "brightness(0) invert(1)" : "none",
          }}
        />
      </span>
    ) : (
      <span className="cg-logo">
        <SchoolIcon size={size} color={light ? "#fff" : color} />
      </span>
    );

  const signatureBlock = (label = "Principal") => (
    <div className="cg-sign">
      {customSettings.signatureUrl ? (
        <img src={customSettings.signatureUrl} alt="" />
      ) : null}
      <div className="cg-line">{customSettings.principalName || label}</div>
      <small>{label}</small>
    </div>
  );

  const renderIdCard = (student) => {
    const phone = contactPhone(student);
    return (
      <div className="cg-id-pair">
        <div className="cg-id-card">
          <div className="cg-id-banner" style={{ background: color }}>
            {renderLogo(28, true)}
            <strong>{schoolName}</strong>
            <span>Student ID · {customSettings.academicYear}</span>
          </div>
          <div className="cg-id-photo">
            {student.photo ? <img src={student.photo} alt="" /> : <User size={42} />}
          </div>
          <div className="cg-id-body">
            <h2>{student.name || "Student"}</h2>
            <p className="cg-role" style={{ color }}>
              Student
            </p>
            <div className="cg-id-rows">
              <div>
                <span>Roll No</span>
                <strong>{student.roll_no || "—"}</strong>
              </div>
              <div>
                <span>Class</span>
                <strong>{student.class_name || "—"}</strong>
              </div>
              <div>
                <span>Father</span>
                <strong>{student.father_name || "N/A"}</strong>
              </div>
              {phone ? (
                <div>
                  <span>Phone</span>
                  <strong>{phone}</strong>
                </div>
              ) : null}
            </div>
          </div>
          <div className="cg-id-foot">
            {customSettings.signatureUrl ? (
              <img src={customSettings.signatureUrl} alt="" />
            ) : (
              <div className="cg-sig-line" />
            )}
            <span>{customSettings.principalName || "Authorized Signature"}</span>
          </div>
        </div>

        <div className="cg-id-card is-back">
          <div className="cg-id-banner" style={{ background: color }}>
            {renderLogo(28, true)}
            <strong>{schoolName}</strong>
            <span>Card reverse · Keep safely</span>
          </div>
          <div className="cg-id-back-body">
            <h3>Validity</h3>
            <p>{customSettings.idValidityNote}</p>
            <h3>Instructions</h3>
            <ul className="cg-id-rules">
              {(customSettings.idRules || "")
                .split(".")
                .map((part) => part.trim())
                .filter(Boolean)
                .map((rule) => (
                  <li key={rule}>{rule}.</li>
                ))}
            </ul>
            <div className="cg-id-contact">
              <div className="cg-id-rows">
                <div>
                  <span>Emergency</span>
                  <strong>{phone || student.emergency_phone || "School office"}</strong>
                </div>
                <div>
                  <span>Session</span>
                  <strong>{customSettings.academicYear}</strong>
                </div>
                <div>
                  <span>Ref</span>
                  <strong>{refCode(student, "id", customSettings.issueDate)}</strong>
                </div>
              </div>
            </div>
            <div className="cg-id-foot" style={{ position: "static", marginTop: 4 }}>
              {customSettings.signatureUrl ? (
                <img src={customSettings.signatureUrl} alt="" />
              ) : (
                <div className="cg-sig-line" />
              )}
              <span>{customSettings.principalName || "Principal"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificate = (student) => {
    const rel = relation(student.gender);
    const issued = formatLongDate(customSettings.issueDate);
    const code = refCode(student, certType, customSettings.issueDate);

    let title = "";
    let body = null;
    let award = false;

    if (certType === "leaving") {
      title = "School Leaving Certificate";
      body = (
        <p className="cg-body">
          This is to certify that <strong>{student.name || "—"}</strong>, {rel.child} of{" "}
          <strong>{student.father_name || "N/A"}</strong>, was a bona fide student of{" "}
          <strong>{schoolName}</strong> in <strong>{student.class_name || "their class"}</strong>
          {student.roll_no ? <> (Roll No. <strong>{student.roll_no}</strong>)</> : null}.{" "}
          {rel.his.charAt(0).toUpperCase() + rel.his.slice(1)} conduct during the stay was satisfactory.
          We wish {rel.him} success in future studies.
        </p>
      );
    } else if (certType === "bonafide") {
      title = "Bonafide Certificate";
      body = (
        <p className="cg-body">
          This is to certify that <strong>{student.name || "—"}</strong>, {rel.child} of{" "}
          <strong>{student.father_name || "N/A"}</strong>, is a bona fide student of{" "}
          <strong>{schoolName}</strong>, currently studying in{" "}
          <strong>{student.class_name || "their class"}</strong>
          {student.roll_no ? <> (Roll No. <strong>{student.roll_no}</strong>)</> : null} during the
          academic year <strong>{customSettings.academicYear}</strong>. This certificate is issued on
          request for official purposes.
        </p>
      );
    } else if (certType === "character") {
      title = "Character Certificate";
      body = (
        <p className="cg-body">
          This is to certify that <strong>{student.name || "—"}</strong>, {rel.child} of{" "}
          <strong>{student.father_name || "N/A"}</strong>, is/was a student of{" "}
          <strong>{schoolName}</strong> in <strong>{student.class_name || "their class"}</strong>. To
          the best of our knowledge {rel.his} character and conduct have been good.
        </p>
      );
    } else {
      award = true;
      title = customSettings.awardTitle || "Certificate of Excellence";
      body = (
        <>
          <div className="cg-award-icon">
            <Award size={52} />
          </div>
          <p className="cg-award-school">{schoolName}</p>
          <p className="cg-award-to">Proudly presented to</p>
          <h2 className="cg-award-name">{student.name || "—"}</h2>
          <p className="cg-body">
            {customSettings.awardReason} Session <strong>{customSettings.academicYear}</strong>
            {student.class_name ? <>, {student.class_name}</> : null}
            {student.roll_no ? <> · Roll {student.roll_no}</> : null}.
          </p>
        </>
      );
    }

    return (
      <div
        className={`cg-cert ${award ? "is-award" : ""}`}
        style={{ border: award ? "14px double #f59e0b" : `14px double ${color}` }}
      >
        {!award ? <div className="cg-cert-logo">{renderLogo(40)}</div> : null}
        {!award ? <h1>{title}</h1> : <h1>{title}</h1>}
        {body}
        <p className="cg-issued">Issued on {issued || "—"}</p>
        <p className="cg-ref">Ref: {code}</p>
        <div className="cg-sign-row">
          <div className="cg-sign">
            <div className="cg-line">Admin Office</div>
            <small>Verified</small>
          </div>
          {signatureBlock("Principal")}
        </div>
      </div>
    );
  };

  const renderDocument = (student) =>
    certType === "id-card" ? renderIdCard(student) : renderCertificate(student);

  const handlePrint = () => {
    if (!selectedStudents.length) return;
    window.print();
  };

  return (
    <div className="page cg-page">
      <div className="no-print cg-hero">
        <div>
          <p className="cg-kicker">
            <span>
              <FileBadge size={14} />
            </span>
            Document Studio
          </p>
          <h1>ID Cards & Certificates</h1>
          <p>Pick a template, brand it once, select students, and print or save as PDF.</p>
        </div>
        <div className="cg-hero-actions">
          <button type="button" className="cg-btn is-ghost" onClick={resetSettings} title="Reset branding">
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            type="button"
            className="cg-btn is-primary"
            onClick={handlePrint}
            disabled={!selectedStudents.length}
          >
            <Printer size={16} />
            Print / PDF ({selectedStudents.length})
          </button>
        </div>
      </div>

      <div className="no-print cg-tabs">
        {DOC_TYPES.map((doc) => {
          const Icon = doc.icon;
          return (
            <button
              key={doc.id}
              type="button"
              className={`cg-tab ${certType === doc.id ? "is-on" : ""}`}
              onClick={() => setCertType(doc.id)}
            >
              <Icon size={15} />
              {doc.label}
            </button>
          );
        })}
      </div>

      <div className="no-print cg-layout">
        <aside className="cg-side">
          <section className="cg-panel">
            <div className="cg-panel-head">
              <h3>
                <Settings size={14} /> Branding
              </h3>
              <button type="button" className="cg-link" onClick={resetSettings}>
                Defaults
              </button>
            </div>
            <div className="cg-grid">
              <div className="cg-field">
                <label>School name</label>
                <input
                  value={customSettings.schoolName}
                  onChange={(e) => patchSettings({ schoolName: e.target.value })}
                />
              </div>
              <div className="cg-field">
                <label>Principal name</label>
                <input
                  value={customSettings.principalName}
                  placeholder="Shown on documents"
                  onChange={(e) => patchSettings({ principalName: e.target.value })}
                />
              </div>
              <div className="cg-grid is-2">
                <div className="cg-field">
                  <label>Primary color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => patchSettings({ primaryColor: e.target.value })}
                  />
                </div>
                <div className="cg-field">
                  <label>Academic year</label>
                  <input
                    value={customSettings.academicYear}
                    onChange={(e) => patchSettings({ academicYear: e.target.value })}
                  />
                </div>
              </div>
              <div className="cg-field">
                <label>Style presets</label>
                <div className="cg-presets">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`cg-preset ${activePreset === preset.id ? "is-on" : ""}`}
                      onClick={() => patchSettings({ primaryColor: preset.color })}
                    >
                      <i style={{ background: preset.color }} />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="cg-field">
                <label>Issue date</label>
                <input
                  type="date"
                  value={customSettings.issueDate}
                  onChange={(e) => patchSettings({ issueDate: e.target.value })}
                />
              </div>
              {certType === "award" ? (
                <>
                  <div className="cg-field">
                    <label>Award title</label>
                    <input
                      value={customSettings.awardTitle}
                      onChange={(e) => patchSettings({ awardTitle: e.target.value })}
                    />
                  </div>
                  <div className="cg-field">
                    <label>Award text</label>
                    <textarea
                      rows={3}
                      value={customSettings.awardReason}
                      onChange={(e) => patchSettings({ awardReason: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
              {certType === "id-card" ? (
                <>
                  <div className="cg-field">
                    <label>ID validity note</label>
                    <input
                      value={customSettings.idValidityNote}
                      onChange={(e) => patchSettings({ idValidityNote: e.target.value })}
                    />
                  </div>
                  <div className="cg-field">
                    <label>ID reverse rules</label>
                    <textarea
                      rows={2}
                      value={customSettings.idRules}
                      onChange={(e) => patchSettings({ idRules: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
              <div className="cg-field">
                <label>School logo</label>
                <div className="cg-file-row">
                  <input
                    type="file"
                    accept="image/*"
                    id="cg-logo-upload"
                    hidden
                    onChange={(e) => handleImageUpload(e, "logoUrl")}
                  />
                  <label htmlFor="cg-logo-upload" className="cg-file-btn">
                    <Upload size={14} style={{ display: "inline", marginRight: 6 }} />
                    Upload logo
                  </label>
                </div>
                {logo ? (
                  <div className="cg-asset">
                    <img src={logo} alt="" />
                    <span>Logo active</span>
                    <button type="button" onClick={() => patchSettings({ logoUrl: "" })} title="Remove">
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="cg-field">
                <label>Digital signature</label>
                <div className="cg-file-row">
                  <input
                    type="file"
                    accept="image/*"
                    id="cg-sig-upload"
                    hidden
                    onChange={(e) => handleImageUpload(e, "signatureUrl")}
                  />
                  <label htmlFor="cg-sig-upload" className="cg-file-btn">
                    Upload
                  </label>
                  <button type="button" className="cg-file-btn is-dark" onClick={() => setShowSignPad(true)}>
                    Draw live
                  </button>
                </div>
                {customSettings.signatureUrl ? (
                  <div className="cg-asset">
                    <img src={customSettings.signatureUrl} alt="" />
                    <span>Signature active</span>
                    <button
                      type="button"
                      onClick={() => patchSettings({ signatureUrl: null })}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="cg-panel">
            <div className="cg-panel-head">
              <h3>
                <User size={14} /> Students
              </h3>
              <button
                type="button"
                className="cg-link"
                onClick={selectedIds.length ? clearSelection : selectFiltered}
              >
                {selectedIds.length ? "Clear selection" : "Select filtered"}
              </button>
            </div>
            <div className="cg-filters">
              <div className="cg-field">
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="all">All classes</option>
                  {classOptions.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cg-field cg-search">
                <Search size={14} />
                <input
                  placeholder="Search name / roll"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="cg-roster">
              {loading ? (
                <div className="cg-loading">Loading students…</div>
              ) : loadError ? (
                <div className="cg-error">
                  <p>{loadError}</p>
                  <button type="button" className="cg-btn is-ghost" style={{ marginTop: 12 }} onClick={loadData}>
                    <RefreshCw size={14} /> Retry
                  </button>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="cg-empty">No students match this filter.</div>
              ) : (
                filteredStudents.map((s) => {
                  const on = selectedIds.includes(s.id);
                  const miss = missingFields(s);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`cg-student ${on ? "is-on" : ""}`}
                      onClick={() => toggleStudent(s)}
                    >
                      <span className="cg-student-check">
                        {on ? <CheckCircle2 size={14} /> : <User size={14} />}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <b>{s.name}</b>
                        <small>
                          {s.roll_no || "No roll"} · {s.class_name || "No class"}
                        </small>
                        {miss.length ? (
                          <span className="cg-warn">
                            <AlertTriangle size={10} /> Missing {miss.join(", ")}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </aside>

        <main className="cg-preview-wrap">
          <div className="cg-preview-top">
            <div>
              <h2>
                <LayoutGrid size={18} /> Live preview
              </h2>
              <p>
                {certType === "id-card"
                  ? "Front and back ID cards — print shows both sides."
                  : "Documents appear as they will look when printed."}
              </p>
            </div>
            {selectedStudents.length > 0 ? (
              <div className="cg-chips">
                {selectedStudents.slice(0, 6).map((s) => (
                  <span key={s.id} className="cg-chip">
                    {s.name}
                    <button type="button" onClick={() => removeSelected(s.id)} title="Remove">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {selectedStudents.length > 6 ? (
                  <span className="cg-chip">+{selectedStudents.length - 6} more</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {selectedStudents.length === 0 ? (
            <div className="cg-empty" style={{ margin: "auto" }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "var(--bg-hover)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 16px",
                }}
              >
                <FileBadge size={36} color="var(--text-muted)" />
              </div>
              <h2 style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}>Nothing selected</h2>
              <p style={{ marginTop: 8 }}>Select students from the left panel to generate documents.</p>
            </div>
          ) : (
            <div className="cg-preview-stage">
              {selectedStudents.map((student) => (
                <div key={student.id} className="cg-preview-item">
                  <div className="cg-preview-meta no-print">
                    <span>{student.name}</span>
                    <button type="button" onClick={() => removeSelected(student.id)}>
                      Remove
                    </button>
                  </div>
                  <div className="cg-scale">{renderDocument(student)}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedStudents.length > 0 ? (
        <div className={`print-only print-area cg-print-sheet ${certType === "id-card" ? "is-ids" : "is-certs"}`}>
          {selectedStudents.map((student) => (
            <div key={`print-${student.id}`}>{renderDocument(student)}</div>
          ))}
        </div>
      ) : null}

      {showSignPad ? (
        <div className="no-print cg-modal">
          <div className="cg-modal-card">
            <header>
              <h2>Draw signature</h2>
              <button type="button" className="cg-link" onClick={() => setShowSignPad(false)}>
                <X size={20} />
              </button>
            </header>
            <canvas
              ref={canvasRef}
              width={460}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
              Use mouse or touch to sign. Tip: save as PNG for crisp print.
            </p>
            <div className="cg-modal-actions">
              <button type="button" className="cg-btn is-ghost" onClick={clearCanvas} style={{ flex: 1 }}>
                Clear
              </button>
              <button type="button" className="cg-btn is-primary" onClick={saveCanvas} style={{ flex: 1.4 }}>
                Save & apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CertificateGenerator;
