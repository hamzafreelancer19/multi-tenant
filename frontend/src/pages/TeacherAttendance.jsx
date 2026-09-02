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
import { getTeachers } from "../api/teachersApi";
import { bulkMarkTeacherAttendance, getTeacherAttendance } from "../api/attendanceApi";
import { useTenant } from "../context/TenantContext";
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

export default function TeacherAttendance() {
  const tenant = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState({});

  const groupOptions = useMemo(
    () => unique(teachers.map((t) => t.designation || t.subject)),
    [teachers]
  );

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const [teacherRes, attRes] = await Promise.all([
        getTeachers(),
        getTeacherAttendance({ date }),
      ]);
      const allTeachers = (Array.isArray(teacherRes.data) ? teacherRes.data : [])
        .filter((t) => (t.status || "Active") === "Active");
      setTeachers(allTeachers);

      const nextMarks = {};
      const nextRemarks = {};
      (Array.isArray(attRes.data) ? attRes.data : []).forEach((row) => {
        nextMarks[row.teacher] = row.status;
        nextRemarks[row.teacher] = row.remarks || "";
      });
      setMarks(nextMarks);
      setRemarks(nextRemarks);
      setDirty(false);
    } catch (err) {
      console.error("Failed to load teacher attendance:", err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, [date]);

  const visible = teachers.filter((t) => {
    const q = search.toLowerCase().trim();
    const blob = [t.name, t.employee_id, t.subject, t.designation].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const group = t.designation || t.subject || "";
    const matchGroup = selectedGroup === "All" || group === selectedGroup;
    const status = marks[t.id] || "Unmarked";
    const matchStatus = filterStatus === "All" || status === filterStatus;
    return matchSearch && matchGroup && matchStatus;
  });

  const counts = visible.reduce(
    (acc, t) => {
      const status = marks[t.id];
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
    visible.forEach((t) => {
      next[t.id] = status;
    });
    setMarks(next);
    setSaved(false);
    setDirty(true);
  };

  const handleSave = async () => {
    const records = teachers
      .filter((t) => {
        const group = t.designation || t.subject || "";
        return (selectedGroup === "All" || group === selectedGroup) && marks[t.id];
      })
      .map((t) => ({
        teacher_id: t.id,
        status: marks[t.id],
        remarks: remarks[t.id] || "",
        date,
      }));
    if (!records.length) return alert("Mark at least one teacher before saving.");
    setSaving(true);
    try {
      await bulkMarkTeacherAttendance(records);
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Failed to save teacher attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">School register</p>
          <h1>Teacher attendance</h1>
          <p>
            Mark present, absent, late, or leave for faculty at {tenant.schoolName || "your school"} · {formatDay(date)}
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
          <button type="button" className="st-add-btn" onClick={handleSave} disabled={loading || saving || !visible.length}>
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
          <small>not on campus</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => setFilterStatus(filterStatus === "Late" ? "Leave" : "Late")}>
          <span>Late / leave</span>
          <strong>{loading ? "—" : counts.Late + counts.Leave}</strong>
          <small>{counts.Unmarked} unmarked</small>
        </button>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder="Search teacher, employee id, subject…"
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
        <button type="button" className={selectedGroup === "All" ? "is-on" : ""} onClick={() => setSelectedGroup("All")}>
          All faculty
        </button>
        {groupOptions.map((g) => (
          <button key={g} type="button" className={selectedGroup === g ? "is-on" : ""} onClick={() => setSelectedGroup(g)}>
            {g}
          </button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading register…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="st-empty">
            <CheckCircle2 size={36} />
            <p>
              {teachers.length === 0
                ? "Add teachers first, then mark attendance."
                : "No teachers match these filters."}
            </p>
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const status = marks[t.id] || "";
                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="st-person" style={{ cursor: "default" }}>
                          <span>{t.name ? t.name[0].toUpperCase() : "T"}</span>
                          <div>
                            <b>{t.name}</b>
                            <small>{t.designation || "Faculty"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="st-mono">{t.employee_id || "—"}</td>
                      <td>{t.subject || "—"}</td>
                      <td>
                        <div className="att-pills">
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              className={`att-pill is-${st.toLowerCase()} ${status === st ? "is-on" : ""}`}
                              onClick={() => setStatus(t.id, st)}
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
                          value={remarks[t.id] || ""}
                          onChange={(e) => {
                            setRemarks((prev) => ({ ...prev, [t.id]: e.target.value }));
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
        Showing {visible.length} of {teachers.length} teachers
      </p>
    </div>
  );
}
