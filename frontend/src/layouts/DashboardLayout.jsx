import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { logout, getRole, getUser, setUser, isDemoMode, getDisplayName } from "../store/authStore";
import { getUserProfile, setPresence } from "../auth/authService";
import api from "../api/axios";
import { useTenant } from "../context/TenantContext";
import BrandLogo from "../components/ui/BrandLogo";
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
  FileBadge,
  Package,
  Layers,
  Settings,
  Shield,
  MessageCircle,
} from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../api/dashboardApi";
import { getPlatformSettings } from "../api/adminApi";
import AIAssistant from "../components/AIAssistant";

const CLASSORA_THEME = {
  primary: "#F15A24",
  secondary: "#0F172A",
  accent: "#FF8C42",
};

const GENERIC_THEME_COLORS = new Set([
  "#3b82f6", "#1e40af", "#1d4ed8", "#2563eb", "#1e293b", "#10b981",
  "#e8b86d", "#08131c", "#3b82f6",
]);

function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  return match
    ? `${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}`
    : "241, 90, 36";
}

function dashboardTheme(branding = {}) {
  const primary = (branding.primary_color || "").toLowerCase();
  const secondary = (branding.secondary_color || "").toLowerCase();
  const accent = (branding.accent_color || "").toLowerCase();
  return {
    primary: primary && !GENERIC_THEME_COLORS.has(primary) ? branding.primary_color : CLASSORA_THEME.primary,
    secondary: secondary && !GENERIC_THEME_COLORS.has(secondary) ? branding.secondary_color : CLASSORA_THEME.secondary,
    accent: accent && !GENERIC_THEME_COLORS.has(accent) ? branding.accent_color : CLASSORA_THEME.accent,
  };
}

const navItems = [
  { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard", roles: ["superadmin", "admin", "accountant", "student"], plan: "None" },
  { to: "/teacher", icon: <GraduationCap size={20} />, label: "Teacher portal", roles: ["teacher"], plan: "None" },
  { to: "/teacher/admissions", icon: <ClipboardCheck size={20} />, label: "Class admissions", roles: ["teacher"], plan: "Basic" },
  { to: "/parent", icon: <LayoutDashboard size={20} />, label: "Parent portal", roles: ["parent"], plan: "None" },
  { to: "/parent/profile", icon: <UserIcon size={20} />, label: "Child profile", roles: ["parent"], plan: "None" },
  { to: "/parent/attendance", icon: <ClipboardCheck size={20} />, label: "Attendance", roles: ["parent"], plan: "None" },
  { to: "/parent/fees", icon: <CreditCard size={20} />, label: "Fees", roles: ["parent"], plan: "None" },
  { to: "/parent/exams", icon: <GraduationCap size={20} />, label: "Exams", roles: ["parent"], plan: "None" },
  { to: "/parent/homework", icon: <ClipboardList size={20} />, label: "Homework", roles: ["parent"], plan: "None" },
  { to: "/parent/timetable", icon: <Clock size={20} />, label: "Timetable", roles: ["parent"], plan: "None" },
  { to: "/parent/notices", icon: <Bell size={20} />, label: "Notices", roles: ["parent"], plan: "None" },
  { to: "/parent/library", icon: <BookIcon size={20} />, label: "Library", roles: ["parent"], plan: "None" },
  // Transport hidden for now
  // { to: "/parent/transport", icon: <Bus size={20} />, label: "Transport", roles: ["parent"], plan: "None" },
  { to: "/chat", icon: <MessageCircle size={20} />, label: "Chat", roles: ["admin", "teacher", "parent", "accountant", "student"], plan: "None" },
  { to: "/schools", icon: <School size={20} />, label: "Schools", roles: ["superadmin"], plan: "None" },
  { to: "/users", icon: <Users size={20} />, label: "School Admins", roles: ["superadmin"], plan: "None" },
  { to: "/security", icon: <Shield size={20} />, label: "Security", roles: ["superadmin"], plan: "None" },
  { to: "/database", icon: <Database size={20} />, label: "Database", roles: ["superadmin"], plan: "None" },
  { to: "/platform-settings", icon: <Settings size={20} />, label: "Platform Settings", roles: ["superadmin"], plan: "None" },
  
  // Basic Plan Features
  { to: "/students", icon: <Users size={20} />, label: "Students", roles: ["admin", "teacher"], plan: "Basic" },
  { to: "/enrollments", icon: <ClipboardCheck size={20} />, label: "Admission Requests", roles: ["admin"], plan: "Basic" },
  { to: "/teachers", icon: <GraduationCap size={20} />, label: "Teachers", roles: ["admin"], plan: "Basic" },
  { to: "/classes", icon: <Layers size={20} />, label: "Classes", roles: ["admin"], plan: "Basic" },
  { to: "/attendance", icon: <ClipboardCheck size={20} />, label: "Teacher attendance", roles: ["admin"], plan: "Basic" },
  { to: "/attendance", icon: <ClipboardCheck size={20} />, label: "Class attendance", roles: ["teacher"], plan: "Basic" },
  
  // Business Plan Features
  { to: "/fees", icon: <CreditCard size={20} />, label: "Fees", roles: ["admin", "accountant", "student"], plan: "Business" },
  { to: "/exams", icon: <ClipboardCheck size={20} />, label: "Exams", roles: ["admin", "teacher", "student"], plan: "Business" },
  { to: "/notices", icon: <Bell size={20} />, label: "Notice Board", roles: ["admin", "teacher", "student"], plan: "Business" },
  
  // Pro Plan Features
  { to: "/timetable", icon: <Clock size={20} />, label: "Class Schedules", roles: ["admin", "teacher", "student"], plan: "Pro" },
  { to: "/assignments", icon: <ClipboardList size={20} />, label: "Homework", roles: ["admin", "teacher", "student"], plan: "Pro" },
  { to: "/library", icon: <BookIcon size={20} />, label: "Library", roles: ["admin", "student"], plan: "Pro" },
  // Transport hidden for now
  // { to: "/transport", icon: <Bus size={20} />, label: "Transport", roles: ["admin", "student"], plan: "Pro" },
  { to: "/staff", icon: <Users size={20} />, label: "Staff & Payroll", roles: ["admin"], plan: "Pro" },
  { to: "/inventory", icon: <Package size={20} />, label: "Inventory & Stock", roles: ["admin"], plan: "Pro" },
  { to: "/certificates", icon: <FileBadge size={20} />, label: "ID Cards & Certificates", roles: ["admin"], plan: "Pro" },
  
  { to: "/subscription", icon: <Zap size={20} />, label: "Subscription", roles: ["admin"], plan: "None" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const user = getUser();
  const displayName = getDisplayName();
  const [avatarUrl, setAvatarUrl] = useState(() => getUser()?.avatar_url || "");
  const tenant = useTenant();
  const [platformName, setPlatformName] = useState("Classora");
  const [notifications, setNotifications] = useState([]);
  
  const brandName = role === "superadmin"
    ? (platformName && platformName !== "System Configuration" ? platformName : "Classora")
    : (tenant?.schoolName || "Classora");
  const [showNotifs, setShowNotifs] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const [planType, setPlanType] = useState("None");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

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

  useEffect(() => {
    if (role !== "superadmin" || isDemoMode()) return undefined;
    getPlatformSettings()
      .then((res) => {
        if (res.data?.name) setPlatformName(res.data.name);
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    if (isDemoMode()) return undefined;
    setPresence(true).catch(() => {});
    const beat = setInterval(() => {
      setPresence(true).catch(() => {});
    }, 15000);
    return () => clearInterval(beat);
  }, []);

  useEffect(() => {
    const syncAvatar = () => setAvatarUrl(getUser()?.avatar_url || "");
    syncAvatar();
    window.addEventListener("auth-user-updated", syncAvatar);
    return () => window.removeEventListener("auth-user-updated", syncAvatar);
  }, []);

  useEffect(() => {
    setShowProfileMenu(false);
    setShowNotifs(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const onPointer = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [showProfileMenu]);

  const handleMarkRead = async (id, e) => {
    e?.stopPropagation?.();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to mark notification as read");
    }
  };

  const openNotification = async (n) => {
    if (!n.is_read) await handleMarkRead(n.id);
    setShowNotifs(false);
    const msg = (n.message || "").toLowerCase();
    if (n.link_path) {
      navigate(n.link_path);
      return;
    }
    if (msg.includes("admission") || msg.includes("enrollment")) {
      navigate(role === "teacher" ? "/teacher/admissions" : "/enrollments");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      setShowNotifs(false);
    } catch (err) {
      console.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const dashboardBranding = dashboardTheme(tenant.branding?.dashboard || {});
  const logoUrl = tenant.branding?.logo 
    ? (tenant.branding.logo.startsWith('http') ? tenant.branding.logo : `${api.defaults.baseURL.replace('/api', '')}${tenant.branding.logo}`) 
    : null;

  return (
    <div 
      className="layout"
      style={{
        "--dashboard-primary": dashboardBranding.primary,
        "--dashboard-secondary": dashboardBranding.secondary,
        "--dashboard-accent": dashboardBranding.accent,
        "--dashboard-primary-rgb": hexToRgb(dashboardBranding.primary),
      }}
    >
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-logo">
          {brandName === "Classora" ? (
             <BrandLogo 
                size="md" 
                color="white" 
                collapsed={isCollapsed} 
                className="pl-1"
             />
          ) : (
            <>
              <div className="logo-icon">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <School size={24} />
                )}
              </div>
              {!isCollapsed && (
                <div>
                  <div className="logo-title">{brandName}</div>
                  <div className="logo-sub">School Management</div>
                </div>
              )}
            </>
          )}
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
                       <span style={{ fontSize: 9, fontWeight: 900, background: 'var(--red-soft)', color: 'var(--red)', padding: '2px 6px', borderRadius: 6 }}>{item.plan}</span>
                       <Lock size={12} color="var(--red)" />
                    </div>
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/parent" || item.to === "/teacher"}
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
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn mobile-only"
              onClick={() => setIsMobileMenuOpen(true)}
              title="Open menu"
            >
              <Menu size={18} />
            </button>
            <button
              className="icon-btn desktop-only"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <p className="topbar-hello">
              Welcome back, <strong>{displayName}</strong>
            </p>
          </div>
          <div className="topbar-right">
            <p className="topbar-when">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="topbar-pop">
              <button
                className={`icon-btn ${showNotifs ? "is-on" : ""}`}
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  setShowProfileMenu(false);
                }}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
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
                          className="notif-item notif-item-unread"
                          onClick={() => openNotification(n)}
                        >
                          <div className="notif-item-icon" style={{
                            background: (n.message || "").toLowerCase().includes("admission") || (n.message || "").toLowerCase().includes("enrollment")
                              ? "var(--accent-soft)"
                              : n.message.includes("registration") ? "rgba(34, 197, 94, 0.1)" : "var(--accent-soft)",
                            color: (n.message || "").toLowerCase().includes("admission") || (n.message || "").toLowerCase().includes("enrollment")
                              ? "var(--accent)"
                              : n.message.includes("registration") ? "var(--green)" : "var(--accent)"
                          }}>
                            {(n.message || "").toLowerCase().includes("admission") || (n.message || "").toLowerCase().includes("enrollment")
                              ? <ClipboardCheck size={18} />
                              : n.message.includes("registration") ? <School size={18} /> : <Bell size={18} />}
                          </div>
                          <div className="notif-item-content">
                            <p className="notif-item-msg">{n.message}</p>
                            <span className="notif-item-time">
                              <Clock size={12} />
                              {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <button className="notif-read-btn" title="Mark as read" onClick={(e) => handleMarkRead(n.id, e)}>
                            <Check size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="notif-empty">
                        <Bell size={28} />
                        <p>All caught up</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="profile-menu-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className={`avatar-sm ${showProfileMenu ? "is-open" : ""}`}
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                title="Account"
                onClick={() => {
                  setShowProfileMenu((open) => !open);
                  setShowNotifs(false);
                }}
              >
                {avatarUrl ? <img src={avatarUrl} alt="" /> : (displayName?.[0]?.toUpperCase() || "U")}
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-head">
                    <div className="avatar">
                      {avatarUrl ? <img src={avatarUrl} alt="" /> : (displayName?.[0]?.toUpperCase() || "U")}
                    </div>
                    <div>
                      <div className="user-name">{displayName}</div>
                      <div className="user-role">{role ? role.charAt(0).toUpperCase() + role.slice(1) : "Role"}</div>
                    </div>
                  </div>
                  <Link to="/profile" className="profile-menu-item" role="menuitem" onClick={() => setShowProfileMenu(false)}>
                    <UserIcon size={16} />
                    <span>Profile</span>
                  </Link>
                  {role === "admin" && (
                    <>
                      <Link to="/landing-settings" className="profile-menu-item" role="menuitem" onClick={() => setShowProfileMenu(false)}>
                        <LayoutDashboard size={16} />
                        <span>Public Landing Page</span>
                      </Link>
                      <Link to="/settings" className="profile-menu-item" role="menuitem" onClick={() => setShowProfileMenu(false)}>
                        <Settings size={16} />
                        <span>School Settings</span>
                      </Link>
                    </>
                  )}
                  {isDemoMode() && (
                    <button type="button" className="profile-menu-item danger" onClick={handleLogout}>
                      <div className="pulse-dot"></div>
                      <span>Exit Demo Mode</span>
                    </button>
                  )}
                  <button type="button" className="profile-menu-item danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={`page-body ${location.pathname.startsWith("/chat") ? "is-chat" : ""}`}>
          <Outlet />
        </div>
      </main>
      {/* Only show AI Assistant for Business and Pro plans */}
      {role === "admin" && (planType === "Business" || planType === "Pro") && (
        <AIAssistant variant="school" toggleTheme={toggleTheme} />
      )}
      {role === "superadmin" && <AIAssistant variant="platform" toggleTheme={toggleTheme} />}
    </div>
  );
}
