import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout, getRole, getUser, setUser, isDemoMode } from "../store/authStore";
import { getUserProfile } from "../auth/authService";
import api from "../api/axios";
import { useTenant } from "../context/TenantContext";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  LogOut,
  School,
  Bell,
  ChevronRight,
  Clock,
  Check,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  User as UserIcon,
  Lock,
  Zap,
  Menu,
  ClipboardList,
  Book as BookIcon,
  Bus,
  FileBadge,
  Package
} from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../api/dashboardApi";
import AIAssistant from "../components/AIAssistant";

const LOCKED_ROUTES = ["/students", "/teachers", "/attendance", "/fees", "/exams"];

const navItems = [
  { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard", roles: ["superadmin", "admin", "teacher", "accountant", "student"], plan: "None" },
  { to: "/schools", icon: <School size={20} />, label: "Schools", roles: ["superadmin"], plan: "None" },
  { to: "/users", icon: <Users size={20} />, label: "Users", roles: ["superadmin"], plan: "None" },
  { to: "/database", icon: <Database size={20} />, label: "Database", roles: ["superadmin"], plan: "None" },
  
  // Basic Plan Features
  { to: "/students", icon: <Users size={20} />, label: "Students", roles: ["admin", "teacher"], plan: "Basic" },
  { to: "/enrollments", icon: <ClipboardCheck size={20} />, label: "Admission Requests", roles: ["admin"], plan: "Basic" },
  { to: "/teachers", icon: <GraduationCap size={20} />, label: "Teachers", roles: ["admin"], plan: "Basic" },
  { to: "/attendance", icon: <ClipboardCheck size={20} />, label: "Attendance", roles: ["admin", "teacher"], plan: "Basic" },
  
  // Business Plan Features
  { to: "/fees", icon: <CreditCard size={20} />, label: "Fees", roles: ["admin", "accountant"], plan: "Business" },
  { to: "/exams", icon: <ClipboardCheck size={20} />, label: "Exams", roles: ["admin", "teacher"], plan: "Business" },
  { to: "/notices", icon: <Bell size={20} />, label: "Notice Board", roles: ["admin", "teacher"], plan: "Business" },
  
  // Pro Plan Features
  { to: "/timetable", icon: <Clock size={20} />, label: "Class Schedules", roles: ["admin", "teacher"], plan: "Pro" },
  { to: "/assignments", icon: <ClipboardList size={20} />, label: "Homework", roles: ["admin", "teacher"], plan: "Pro" },
  { to: "/library", icon: <BookIcon size={20} />, label: "Library", roles: ["admin", "teacher"], plan: "Pro" },
  { to: "/transport", icon: <Bus size={20} />, label: "Transport", roles: ["admin", "teacher"], plan: "Pro" },
  { to: "/staff", icon: <Users size={20} />, label: "Staff & Payroll", roles: ["admin"], plan: "Pro" },
  { to: "/inventory", icon: <Package size={20} />, label: "Inventory & Stock", roles: ["admin"], plan: "Pro" },
  { to: "/certificates", icon: <FileBadge size={20} />, label: "ID Cards & Certificates", roles: ["admin", "teacher"], plan: "Pro" },
  
  { to: "/subscription", icon: <Zap size={20} />, label: "Subscription", roles: ["admin"], plan: "None" },
  { to: "/landing-settings", icon: <LayoutDashboard size={20} />, label: "Public Landing Page", roles: ["admin"], plan: "None" },
  { to: "/settings", icon: <School size={20} />, label: "School Settings", roles: ["admin"], plan: "None" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const role = getRole();
  const user = getUser();
  const tenant = useTenant();
  const [notifications, setNotifications] = useState([]);
  
  const brandName = tenant?.schoolName || "Classora";
  const [showNotifs, setShowNotifs] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const [planType, setPlanType] = useState("None");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const fetchNotifs = async () => {
    if (isDemoMode()) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      setNotifications([]);
    }
  };

  const fetchPlanStatus = async () => {
    if (isDemoMode()) {
      setPlanStatus("Active");
      setPlanType("Pro");
      return;
    }
    if (!["admin", "teacher", "accountant"].includes(role)) return;
    try {
      let currentUser = user;
      if (role === "admin" && !currentUser?.school) {
        const freshProfile = await getUserProfile();
        setUser(freshProfile);
        currentUser = freshProfile;
      }

      const res = await api.get("/schools/");
      const schools = Array.isArray(res.data) ? res.data : [];
      const mySchool = schools.find(s => s.id === Number(currentUser?.school)) || schools[0];
      setPlanStatus(mySchool?.plan_status || "Inactive");
      setPlanType(mySchool?.plan_type || "None");
    } catch (err) {
      console.error("Plan status fetch failed:", err);
      setPlanStatus("Inactive");
      setPlanType("None");
    }
  };

  useEffect(() => {
    fetchNotifs();
    fetchPlanStatus();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <School size={24} />
          </div>
          <div>
            <div className="logo-title">{brandName}</div>
            <div className="logo-sub">School Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">MAIN MENU</p>
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const planHierarchy = ["None", "Basic", "Business", "Pro"];
              const currentLevel = planHierarchy.indexOf(planType || "None");
              const requiredLevel = planHierarchy.indexOf(item.plan || "None");
              
              const isLocked = ["admin", "teacher", "accountant"].includes(role) && 
                              (planStatus !== "Active" || currentLevel < requiredLevel);

              if (isLocked) {
                return (
                  <div
                    key={item.to}
                    className="nav-link"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate("/subscription");
                    }}
                    style={{ opacity: 0.5, cursor: "pointer" }}
                    title={`Upgrade to ${item.plan} plan to access this feature`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    <div style={{ marginLeft: "auto", display: 'flex', alignItems: 'center', gap: 4 }}>
                       <span style={{ fontSize: 9, fontWeight: 900, background: '#fef2f2', color: '#ef4444', padding: '2px 6px', borderRadius: 6 }}>{item.plan}</span>
                       <Lock size={12} color="#ef4444" />
                    </div>
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "nav-link-active" : ""}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : ""}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <ChevronRight size={14} className="nav-chevron" />
                </NavLink>
              );
            })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">{user?.username?.[0]?.toUpperCase() || "U"}</div>
            {!isCollapsed && (
              <div>
                <div className="user-name">{user?.username || "User"}</div>
                <div className="user-role">
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Role"}
                </div>
              </div>
            )}
          </div>
          {isDemoMode() && (
            <button className="demo-exit-sidebar" onClick={handleLogout}>
              <div className="pulse-dot"></div>
              <span>Exit Demo Mode</span>
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="icon-btn mobile-only"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ display: 'none' }} // Controlled by CSS but added here for safety
            >
              <Menu size={20} />
            </button>
            <button
              className="icon-btn desktop-only"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <div>
              <h2 className="topbar-title">Welcome back, {user?.username || "User"} 👋</h2>
              <p className="topbar-sub">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}>
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div style={{ position: "relative" }}>
              <button
                className={`icon-btn ${showNotifs ? 'active' : ''}`}
                onClick={() => setShowNotifs(!showNotifs)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="badge">{unreadCount}</span>
                )}
              </button>

              {showNotifs && (
                <div className="notif-dropdown glass-panel">
                  <div className="notif-header">
                    <h3 className="notif-title">Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="notif-clear-btn" onClick={handleMarkAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notif-scroll">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.is_read ? 'notif-item-unread' : ''}`}
                        >
                          <div className="notif-item-icon" style={{
                            background: n.message.includes('registration') ? 'var(--blue-soft)' : 'var(--accent-soft)',
                            color: n.message.includes('registration') ? 'var(--blue)' : 'var(--accent)'
                          }}>
                            {n.message.includes('registration') ? <School size={18} /> : <Bell size={18} />}
                          </div>

                          <div className="notif-item-content">
                            <p className="notif-item-msg">{n.message}</p>
                            <span className="notif-item-time">
                              <Clock size={12} />
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {!n.is_read && (
                            <button
                              className="notif-read-btn"
                              title="Mark as read"
                              onClick={(e) => handleMarkRead(n.id, e)}
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Bell size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link to="/profile" className="avatar-sm" style={{ background: 'var(--accent)', color: 'white', cursor: 'pointer' }}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </Link>
          </div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}
