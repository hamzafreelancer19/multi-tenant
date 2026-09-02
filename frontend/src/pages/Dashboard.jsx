import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Layout,
  Plus,
  RefreshCw,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardStats, getActivities } from "../api/dashboardApi";
import { getStudents } from "../api/studentsApi";
import { approveSchool, rejectSchool, approvePlan, rejectPlan } from "../api/adminApi";
import { getUser, getRole } from "../store/authStore";
import { useTenant } from "../context/TenantContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Ring({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="dash-ring">
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={r} className="dash-ring-track" />
        <circle cx="44" cy="44" r={r} className="dash-ring-value" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <strong>{pct}%</strong>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();
  const tenant = useTenant();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [statsData, setStatsData] = useState({
    students: 0,
    teachers: 0,
    attendance: 0,
    fees_collected: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [schoolData, setSchoolData] = useState(null);

  const fetchAll = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, actRes] = await Promise.all([getDashboardStats(), getActivities()]);
      setStatsData(statsRes.data);
      setActivities(Array.isArray(actRes.data) ? actRes.data : []);

      if (role !== "superadmin") {
        try {
          const studentsRes = await getStudents();
          const all = Array.isArray(studentsRes.data) ? studentsRes.data : [];
          setRecentStudents(all.slice(0, 6));
        } catch {
          setRecentStudents([]);
        }
        try {
          const enrollRes = await api.get("/enrollments/");
          const allEnroll = Array.isArray(enrollRes.data) ? enrollRes.data : [];
          setPendingEnrollments(allEnroll.filter((e) => e.status === "PendingAdmin").slice(0, 6));
        } catch {
          setPendingEnrollments([]);
        }
      } else {
        setRecentStudents([]);
        setPendingEnrollments([]);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (role === "teacher") {
      navigate("/teacher", { replace: true });
      return;
    }
    if (role === "parent") {
      navigate("/parent", { replace: true });
      return;
    }
    fetchAll();
    if (role === "admin") {
      api.get("schools/").then((res) => {
        const schools = res.data || [];
        const mine =
          schools.find((s) => s.id === Number(user?.school) || s.id === Number(user?.school_id) || s.id === Number(tenant.schoolId)) ||
          schools[0];
        setSchoolData(mine || null);
      }).catch(() => {});
    }
    const interval = setInterval(() => fetchAll(), 30000);
    return () => clearInterval(interval);
  }, []);

  const isSuperadmin = statsData.is_superadmin;
  const schoolName = schoolData?.name || tenant.schoolName || user?.school_name || "your school";
  const logoUrl = (() => {
    const raw = tenant.branding?.logo || schoolData?.logo_url || "";
    if (!raw) return "";
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    return `${api.defaults.baseURL.replace("/api", "")}${raw.startsWith("/") ? raw : `/${raw}`}`;
  })();
  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = isSuperadmin
    ? [
        { label: "Schools", value: statsData.total_schools || 0, desc: `${statsData.approved_schools || 0} approved`, to: "/schools", tone: "orange" },
        { label: "Users", value: statsData.total_users || 0, desc: "platform accounts", to: "/users", tone: "navy" },
        { label: "Pending", value: (statsData.pending_schools || 0) + (statsData.pending_plans || 0), desc: "schools & plans", to: "/schools", tone: "gold" },
        { label: "Revenue", value: `RS ${Number(statsData.plan_revenue || 0).toLocaleString()}`, desc: `${statsData.active_plans || 0} active plans`, to: "/schools", tone: "green" },
      ]
    : role === "teacher"
    ? [
        { label: "Students", value: statsData.students || 0, desc: "in your school", to: "/students", tone: "orange" },
        { label: "Homework", value: statsData.assignments || 0, desc: "assignments", to: "/assignments", tone: "navy" },
        { label: "Notices", value: statsData.notices || 0, desc: "published", to: "/notices", tone: "gold" },
        { label: "Attendance", value: "Mark", desc: "today’s register", to: "/attendance", tone: "green" },
      ]
    : role === "student"
    ? [
        { label: "Attendance", value: `${statsData.attendance || 0}%`, desc: "overall", to: "/attendance", tone: "orange" },
        { label: "Pending fees", value: statsData.pending_fees || 0, desc: "unpaid months", to: "/fees", tone: "navy" },
        { label: "Homework", value: statsData.homework || 0, desc: "for your class", to: "/assignments", tone: "gold" },
        { label: "Class", value: statsData.class_name || "—", desc: "current class", to: "/timetable", tone: "green" },
      ]
    : [
        { label: "Students", value: statsData.students || 0, desc: "enrolled", to: "/students", tone: "orange" },
        { label: "Teachers", value: statsData.teachers || 0, desc: "faculty", to: "/teachers", tone: "navy" },
        { label: "Attendance", value: statsData.attendance > 0 ? `${statsData.attendance}%` : "—", desc: statsData.attendance > 0 ? "teachers present" : "not marked yet", to: "/attendance", tone: "gold" },
        { label: "Paid fees", value: statsData.fees_collected || 0, desc: "paid records", to: "/fees", tone: "green" },
      ];

  const adminActions = [
    { label: "Add student", to: "/students", icon: Plus },
    { label: "Admissions", to: "/enrollments", icon: ClipboardCheck, badge: pendingEnrollments.length },
    { label: "Teacher attendance", to: "/attendance", icon: CheckCircle2 },
    { label: "Fees", to: "/fees", icon: DollarSign },
    { label: "Website", to: "/landing-settings", icon: Layout },
    { label: "Notices", to: "/notices", icon: Bell },
  ];

  const handleEnroll = async (id, action, name) => {
    const ok = window.confirm(`${action === "accept" ? "Accept" : "Reject"} admission for ${name}?`);
    if (!ok) return;
    setBusyId(id);
    try {
      await api.post(`/enrollments/${id}/${action}/`);
      await fetchAll();
    } finally {
      setBusyId(null);
    }
  };

  const attendancePct = Number(statsData.attendance) || 0;

  return (
    <div className="page dash-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">{today}</p>
          <h1>
            {greeting()}
            {user?.username ? `, ${user.username}` : ""}
          </h1>
          <p>
            {isSuperadmin
              ? "Platform overview — schools, plans, and new signups."
              : `Here’s what’s happening at ${schoolName} today.`}
          </p>
        </div>
        <div className="dash-hero-meta">
          {lastUpdated && <span>Updated {timeAgo(lastUpdated)}</span>}
          <button type="button" className="dash-refresh" onClick={() => fetchAll(true)} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {role === "admin" && schoolData && schoolData.plan_status !== "Active" && (
        <div className={`dash-alert ${schoolData.plan_status === "Pending" ? "is-wait" : "is-lock"}`}>
          <Zap size={18} />
          <div>
            <strong>{schoolData.plan_status === "Pending" ? "Plan waiting for approval" : "No active subscription"}</strong>
            <span>
              {schoolData.plan_status === "Pending"
                ? `Your ${schoolData.plan_type} request is with the platform admin.`
                : "Some modules stay locked until a plan is active."}
            </span>
          </div>
          <button type="button" onClick={() => navigate("/subscription")}>
            {schoolData.plan_status === "Pending" ? "View status" : "Choose a plan"}
          </button>
        </div>
      )}

      <section className="dash-stats">
        {stats.map((s) => (
          <button key={s.label} type="button" className={`dash-stat dash-stat-${s.tone}`} onClick={() => s.to && navigate(s.to)}>
            <span>{s.label}</span>
            <strong>{loading ? "…" : s.value}</strong>
            <small>{s.desc}</small>
          </button>
        ))}
      </section>

      {role === "admin" && (
        <section className="dash-actions">
          {adminActions.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} type="button" onClick={() => navigate(item.to)}>
                <Icon size={18} />
                {item.label}
                {item.badge > 0 && <em>{item.badge}</em>}
              </button>
            );
          })}
        </section>
      )}

      <div className="dash-grid">
        {isSuperadmin && (
          <section className="dash-panel">
            <header>
              <h2>Pending approvals</h2>
            </header>
            <Queue
              empty="No school or plan approvals waiting."
              items={[
                ...(statsData.pending_school_list || []).map((s) => ({
                  id: `s-${s.id}`,
                  title: s.name,
                  meta: `School · ${s.code}`,
                  onOpen: () => navigate(`/schools/${s.id}`),
                  onYes: async () => { await approveSchool(s.id); fetchAll(); },
                  onNo: async () => { await rejectSchool(s.id); fetchAll(); },
                })),
                ...(statsData.pending_plan_list || []).map((s) => ({
                  id: `p-${s.id}`,
                  title: s.name,
                  meta: `${s.plan_type} plan · TX ${s.transaction_id || "N/A"}`,
                  onOpen: () => navigate(`/schools/${s.id}`),
                  onYes: async () => { await approvePlan(s.id); fetchAll(); },
                  onNo: async () => { await rejectPlan(s.id); fetchAll(); },
                })),
              ]}
            />
          </section>
        )}

        {role === "admin" && (
          <section className="dash-panel">
            <header>
              <h2>Admission requests</h2>
              {pendingEnrollments.length > 0 && <span className="dash-pill">{pendingEnrollments.length} new</span>}
              <button type="button" className="dash-link" onClick={() => navigate("/enrollments")}>
                View all <ArrowRight size={14} />
              </button>
            </header>
            {pendingEnrollments.length === 0 ? (
              <div className="dash-empty">
                <ClipboardCheck size={26} />
                <p>No pending applications.</p>
                <button type="button" onClick={() => navigate("/landing-settings")}>Open public website settings</button>
              </div>
            ) : (
              <ul className="dash-queue">
                {pendingEnrollments.map((e) => (
                  <li key={e.id}>
                    <div>
                      <strong>{e.student_name}</strong>
                      <span>{e.class_applying || "Class not set"} · {e.father_name} · {e.father_phone}</span>
                    </div>
                    <div className="dash-queue-actions">
                      <button type="button" disabled={busyId === e.id} onClick={() => handleEnroll(e.id, "accept", e.student_name)}>Accept</button>
                      <button type="button" className="is-ghost" disabled={busyId === e.id} onClick={() => handleEnroll(e.id, "reject", e.student_name)}>
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {role === "admin" && (
          <section className="dash-panel dash-panel-meter">
            <header>
              <h2>Today’s teacher attendance</h2>
              <button type="button" className="dash-link" onClick={() => navigate("/attendance")}>
                Mark register <ArrowRight size={14} />
              </button>
            </header>
            <div className="dash-meter-row">
              <Ring value={attendancePct} />
              <div>
                <p>{attendancePct > 0 ? `${attendancePct}% of marked teachers are present.` : "Teacher attendance has not been marked yet today."}</p>
                <div className="dash-mini-stats">
                  <div><b>{statsData.students || 0}</b><span>Students</span></div>
                  <div><b>{statsData.teachers || 0}</b><span>Teachers</span></div>
                  <div><b>{pendingEnrollments.length}</b><span>Applications</span></div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="dash-panel">
          <header>
            <h2>{isSuperadmin ? "Recent schools" : role === "student" ? "Latest activity" : "Recent students"}</h2>
            {!isSuperadmin && role !== "student" && (
              <button type="button" className="dash-link" onClick={() => navigate("/students")}>
                All students <ArrowRight size={14} />
              </button>
            )}
          </header>
          {isSuperadmin ? (
            <PeopleList
              logoUrl={logoUrl}
              empty="No schools yet."
              items={(statsData.recent_schools || []).map((s) => ({
                id: s.id,
                title: s.name,
                meta: s.code,
                time: timeAgo(s.created_at),
                onClick: () => navigate(`/schools/${s.id}`),
              }))}
            />
          ) : role === "student" ? (
            <ActivityList items={activities} logoUrl={logoUrl} />
          ) : (
            <PeopleList
              logoUrl={logoUrl}
              empty="No students yet. Add the first from Students."
              items={recentStudents.map((s) => ({
                id: s.id,
                title: s.name,
                meta: `${s.class_name || "Class"} · ${s.roll_no || "No roll"}`,
                badge: s.status || "Active",
              }))}
            />
          )}
        </section>

        {role !== "student" && (
          <section className="dash-panel">
            <header>
              <h2>Activity</h2>
            </header>
            <ActivityList items={activities} logoUrl={logoUrl} />
          </section>
        )}

        {isSuperadmin && (
          <section className="dash-panel dash-chart">
            <header><h2>School registrations</h2></header>
            <div className="dash-chart-box">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={statsData.monthly_signups?.length ? statsData.monthly_signups : [{ name: "—", schools: 0 }]}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="schools" stroke="#F15A24" fill="rgba(241,90,36,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {isSuperadmin && (
          <section className="dash-panel dash-chart">
            <header><h2>Plan mix</h2></header>
            <div className="dash-chart-box">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statsData.plan_breakdown?.length ? statsData.plan_breakdown : [{ name: "None", count: 0 }]}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F15A24" radius={[8, 8, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Queue({ items, empty }) {
  if (!items.length) {
    return (
      <div className="dash-empty">
        <ClipboardCheck size={26} />
        <p>{empty}</p>
      </div>
    );
  }
  return (
    <ul className="dash-queue">
      {items.map((item) => (
        <li key={item.id}>
          <div
            role={item.onOpen ? "button" : undefined}
            style={item.onOpen ? { cursor: "pointer" } : undefined}
            onClick={item.onOpen}
          >
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
          </div>
          <div className="dash-queue-actions">
            <button type="button" onClick={item.onYes}>Approve</button>
            <button type="button" className="is-ghost" onClick={item.onNo}><X size={14} /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DashAvatar({ icon: Icon = ClipboardCheck }) {
  return (
    <span className="dash-avatar" aria-hidden="true">
      <Icon size={18} strokeWidth={2.2} />
    </span>
  );
}

function PeopleList({ items, empty, logoUrl }) {
  if (!items.length) {
    return (
      <div className="dash-empty">
        <Users size={26} />
        <p>{empty}</p>
      </div>
    );
  }
  return (
    <ul className="dash-people">
      {items.map((item) => (
        <li
          key={item.id}
          role={item.onClick ? "button" : undefined}
          onClick={item.onClick}
          style={item.onClick ? { cursor: "pointer" } : undefined}
        >
          <DashAvatar icon={Users} />
          <div>
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
          </div>
          {item.badge && <em>{item.badge}</em>}
          {item.time && <small>{item.time}</small>}
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ items, logoUrl }) {
  if (!items?.length) {
    return (
      <div className="dash-empty">
        <Bell size={26} />
        <p>No recent activity.</p>
      </div>
    );
  }
  return (
    <ul className="dash-people">
      {items.map((a) => (
        <li key={a.id}>
          <DashAvatar icon={ClipboardCheck} />
          <div>
            <strong>{a.name}</strong>
            <span>{a.action}</span>
          </div>
          <small>{timeAgo(a.created_at)}</small>
        </li>
      ))}
    </ul>
  );
}
