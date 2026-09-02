import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MinusCircle,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { getStudents } from "../api/studentsApi";
import { getClasses } from "../api/classesApi";
import { getMyTeacherProfile } from "../api/teachersApi";
import { bulkMarkAttendance, getAttendance } from "../api/attendanceApi";
import { getRole } from "../store/authStore";
import { useTenant } from "../context/TenantContext";
import { useLocation } from "react-router-dom";
import TeacherAttendance from "./TeacherAttendance";
import "./Dashboard.css";
import "./Students.css";
import "./Attendance.css";

const STATUSES = ["Present", "Absent", "Late", "Leave"];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDate(value, days) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDay(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function unique(list) {
  return [...new Set(list.map((v) => (v || "").trim()).filter(Boolean))];
}

function classLabel(c) {
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

function normalizeClass(value) {
  return (value || "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
}

function classAllowed(className, labels) {
  if (!className) return false;
  const target = normalizeClass(className);
  return (labels || []).some((item) => item === className || normalizeClass(item) === target);
}

export default function Attendance() {
  if (getRole() === "admin") return <TeacherAttendance />;
  return <StudentAttendance />;
}

function StudentAttendance() {
  const tenant = useTenant();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [students, setStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [inchargeClasses, setInchargeClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(location.state?.className || "All");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState({});

  const classOptions = useMemo(() => {
    const fromApi = schoolClasses.map(classLabel);
    const fromStudents = students.map((s) => s.class_name);
    const merged = unique([...fromApi, ...fromStudents]);
    if (!inchargeClasses.length) return [];
    return merged.filter((label) => classAllowed(label, inchargeClasses));
  }, [schoolClasses, students, inchargeClasses]);

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const [studentRes, attRes, classRes, profileRes] = await Promise.all([
        getStudents(),
        getAttendance({ date }),
        getClasses().catch(() => ({ data: [] })),
        getMyTeacherProfile().catch(() => ({ data: null })),
      ]);
      const scope = profileRes?.data?.classroom_scope || {};
      const incharge = Array.isArray(scope.incharge_classes) ? scope.incharge_classes.filter(Boolean) : [];
      setInchargeClasses(incharge);

      const allStudents = (Array.isArray(studentRes.data) ? studentRes.data : [])
        .filter((s) => (s.status || "Active") === "Active")
        .filter((s) => classAllowed(s.class_name, incharge));
      setStudents(allStudents);
      setSchoolClasses(Array.isArray(classRes.data) ? classRes.data : []);

      const nextMarks = {};
      const nextRemarks = {};
      (Array.isArray(attRes.data) ? attRes.data : []).forEach((row) => {
        nextMarks[row.student] = row.status;
        nextRemarks[row.student] = row.remarks || "";
      });
      setMarks(nextMarks);
      setRemarks(nextRemarks);
      setDirty(false);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setStudents([]);
      setInchargeClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, [date]);

  useEffect(() => {
    if (!inchargeClasses.length) return;
    setSelectedClass((prev) => {
      if (prev === "All" || classAllowed(prev, inchargeClasses)) return prev;
      return inchargeClasses[0];
    });
  }, [inchargeClasses]);

  const visible = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const blob = [s.name, s.roll_no, s.class_name].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchClass = selectedClass === "All" || classAllowed(s.class_name, [selectedClass]);
    const status = marks[s.id] || "Unmarked";
    const matchStatus = filterStatus === "All" || status === filterStatus;
    return matchSearch && matchClass && matchStatus;
  });

  const counts = visible.reduce(
    (acc, s) => {
      const status = marks[s.id];
      if (status && acc[status] !== undefined) acc[status] += 1;
      else acc.Unmarked += 1;
      return acc;
    },
    { Present: 0, Absent: 0, Late: 0, Leave: 0, Unmarked: 0 }
  );

  const markedCount = counts.Present + counts.Absent + counts.Late + counts.Leave;
  const presentLike = counts.Present + counts.Late;
  const pct = markedCount ? Math.round((presentLike / markedCount) * 100) : 0;

  const setStatus = (id, status) => {
    setMarks((prev) => ({ ...prev, [id]: status }));
    setSaved(false);
    setDirty(true);
  };

  const markAll = (status) => {
    const next = { ...marks };
    visible.forEach((s) => {
      next[s.id] = status;
    });
    setMarks(next);
    setSaved(false);
    setDirty(true);
  };

  const handleSave = async () => {
    const records = students
      .filter((s) => (selectedClass === "All" || s.class_name === selectedClass) && marks[s.id])
      .map((s) => ({
        student_id: s.id,
        status: marks[s.id],
        remarks: remarks[s.id] || "",
        date,
      }));
    if (!records.length) return alert("Mark at least one student before saving.");
    setSaving(true);
    try {
      await bulkMarkAttendance(records);
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Class incharge</p>
          <h1>Student attendance</h1>
          <p>
            Mark present, absent, late, or leave for your class at {tenant.schoolName || "your school"} · {formatDay(date)}
          </p>
        </div>
        <div className="dash-hero-meta att-date-nav">
          <button type="button" className="dash-refresh" onClick={() => setDate(shiftDate(date, -1))}>
            <ChevronLeft size={16} />
          </button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
          <button type="button" className="dash-refresh" onClick={() => setDate(shiftDate(date, 1))}>
            <ChevronRight size={16} />
          </button>
          <button type="button" className="st-add-btn" onClick={handleSave} disabled={loading || saving || !visible.length || !inchargeClasses.length}>
            {saving ? <Loader2 size={16} className="spin" /> : saved ? "Saved" : dirty ? "Save register" : "Save register"}
          </button>
        </div>
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => setFilterStatus("All")}>
          <span>Marked</span>
          <strong>{loading ? "—" : markedCount}</strong>
          <small>{visible.length} in view</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => setFilterStatus("Present")}>
          <span>Present</span>
          <strong>{loading ? "—" : counts.Present}</strong>
          <small>{pct}% in school</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setFilterStatus("Absent")}>
          <span>Absent</span>
          <strong>{loading ? "—" : counts.Absent}</strong>
          <small>not in class</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => setFilterStatus(filterStatus === "Late" ? "Leave" : "Late")}>
          <span>Late / leave</span>
          <strong>{loading ? "—" : counts.Late + counts.Leave}</strong>
          <small>{counts.Unmarked} unmarked</small>
        </button>
      </div>

      {inchargeClasses.length > 0 && (
        <>
      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search student, roll no, class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="st-filters">
          <button type="button" onClick={() => markAll("Present")}>All present</button>
          <button type="button" onClick={() => markAll("Absent")}>All absent</button>
        </div>
      </div>

      <div className="st-classes">
        {inchargeClasses.length > 1 && (
          <button type="button" className={selectedClass === "All" ? "is-on" : ""} onClick={() => setSelectedClass("All")}>
            All classes
          </button>
        )}
        {classOptions.map((c) => (
          <button key={c} type="button" className={selectedClass === c ? "is-on" : ""} onClick={() => setSelectedClass(c)}>
            {c}
          </button>
        ))}
      </div>
        </>
      )}

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading register…</p>
          </div>
        ) : inchargeClasses.length === 0 ? (
          <div className="st-empty">
            <CheckCircle2 size={36} />
            <p>Student attendance is marked by the class incharge. Ask school admin to set you as class teacher.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="st-empty">
            <CheckCircle2 size={36} />
            <p>
              {students.length === 0
                ? "No students in your class yet."
                : "No students match these filters."}
            </p>
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const status = marks[s.id] || "";
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="st-person" style={{ cursor: "default" }}>
                          <span>{s.name ? s.name[0].toUpperCase() : "S"}</span>
                          <div>
                            <b>{s.name}</b>
                            <small>{s.gender || s.phone || "Student"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="st-mono">{s.roll_no || "—"}</td>
                      <td>{s.class_name || "—"}</td>
                      <td>
                        <div className="att-pills">
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              className={`att-pill is-${st.toLowerCase()} ${status === st ? "is-on" : ""}`}
                              onClick={() => setStatus(s.id, st)}
                            >
                              {st === "Present" && <CheckCircle2 size={13} />}
                              {st === "Absent" && <XCircle size={13} />}
                              {st === "Late" && <Clock size={13} />}
                              {st === "Leave" && <MinusCircle size={13} />}
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <input
                          className="att-note"
                          placeholder="Optional"
                          value={remarks[s.id] || ""}
                          onChange={(e) => {
                            setRemarks((prev) => ({ ...prev, [s.id]: e.target.value }));
                            setDirty(true);
                            setSaved(false);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="st-count">
        {counts.Unmarked ? `${counts.Unmarked} unmarked · ` : ""}
        Showing {visible.length} of {students.length} students in your class
      </p>
    </div>
  );
}
