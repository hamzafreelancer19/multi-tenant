import React, { useEffect, useRef, useState } from "react";
import {
  FileBadge,
  Search,
  Printer,
  User,
  School as SchoolIcon,
  CreditCard,
  Award,
  CheckCircle2,
  X,
  Settings,
  LayoutGrid,
  FileText,
  Shield,
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

const DOC_TYPES = [
  { id: "id-card", label: "ID Card", icon: CreditCard },
  { id: "leaving", label: "Transfer", icon: FileText },
  { id: "bonafide", label: "Bonafide", icon: Shield },
  { id: "character", label: "Character", icon: FileBadge },
  { id: "award", label: "Award", icon: Award },
];

const CertificateGenerator = () => {
  const tenant = useTenant();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [certType, setCertType] = useState("id-card");
  const [customSettings, setCustomSettings] = useState({
    schoolName: "",
    primaryColor: "#F15A24",
    academicYear: academicYear(),
    principalName: "",
    signatureUrl: null,
    logoUrl: "",
    issueDate: todayISO(),
    awardTitle: "Certificate of Excellence",
    awardReason: "For achieving outstanding marks and demonstrating consistent growth in character and academics.",
  });
  const [showSignPad, setShowSignPad] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const brandedOnce = useRef(false);

  useEffect(() => {
    if (tenant.loading || brandedOnce.current) return;
    if (!tenant.schoolName && !tenant.branding) return;
    const color = tenant.branding?.dashboard?.primary_color || tenant.branding?.landing?.primary_color || "#F15A24";
    setCustomSettings((prev) => ({
      ...prev,
      schoolName: tenant.schoolName || prev.schoolName || "School",
      primaryColor: isHex(color) ? color : "#F15A24",
      logoUrl: tenant.branding?.logo || "",
    }));
    brandedOnce.current = true;
  }, [tenant.loading, tenant.schoolName, tenant.branding]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    ctx.beginPath();
    ctx.moveTo(point.clientX - rect.left, point.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    ctx.lineTo(point.clientX - rect.left, point.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvas = () => {
    setCustomSettings({ ...customSettings, signatureUrl: canvasRef.current.toDataURL() });
    setShowSignPad(false);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCustomSettings({ ...customSettings, signatureUrl: reader.result });
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([getStudents(), getClasses()]);
        setStudents(Array.isArray(sRes.data) ? sRes.data : []);
        setClasses(Array.isArray(cRes.data) ? cRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const classOptions = classes.map(classLabel);
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = (s.name || "").toLowerCase().includes(q) || String(s.roll_no || "").toLowerCase().includes(q);
    const matchesClass = selectedClass === "all" || s.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  const toggleStudentSelection = (student) => {
    if (selectedStudents.find((s) => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter((s) => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const selectAllFiltered = () => {
    const ids = new Set(selectedStudents.map((s) => s.id));
    const extra = filteredStudents.filter((s) => !ids.has(s.id));
    setSelectedStudents([...selectedStudents, ...extra]);
  };

  const color = isHex(customSettings.primaryColor) ? customSettings.primaryColor : "#F15A24";
  const schoolName = customSettings.schoolName || tenant.schoolName || "School";
  const logo = customSettings.logoUrl || tenant.branding?.logo;

  const renderLogo = (size = 24, light = false) =>
    logo ? (
      <img src={logo} alt="" style={{ height: size, maxWidth: size * 2.2, objectFit: "contain", filter: light ? "brightness(0) invert(1)" : "none" }} />
    ) : (
      <SchoolIcon size={size} color={light ? "white" : color} />
    );

  const signatureBlock = (label = "Principal") => (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {customSettings.signatureUrl && (
        <img src={customSettings.signatureUrl} alt="" style={{ height: 40, maxWidth: 140, objectFit: "contain", marginBottom: -8 }} />
      )}
      <div style={{ width: 140, borderTop: "1px solid var(--text-primary)", marginTop: 36, paddingTop: 6, fontSize: 12, fontWeight: 800 }}>
        {customSettings.principalName || label}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{label}</div>
    </div>
  );

  const renderDocument = (student) => {
    const rel = relation(student.gender);
    const issued = formatLongDate(customSettings.issueDate);
    if (certType === "id-card") {
      return (
        <div className="id-card-preview">
          <div style={{ background: color, height: 110, padding: 20, textAlign: "center", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{renderLogo(28, true)}</div>
            <div style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.2 }}>{schoolName}</div>
            <div style={{ fontSize: 9, opacity: 0.8, marginTop: 4 }}>ID Card · {customSettings.academicYear}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: -35 }}>
            <div style={{ width: 90, height: 90, background: "var(--bg-card)", borderRadius: "50%", border: "4px solid white", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
              {student.photo ? <img src={student.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={50} />}
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "15px 20px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>{student.name}</h2>
            <p style={{ fontSize: 12, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 15 }}>STUDENT</p>
            <div style={{ textAlign: "left", background: "var(--bg-base)", padding: "12px 16px", borderRadius: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase" }}>Roll No</span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{student.roll_no || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase" }}>Class</span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{student.class_name || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase" }}>Father</span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{student.father_name || "N/A"}</span>
              </div>
              {contactPhone(student) && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase" }}>Phone</span>
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{contactPhone(student)}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 15, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {customSettings.signatureUrl ? <img src={customSettings.signatureUrl} alt="" style={{ height: 35, maxWidth: "80%", objectFit: "contain", marginBottom: -2 }} /> : <div style={{ width: 100, height: 1, background: "#e2e8f0", marginBottom: 8 }} />}
            <div style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)" }}>{customSettings.principalName || "Authorized Signature"}</div>
          </div>
        </div>
      );
    }

    const body =
      certType === "leaving" ? (
        <>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24, textTransform: "uppercase", letterSpacing: 2 }}>School Leaving Certificate</h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 2 }}>
            This is to certify that <strong>{student.name}</strong>, {rel.child} of <strong>{student.father_name || "N/A"}</strong>,
            was a bona fide student of <strong>{schoolName}</strong> in <strong>{student.class_name || "their class"}</strong>.
            {student.roll_no ? ` Roll No. ${student.roll_no}.` : ""} {rel.his.charAt(0).toUpperCase() + rel.his.slice(1)} conduct during the stay was satisfactory.
            We wish {rel.him} success in future studies.
          </p>
        </>
      ) : certType === "bonafide" ? (
        <>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24, textTransform: "uppercase", letterSpacing: 2 }}>Bonafide Certificate</h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 2 }}>
            This is to certify that <strong>{student.name}</strong>, {rel.child} of <strong>{student.father_name || "N/A"}</strong>,
            is a bona fide student of <strong>{schoolName}</strong>, currently studying in <strong>{student.class_name || "their class"}</strong>
            {student.roll_no ? ` (Roll No. ${student.roll_no})` : ""} during the academic year <strong>{customSettings.academicYear}</strong>.
            This certificate is issued on request for official purposes.
          </p>
        </>
      ) : certType === "character" ? (
        <>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24, textTransform: "uppercase", letterSpacing: 2 }}>Character Certificate</h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 2 }}>
            This is to certify that <strong>{student.name}</strong>, {rel.child} of <strong>{student.father_name || "N/A"}</strong>,
            is/was a student of <strong>{schoolName}</strong> in <strong>{student.class_name || "their class"}</strong>.
            To the best of our knowledge {rel.his} character and conduct have been good.
          </p>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)" }}>
            <Award size={56} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#f59e0b", marginTop: 48, marginBottom: 10 }}>{customSettings.awardTitle || "Certificate of Excellence"}</h1>
          <p style={{ fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: 4, marginBottom: 24 }}>{schoolName}</p>
          <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>PROUDLY PRESENTED TO</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: "22px 0", fontFamily: "serif" }}>{student.name}</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            {customSettings.awardReason} Session <strong>{customSettings.academicYear}</strong>
            {student.class_name ? `, ${student.class_name}` : ""}.
          </p>
        </>
      );

    return (
      <div className="cert-preview" style={{ border: certType === "award" ? "15px double #f59e0b" : `15px double ${color}` }}>
        {certType !== "award" && <div style={{ position: "absolute", top: 20, right: 30 }}>{renderLogo(40)}</div>}
        {body}
        <p style={{ marginTop: 28, fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>Issued on {issued || "—"}</p>
        <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 140, borderTop: "1px solid var(--text-primary)", marginTop: 40, paddingTop: 6, fontSize: 12, fontWeight: 800 }}>Admin Office</div>
          </div>
          {signatureBlock("Principal")}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ background: "var(--accent)", padding: 6, borderRadius: 8, color: "white" }}>
              <FileBadge size={18} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "2px" }}>Smart Printing</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>Certificate Engine</h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 600 }}>Design once, generate for students instantly.</p>
        </div>
        <button onClick={() => window.print()} className="primary-btn" disabled={selectedStudents.length === 0} style={{ padding: "12px 24px", borderRadius: 16 }}>
          <Printer size={20} /> Bulk Print ({selectedStudents.length})
        </button>
      </div>

      <div className="no-print cert-layout">
        <aside>
          <div className="sidebar-section">
            <h3 style={{ fontSize: 12, fontWeight: 900, color: "var(--text-secondary)", marginBottom: 16, textTransform: "uppercase" }}>1. Document Style</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {DOC_TYPES.map((doc) => {
                const Icon = doc.icon;
                const on = certType === doc.id;
                return (
                  <div key={doc.id} onClick={() => setCertType(doc.id)} className={`cert-card ${on ? "cert-active" : ""}`} style={{ textAlign: "center" }}>
                    <Icon size={20} color={on ? "var(--accent)" : "var(--text-muted)"} style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontWeight: 800, fontSize: 10 }}>{doc.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sidebar-section">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Settings size={16} color="var(--text-secondary)" />
              <h3 style={{ fontSize: 12, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", margin: 0 }}>2. Branding</h3>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="cert-label">SCHOOL NAME</label>
                <input className="cert-field" value={customSettings.schoolName} onChange={(e) => setCustomSettings({ ...customSettings, schoolName: e.target.value })} />
              </div>
              <div>
                <label className="cert-label">PRINCIPAL NAME</label>
                <input className="cert-field" value={customSettings.principalName} onChange={(e) => setCustomSettings({ ...customSettings, principalName: e.target.value })} placeholder="Shown on certificates" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="cert-label">PRIMARY COLOR</label>
                  <input type="color" className="cert-field" style={{ height: 36, padding: 2 }} value={color} onChange={(e) => setCustomSettings({ ...customSettings, primaryColor: e.target.value })} />
                </div>
                <div>
                  <label className="cert-label">YEAR</label>
                  <input className="cert-field" value={customSettings.academicYear} onChange={(e) => setCustomSettings({ ...customSettings, academicYear: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="cert-label">ISSUE DATE</label>
                <input className="cert-field" type="date" value={customSettings.issueDate} onChange={(e) => setCustomSettings({ ...customSettings, issueDate: e.target.value })} />
              </div>
              {certType === "award" && (
                <>
                  <div>
                    <label className="cert-label">AWARD TITLE</label>
                    <input className="cert-field" value={customSettings.awardTitle} onChange={(e) => setCustomSettings({ ...customSettings, awardTitle: e.target.value })} />
                  </div>
                  <div>
                    <label className="cert-label">AWARD TEXT</label>
                    <textarea className="cert-field" rows={3} value={customSettings.awardReason} onChange={(e) => setCustomSettings({ ...customSettings, awardReason: e.target.value })} />
                  </div>
                </>
              )}
              <div>
                <label className="cert-label">DIGITAL SIGNATURE</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input type="file" accept="image/*" id="sig-upload" hidden onChange={handleSignatureUpload} />
                  <label htmlFor="sig-upload" style={{ flex: 1, padding: 10, background: "#fff7f3", border: "1px dashed var(--accent)", borderRadius: 10, color: "var(--accent)", fontSize: 11, fontWeight: 800, textAlign: "center", cursor: "pointer" }}>
                    Upload
                  </label>
                  <button type="button" onClick={() => setShowSignPad(true)} style={{ flex: 1, padding: 10, background: "var(--text-primary)", border: "none", borderRadius: 10, color: "white", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                    Draw Live
                  </button>
                </div>
                {customSettings.signatureUrl && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, padding: 8, background: "var(--bg-base)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <img src={customSettings.signatureUrl} alt="" style={{ height: 30, maxWidth: 100, objectFit: "contain" }} />
                    <div style={{ fontSize: 9, fontWeight: 700 }}>Active Signature</div>
                    <X size={14} style={{ marginLeft: "auto", cursor: "pointer" }} onClick={() => setCustomSettings({ ...customSettings, signatureUrl: null })} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", margin: 0 }}>3. Select Students</h3>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", cursor: "pointer" }} onClick={selectedStudents.length > 0 ? () => setSelectedStudents([]) : selectAllFiltered}>
                {selectedStudents.length > 0 ? "Clear All" : "Select All"}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <select className="cert-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="all">All Classes</option>
                {classOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={14} />
                <input className="cert-field" placeholder="Search..." style={{ paddingLeft: 30 }} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
              {loading ? (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Loading students...</p>
              ) : filteredStudents.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>No students found.</p>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudents.find((x) => x.id === s.id);
                  return (
                    <div key={s.id} onClick={() => toggleStudentSelection(s)} className={`student-item ${isSelected ? "student-selected" : ""}`}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: isSelected ? "rgba(255,255,255,0.2)" : "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isSelected ? <CheckCircle2 size={14} /> : <User size={14} color="var(--text-muted)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{s.name}</div>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>
                          Roll: {s.roll_no || "—"} · {s.class_name || "—"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <main>
          <div style={{ background: "var(--bg-base)", border: "2px dashed #e2e8f0", borderRadius: 32, padding: 40, minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-muted)", fontWeight: 800, fontSize: 14 }}>
                <LayoutGrid size={20} /> Live Preview Mode
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Documents appear here as they will look when printed.</p>
            </div>
            {selectedStudents.length === 0 ? (
              <div style={{ textAlign: "center", opacity: 0.5, marginTop: 80 }}>
                <div style={{ width: 100, height: 100, background: "var(--bg-hover)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <FileBadge size={48} color="var(--text-muted)" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900 }}>Nothing to show</h2>
                <p style={{ fontSize: 14, fontWeight: 600, maxWidth: 300 }}>Select students from the sidebar to generate their documents.</p>
              </div>
            ) : (
              <div className="bulk-print-container" style={{ display: "flex", flexWrap: "wrap", gap: 30, justifyContent: "center" }}>
                {selectedStudents.map((student) => (
                  <div key={student.id}>{renderDocument(student)}</div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedStudents.length > 0 && (
        <div className="print-only print-area bulk-print-container">
          {selectedStudents.map((student) => (
            <div key={`print-${student.id}`}>{renderDocument(student)}</div>
          ))}
        </div>
      )}

      {showSignPad && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(10px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 32, padding: 32, width: 500, maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900 }}>Draw Your Signature</h2>
              <X size={24} style={{ cursor: "pointer" }} onClick={() => setShowSignPad(false)} />
            </div>
            <canvas
              ref={canvasRef}
              width={436}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ background: "var(--bg-base)", border: "2px dashed #e2e8f0", borderRadius: 16, cursor: "crosshair", touchAction: "none", width: "100%" }}
            />
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, fontWeight: 600 }}>Use your mouse or touch screen to sign above.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button type="button" onClick={clearCanvas} style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", background: "none", fontWeight: 800, cursor: "pointer" }}>
                Clear
              </button>
              <button type="button" onClick={saveCanvas} className="primary-btn" style={{ flex: 1.5, justifyContent: "center" }}>
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateGenerator;
