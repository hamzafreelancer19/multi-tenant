import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  MessageCircle,
} from "lucide-react";
import { getMyTeacherProfile } from "../api/teachersApi";
import { assignPeriodCover, clearPeriodCover, getCoverBoard, getFreeTeachers } from "../api/timetableApi";
import { getDisplayName, getUser } from "../store/authStore";
import { useTenant } from "../context/TenantContext";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Teachers.css";

const LINKS = [
  { to: "/teacher/admissions", icon: ClipboardCheck, title: "Admissions", desc: "Take class tests and send approved requests to school admin.", incharge: true },
  { to: "/chat", icon: MessageCircle, title: "Chat", desc: "Message school admin and parents of your classes." },
  { to: "/attendance", icon: CalendarCheck, title: "Class attendance", desc: "Mark today's student register for your class.", incharge: true },
  { to: "/students", icon: GraduationCap, title: "Students", desc: "Open the student list for your classes." },
  { to: "/exams", icon: BookOpen, title: "Exams", desc: "Enter marks and view results." },
  { to: "/assignments", icon: ClipboardList, title: "Homework", desc: "Assign and follow class work." },
  { to: "/notices", icon: Bell, title: "Notices", desc: "Read and post school notices." },
  { to: "/timetable", icon: Clock, title: "Timetable", desc: "See every period in your class." },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || fallback;
}

export default function TeacherPortal() {
  const navigate = useNavigate();
  const tenant = useTenant();
  const user = getUser();
  const [profile, setProfile] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [board, setBoard] = useState({ day: "", classes: [] });
  const [coverPick, setCoverPick] = useState(null);
  const [freeTeachers, setFreeTeachers] = useState([]);
  const [coverSaving, setCoverSaving] = useState(false);
  const [coverError, setCoverError] = useState("");

  const loadBoard = (nextDate = date) => {
    getCoverBoard({ date: nextDate })
      .then((res) => setBoard(res.data || { day: "", classes: [] }))
      .catch(() => setBoard({ day: "", classes: [] }));
  };

  useEffect(() => {
    getMyTeacherProfile()
      .then((res) => setProfile(res.data && res.data.id ? res.data : null))
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    loadBoard(date);
  }, [date]);

  const schoolName = tenant.schoolName || user?.school_name || "your school";
  const scope = profile?.classroom_scope || {};
  const classCards = Array.isArray(scope.classes) ? scope.classes : [];
  const assigned = scope.assigned_classes?.length
    ? scope.assigned_classes
    : (Array.isArray(profile?.classes) ? profile.classes.filter(Boolean) : []);
  const studentTotal = useMemo(
    () => classCards.reduce((sum, item) => sum + (Number(item.student_count) || 0), 0),
    [classCards]
  );
  const inchargeCount = (scope.incharge_classes || []).length;
  const boardByClass = useMemo(() => {
    const map = {};
    (board.classes || []).forEach((item) => {
      map[item.label] = item;
    });
    return map;
  }, [board]);

  const boardFor = (label) => {
    if (boardByClass[label]) return boardByClass[label];
    const norm = (value) => (value || "").toLowerCase().replace(/\s+/g, " ").trim();
    const target = norm(label);
    return Object.values(boardByClass).find((item) => norm(item.label) === target);
  };

  const openClass = (path, label) => {
    navigate(path, { state: { className: label } });
  };

  const openCover = async (period) => {
    setCoverError("");
    setCoverPick(period);
    setFreeTeachers([]);
    try {
      const res = await getFreeTeachers(period.id, { date });
      setFreeTeachers(Array.isArray(res.data?.teachers) ? res.data.teachers : []);
    } catch (err) {
      setCoverError(apiError(err, "Could not load free teachers."));
    }
  };

  const assignCover = async (teacherId) => {
    if (!coverPick) return;
    setCoverSaving(true);
    setCoverError("");
    try {
      await assignPeriodCover(coverPick.id, { date, teacher: teacherId });
      setCoverPick(null);
      loadBoard();
    } catch (err) {
      setCoverError(apiError(err, "Could not assign cover teacher."));
    } finally {
      setCoverSaving(false);
    }
  };

  const removeCover = async (period) => {
    try {
      await clearPeriodCover(period.id, { date });
      loadBoard();
    } catch (err) {
      setCoverError(apiError(err, "Could not clear cover."));
    }
  };

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Teacher portal</p>
          <h1>{getDisplayName()}</h1>
          <p>
            Only your assigned class data appears here
            {profile?.subject ? ` · ${profile.subject}` : ""} at {schoolName}.
          </p>
        </div>
        {inchargeCount > 0 && (
          <div className="dash-hero-meta">
            <label className="tp-date">
              Period date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
            </label>
          </div>
        )}
      </header>

      <div className="dash-stats tp-stats">
        <article className="dash-stat dash-stat-orange">
          <span>Subject</span>
          <strong>{profile?.subject || "—"}</strong>
          <small>{profile?.designation || "Faculty"}</small>
        </article>
        <article className="dash-stat dash-stat-navy">
          <span>Classes</span>
          <strong>{assigned.length || "—"}</strong>
          <small>
            {inchargeCount ? `${inchargeCount} as class incharge` : "Period classes"}
          </small>
        </article>
        <article className="dash-stat dash-stat-green">
          <span>Students</span>
          <strong>{classCards.length ? studentTotal : "—"}</strong>
          <small>in your classes</small>
        </article>
      </div>

      {classCards.length > 0 ? (
        <section className="tp-classes">
          {classCards.map((item) => {
            const dayBoard = boardFor(item.label);
            const periods = dayBoard?.periods || [];
            return (
              <article key={item.label} className={`tp-class ${item.is_incharge ? "is-incharge" : ""}`}>
                <div className="tp-class-top">
                  <span className={item.is_incharge ? "tp-badge is-home" : "tp-badge"}>
                    {item.is_incharge ? "Class incharge" : "Subject teacher"}
                  </span>
                  {item.room_no ? <small>Room {item.room_no}</small> : null}
                </div>
                <h2>{item.label}</h2>
                <p>
                  {item.student_count || 0} students
                  {item.my_subjects?.length ? ` · ${item.my_subjects.join(", ")}` : ""}
                  {item.incharge?.name && !item.is_incharge ? ` · Incharge ${item.incharge.name}` : ""}
                </p>

                {item.period_teachers?.length > 0 && (
                  <div className="tp-teachers">
                    <h3>{item.is_incharge ? "Teachers of this class" : "Class teachers"}</h3>
                    <ul>
                      {item.period_teachers.map((t) => (
                        <li key={t.id}>
                          <strong>{t.name}{t.is_self ? " (You)" : ""}</strong>
                          <span>
                            {t.is_incharge ? "Incharge" : (t.subjects?.length ? t.subjects.join(", ") : t.subject)}
                            {t.periods ? ` · ${t.periods} period${t.periods === 1 ? "" : "s"}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.is_incharge && (
                  <div className="tp-periods">
                    <h3>{board.day || "Today"} periods</h3>
                    {periods.length === 0 ? (
                      <p className="tp-muted">No timetable periods for this day. Add them in Class schedules.</p>
                    ) : (
                      <ul>
                        {periods.map((period) => (
                          <li key={period.id} className={period.cover ? "is-cover" : ""}>
                            <div>
                              <strong>{period.start_time}–{period.end_time} · {period.subject}</strong>
                              <span>
                                {period.period_type === "Break"
                                  ? "Break"
                                  : period.cover
                                    ? `${period.teacher_name || "Regular teacher"} not in · ${period.cover.teacher_name} covering`
                                    : (period.teacher_name ? `${period.teacher_name}${period.teacher_subject ? ` · ${period.teacher_subject}` : ""}` : "No teacher assigned")}
                              </span>
                            </div>
                            {dayBoard?.can_cover && period.can_cover && (
                              <div className="tp-period-actions">
                                {period.cover ? (
                                  <>
                                    <button type="button" onClick={() => openCover(period)}>Change</button>
                                    <button type="button" onClick={() => removeCover(period)}>Clear</button>
                                  </>
                                ) : (
                                  <button type="button" onClick={() => openCover(period)}>Teacher not coming</button>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="tp-class-actions">
                  <button type="button" onClick={() => openClass("/students", item.label)}>Students</button>
                  {item.is_incharge && (
                    <button type="button" onClick={() => openClass("/attendance", item.label)}>Attendance</button>
                  )}
                  <button type="button" onClick={() => openClass("/timetable", item.label)}>Timetable</button>
                  {item.is_incharge && (
                    <button type="button" onClick={() => navigate("/teacher/admissions")}>Admissions</button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="st-empty tp-empty">
          <GraduationCap size={32} />
          <p>No class is assigned to you yet. Ask school admin to set you as class incharge or add your periods in the timetable.</p>
        </div>
      )}

      <section className="tp-grid">
        {(inchargeCount > 0 ? LINKS : LINKS.filter((item) => !item.incharge)).map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.to} type="button" className="tp-card" onClick={() => navigate(item.to)}>
              <Icon size={20} />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </button>
          );
        })}
      </section>

      {coverPick && (
        <AppModal onClose={() => !coverSaving && setCoverPick(null)}>
          <div className="st-modal tp-cover-modal">
            <header>
              <div>
                <p className="dash-kicker">Cover teacher</p>
                <h2>{coverPick.subject}</h2>
                <p>{coverPick.start_time}–{coverPick.end_time} · {coverPick.teacher_name || "No regular teacher"}</p>
              </div>
              <button type="button" className="st-ghost" onClick={() => setCoverPick(null)}>Close</button>
            </header>
            <div className="st-modal-body">
              <p className="tp-muted">Teachers who are free in this slot can take the period.</p>
              {coverError ? <p className="tp-error">{coverError}</p> : null}
              {freeTeachers.length === 0 && !coverError ? (
                <p>No other teacher is free at this time.</p>
              ) : (
                <div className="tp-free-list">
                  {freeTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      type="button"
                      disabled={coverSaving}
                      onClick={() => assignCover(teacher.id)}
                    >
                      <strong>{teacher.name}</strong>
                      <span>{teacher.subject || teacher.designation || "Free this period"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
