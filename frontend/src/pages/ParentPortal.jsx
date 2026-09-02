import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Clock,
  CreditCard,
  MessageCircle,
  User,
} from "lucide-react";
import { getDisplayName } from "../store/authStore";
import ParentFrame, { formatDate, money } from "./parent/ParentFrame";

const LINKS = [
  { to: "/parent/profile", icon: User, title: "Child profile", desc: "Name, class, roll no, and guardian details." },
  { to: "/parent/attendance", icon: CalendarCheck, title: "Attendance", desc: "Present, absent, late, and leave days." },
  { to: "/parent/fees", icon: CreditCard, title: "Fees", desc: "Paid challans and remaining dues." },
  { to: "/parent/exams", icon: BookOpen, title: "Exams", desc: "Upcoming papers and result marks." },
  { to: "/parent/homework", icon: ClipboardList, title: "Homework", desc: "Class work and due dates." },
  { to: "/parent/timetable", icon: Clock, title: "Timetable", desc: "Today and the full week timetable." },
  { to: "/parent/notices", icon: Bell, title: "Notices", desc: "School and class notices for parents." },
  { to: "/parent/library", icon: BookOpen, title: "Library", desc: "Books issued to your child." },
  { to: "/chat", icon: MessageCircle, title: "Chat", desc: "Message class teachers and school admin." },
];

export default function ParentPortal() {
  const navigate = useNavigate();

  return (
    <ParentFrame
      kicker="Parent portal"
      title={(ctx) => ctx.student.name}
      subtitle={(ctx) =>
        `${ctx.student.class_name || "Class"} ${ctx.student.roll_no ? `· ${ctx.student.roll_no}` : ""} at ${ctx.tenant.schoolName || "school"}. Signed in as ${getDisplayName()}.`
      }
    >
      {(ctx) => {
        const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const todayPeriods = ctx.timetable.filter((row) => row.day === todayName);
        const unpaid = (ctx.fees.rows || []).filter((row) => row.status !== "Paid").slice(0, 4);
        const latestNotices = (ctx.notices || []).slice(0, 3);

        return (
          <>
            <div className="dash-stats tp-stats">
              <article className="dash-stat dash-stat-orange">
                <span>Attendance</span>
                <strong>{ctx.attendance.rate || 0}%</strong>
                <small>{ctx.attendance.present || 0} present · {ctx.attendance.absent || 0} absent</small>
              </article>
              <article className="dash-stat dash-stat-navy">
                <span>Homework</span>
                <strong>{ctx.homework.length}</strong>
                <small>assigned for this class</small>
              </article>
              <article className="dash-stat dash-stat-green">
                <span>Fees due</span>
                <strong>{ctx.fees.pending_count || 0}</strong>
                <small>{money(ctx.fees.due_total || 0)} remaining</small>
              </article>
            </div>

            <section className="tp-classes">
              <article className="tp-class">
                <div className="tp-class-top">
                  <span className="tp-badge is-home">Today · {todayName}</span>
                </div>
                <h2>Periods</h2>
                <div className="tp-teachers">
                  <ul>
                    {todayPeriods.map((row) => (
                      <li key={row.id}>
                        <strong>{row.start_time}–{row.end_time} · {row.subject}</strong>
                        <span>{row.teacher_name || "Teacher"}{row.room_no ? ` · Room ${row.room_no}` : ""}</span>
                      </li>
                    ))}
                    {!todayPeriods.length && <li><span>No periods on the timetable for today.</span></li>}
                  </ul>
                </div>
              </article>

              <article className="tp-class">
                <div className="tp-class-top">
                  <span className="tp-badge">Unpaid fees</span>
                </div>
                <h2>{money(ctx.fees.due_total || 0)}</h2>
                <div className="tp-teachers">
                  <ul>
                    {unpaid.map((row) => (
                      <li key={row.id}>
                        <strong>{row.fee_type} {row.month ? `· ${row.month}` : ""}</strong>
                        <span>{money(row.remaining || row.amount)} · {row.status}</span>
                      </li>
                    ))}
                    {!unpaid.length && <li><span>No unpaid challans.</span></li>}
                  </ul>
                </div>
              </article>

              <article className="tp-class">
                <div className="tp-class-top">
                  <span className="tp-badge">Notices</span>
                </div>
                <h2>Latest</h2>
                <div className="tp-teachers">
                  <ul>
                    {latestNotices.map((row) => (
                      <li key={row.id}>
                        <strong>{row.title}</strong>
                        <span>{row.category}{row.created_at ? ` · ${formatDate(row.created_at)}` : ""}</span>
                      </li>
                    ))}
                    {!latestNotices.length && <li><span>No notices right now.</span></li>}
                  </ul>
                </div>
              </article>
            </section>

            <section className="tp-grid">
              {LINKS.map((item) => {
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
          </>
        );
      }}
    </ParentFrame>
  );
}
