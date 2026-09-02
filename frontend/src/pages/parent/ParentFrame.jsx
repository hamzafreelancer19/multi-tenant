import { GraduationCap } from "lucide-react";
import useChildRecord from "./useChildRecord";
import "../Dashboard.css";
import "../Teachers.css";
import "../Students.css";

export function money(n) {
  return `Rs ${Number(n || 0).toLocaleString()}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const raw = String(value);
  const d = new Date(raw.length <= 10 ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export function statusBadge(status) {
  const value = (status || "").toLowerCase();
  if (value === "present" || value === "paid" || value === "returned" || value === "active") return "is-on";
  if (value === "late" || value === "partial" || value === "leave" || value === "due today") return "is-warn";
  return "is-off";
}

export default function ParentFrame({ kicker, title, subtitle, children }) {
  const ctx = useChildRecord();

  if (ctx.loading) {
    return (
      <div className="page dash-page st-page">
        <div className="st-empty"><p>Loading your child's record…</p></div>
      </div>
    );
  }

  if (!ctx.student.id) {
    return (
      <div className="page dash-page st-page">
        <div className="st-empty">
          <GraduationCap size={32} />
          <p>No student is linked to this parent login. Ask school admin to create the parent portal username.</p>
        </div>
      </div>
    );
  }

  const heading = typeof title === "function" ? title(ctx) : title;
  const line = typeof subtitle === "function" ? subtitle(ctx) : subtitle;

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">{kicker}</p>
          <h1>{heading}</h1>
          <p>{line}</p>
        </div>
      </header>
      {children(ctx)}
    </div>
  );
}
