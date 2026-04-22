import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { getStudents } from "../api/studentsApi";
import { bulkMarkAttendance, getAttendance } from "../api/attendanceApi";
import PremiumCard from "../components/ui/PremiumCard";

const classes = [
  "Nursery", "Prep",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

export default function Attendance() {
  const today = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, date]);

  const fetchStudents = async (isFirst = false) => {
    if (isFirst) setLoading(true);
    try {
      const [res, attRes] = await Promise.all([
        getStudents(),
        getAttendance({ date })
      ]);
      const studentList = Array.isArray(res.data) ? res.data : [];
      const filtered = studentList.filter(s => s.class_name === selectedClass || !s.class_name);
      setStudents(filtered);
      
      const initial = {};
      filtered.forEach(s => initial[s.id] = "Present");
      
      if (attRes.data && Array.isArray(attRes.data)) {
        attRes.data.forEach(record => {
          if (initial.hasOwnProperty(record.student)) {
            initial[record.student] = record.status;
          }
        });
      }
      setAttendance(initial);
    } catch (err) {
      console.warn("Using fallback students for attendance");
      const fallback = [
        { id: 1, name: "Ayesha Noor", class_name: "Grade 11-A" },
        { id: 2, name: "Bilal Ahmed", class_name: "Grade 10-B" },
      ];
      setStudents(fallback);
      setAttendance({ 1: "Present", 2: "Absent" });
    } finally {
      if (isFirst) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(true);
    // Real-time polling
    const interval = setInterval(() => fetchStudents(false), 10000);
    return () => clearInterval(interval);
  }, [selectedClass, date]);

  const toggle = (id) => {
    const cycle = { Present: "Absent", Absent: "Leave", Leave: "Present" };
    setAttendance((prev) => ({ ...prev, [id]: cycle[prev[id]] }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status,
        date
      }));
      await bulkMarkAttendance(records);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Failed to save attendance");
    }
  };

  const counts = (Array.isArray(students) ? students : []).reduce(
    (acc, s) => {
      const status = attendance[s.id] || "Present";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { Present: 0, Absent: 0, Leave: 0 }
  );

  const getStatusClass = (status) => {
    if (status === "Present") return "badge-active";
    if (status === "Absent") return "badge-inactive";
    if (status === "Leave") return "badge-warning";
    return "";
  };

  const icons = {
    Present: <CheckCircle2 size={16} />,
    Absent: <XCircle size={16} />,
    Leave: <MinusCircle size={16} />,
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Mark and track daily student attendance</p>
        </div>
        <div className="att-header-actions">
          <input
            id="att-date"
            type="date"
            className="date-input"
            value={date}
            onChange={(e) => { setDate(e.target.value); setSaved(false); }}
          />
          <button
            id="save-attendance-btn"
            className={`primary-btn ${saved ? "btn-success" : ""}`}
            onClick={handleSave}
            disabled={loading}
          >
            {saved ? "✓ Saved!" : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="att-summary">
        <PremiumCard className="att-stat" auroraColor="#10b981">
          <CheckCircle2 size={22} className="text-green-500" />
          <div>
            <p className="att-stat-val">{counts.Present}</p>
            <p className="att-stat-label">Present</p>
          </div>
        </PremiumCard>
        
        <PremiumCard className="att-stat" auroraColor="#ef4444">
          <XCircle size={22} className="text-red-500" />
          <div>
            <p className="att-stat-val">{counts.Absent}</p>
            <p className="att-stat-label">Absent</p>
          </div>
        </PremiumCard>
        
        <PremiumCard className="att-stat" auroraColor="#f59e0b">
          <MinusCircle size={22} className="text-amber-500" />
          <div>
            <p className="att-stat-val">{counts.Leave}</p>
            <p className="att-stat-label">On Leave</p>
          </div>
        </PremiumCard>
        
        <PremiumCard className="att-stat total-stat" auroraColor="#C4A6F7">
          <div style={{ flex: 1 }}>
            <p className="att-stat-val">{students.length}</p>
            <p className="att-stat-label">Total</p>
          </div>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div className="att-pie-bar">
              <div className="att-pie-fill" style={{ width: `${students.length ? (counts.Present / students.length) * 100 : 0}%` }} />
            </div>
            <span className="att-pct" style={{ display: 'block', textAlign: 'right', marginTop: 4 }}>
              {students.length ? Math.round((counts.Present / students.length) * 100) : 0}%
            </span>
          </div>
        </PremiumCard>
      </div>

      {/* Class Selector */}
      <div className="class-tabs">
        {classes.map((c) => (
          <button
            key={c}
            id={`class-${c.replace(/\s/g, "-").toLowerCase()}`}
            className={`class-tab ${selectedClass === c ? "class-tab-active" : ""}`}
            onClick={() => setSelectedClass(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Student List */}
      <PremiumCard className="card" auroraColor="#C4A6F7">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <p className="att-hint" style={{ margin: 0 }}>Click a status badge to cycle: Present → Absent → Leave</p>
           <div className="table-count">{students.length} Students found</div>
        </div>
        <div className="att-list">
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
              <Loader2 className="spin" size={36} />
              <p style={{ marginTop: 12 }}>Loading class list...</p>
            </div>
          ) : (
            students.map((s, i) => (
              <div key={s.id} className="att-row">
                <div className="att-student">
                  <div className="att-avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="att-name">{s.name}</p>
                    <p className="att-roll">Roll #{s.roll_no || i + 1} · {selectedClass}</p>
                  </div>
                </div>
                <button
                  id={`att-toggle-${s.id}`}
                  className={`badge-status ${getStatusClass(attendance[s.id] || "Present")}`}
                  style={{ gap: 6, padding: '6px 14px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
                  onClick={() => toggle(s.id)}
                >
                  {icons[attendance[s.id] || "Present"]}
                  <span style={{ fontWeight: 700 }}>{attendance[s.id] || "Present"}</span>
                </button>
              </div>
            ))
          )}
          {!loading && students.length === 0 && (
            <div className="empty-state">No students found in this class.</div>
          )}
        </div>
      </PremiumCard>
    </div>
  );
}
