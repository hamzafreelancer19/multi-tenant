import { useState } from "react";
import ParentFrame, { formatDate } from "./ParentFrame";
import AppModal from "../../components/AppModal";
import { X } from "lucide-react";

export default function ParentNotices() {
  const [viewing, setViewing] = useState(null);

  return (
    <ParentFrame
      kicker="Notices"
      title="School notices"
      subtitle={(ctx) => `${ctx.notices.length} notice${ctx.notices.length === 1 ? "" : "s"} for parents`}
    >
      {(ctx) => (
        <>
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {ctx.notices.length ? ctx.notices.map((row) => (
                  <tr key={row.id} style={{ cursor: "pointer" }} onClick={() => setViewing(row)}>
                    <td>
                      <div className="st-cell-stack">
                        <b>{row.title}{row.is_pinned ? " · Pinned" : ""}</b>
                        <small>{String(row.content || "").slice(0, 80) || "Open to read"}</small>
                      </div>
                    </td>
                    <td>{row.category || "General"}</td>
                    <td>{row.priority || "Normal"}</td>
                    <td>{formatDate(row.created_at)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4}>No notices right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {viewing && (
            <AppModal onClose={() => setViewing(null)}>
              <div className="st-modal st-view">
                <header>
                  <div>
                    <p>{viewing.category}</p>
                    <h2>{viewing.title}</h2>
                  </div>
                  <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
                </header>
                <div className="st-modal-body">
                  <p className="st-hint">{viewing.priority} · {formatDate(viewing.created_at)}</p>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{viewing.content || "—"}</p>
                </div>
              </div>
            </AppModal>
          )}
        </>
      )}
    </ParentFrame>
  );
}
