import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  DollarSign,
  BookOpen,
  Loader2,
  RefreshCw,
  Bell,
  School,
} from "lucide-react";
import { getDashboardStats, getActivities } from "../api/dashboardApi";
import { getStudents } from "../api/studentsApi";

// Relative time helper
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [statsData, setStatsData] = useState({
    students: 0,
    teachers: 0,
    attendance: 0,
    fees_collected: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, actRes, studentsRes] = await Promise.all([
        getDashboardStats(),
        getActivities(),
        getStudents(),
      ]);
      setStatsData(statsRes.data);
      setActivities(actRes.data || []);
      // API already returns newest first (ordered by -id), take first 5
      const all = studentsRes.data || [];
      setRecentStudents(all.slice(0, 5));
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Dashboard fetch failed, using fallback");
      setStatsData({ students: 0, teachers: 0, attendance: 0, fees_collected: 0 });
      setActivities([]);
      setRecentStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Realtime polling every 10 seconds
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const isSuperadmin = statsData.is_superadmin;

  const stats = isSuperadmin ? [
    {
      label: "Platform Schools",
      value: statsData.total_schools || 0,
      icon: <School size={22} />,
      color: "blue",
      desc: "active tenants",
    },
    {
      label: "Total Users",
      value: statsData.total_users || 0,
      icon: <Users size={22} />,
      color: "purple",
      desc: "platform accounts",
    },
    {
      label: "Active Nodes",
      value: "99.9%",
      icon: <RefreshCw size={22} />,
      color: "green",
      desc: "system uptime",
    },
    {
      label: "Cloud Storage",
      value: "1.2 TB",
      icon: <BookOpen size={22} />,
      color: "orange",
      desc: "data used",
    },
  ] : [
    {
      label: "Total Students",
      value: statsData.students,
      icon: <Users size={22} />,
      color: "blue",
      desc: "enrolled students",
    },
    {
      label: "Total Teachers",
      value: statsData.teachers,
      icon: <GraduationCap size={22} />,
      color: "purple",
      desc: "faculty members",
    },
    {
      label: "Attendance Today",
      value: statsData.attendance > 0 ? `${statsData.attendance}%` : "N/A",
      icon: <ClipboardCheck size={22} />,
      color: "green",
      desc: statsData.attendance > 0 ? "present today" : "no records yet",
    },
    {
      label: "Fees Collected (Records)",
      value: statsData.fees_collected,
      icon: <DollarSign size={22} />,
      color: "orange",
      desc: "paid records",
    },
  ];

  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastUpdated && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
          <button
            className="secondary-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
          {loading && <Loader2 className="spin" size={20} style={{ color: "var(--accent)" }} />}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card stat-${s.color}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">
                {loading ? <Loader2 size={18} className="spin" /> : s.value}
              </div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-grid">

        {/* Recent Activity - REALTIME */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} /> Recent Activity
            </h3>
            <span style={{
              fontSize: "0.7rem", background: "var(--accent)", color: "#fff",
              borderRadius: 99, padding: "2px 8px"
            }}>LIVE</span>
          </div>
          <div className="activity-list">
            {activities.length > 0 ? (
              activities.map((a) => (
                <div key={a.id} className="activity-item">
                  <div className="activity-avatar">{a.avatar || a.name?.[0] || "?"}</div>
                  <div className="activity-info">
                    <p className="activity-name">{a.name}</p>
                    <p className="activity-action">{a.action}</p>
                  </div>
                  <span className="activity-time">{timeAgo(a.created_at)}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: "0.85rem" }}>No activity yet.</p>
                <p style={{ fontSize: "0.75rem" }}>Add a student, teacher or mark attendance to see logs here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Conditional Card: Recent Students (School Admin) OR Active Schools (Super Admin) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {isSuperadmin ? <School size={18} /> : <Users size={18} />}
              {isSuperadmin ? " Active Schools" : " Recent Students"}
            </h3>
          </div>
          <div className={isSuperadmin ? "activity-list" : "top-students-list"}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Loader2 className="spin" size={24} />
              </div>
            ) : isSuperadmin ? (
              statsData.recent_schools?.length > 0 ? (
                statsData.recent_schools.map((s) => (
                  <div key={s.id} className="activity-item">
                    <div className="activity-avatar" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      {s.name?.[0].toUpperCase()}
                    </div>
                    <div className="activity-info">
                      <p className="activity-name">{s.name}</p>
                      <p className="activity-action">School Code: {s.code}</p>
                    </div>
                    <span className="activity-time">{timeAgo(s.created_at)}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                  <School size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: "0.85rem" }}>No schools registered yet.</p>
                </div>
              )
            ) : recentStudents.length > 0 ? (
              recentStudents.map((s, i) => (
                <div key={s.id} className="top-student-item">
                  <div
                    className={`rank-badge rank-${i + 1}`}
                    style={{ background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 700, borderRadius: 8, padding: "4px 8px" }}
                  >
                    {s.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div className="student-info">
                    <p className="student-name">{s.name}</p>
                    <p className="student-grade">{s.class_name} &nbsp;·&nbsp; {s.roll_no || "No Roll"}</p>
                  </div>
                  <span className={`badge-status ${(s.status || "Active") === "Inactive" ? "badge-inactive" : "badge-active"}`}>
                    {s.status || "Active"}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                <Users size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: "0.85rem" }}>No students enrolled yet.</p>
                <p style={{ fontSize: "0.75rem" }}>Go to Students page to add the first student.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
