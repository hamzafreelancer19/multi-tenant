import ParentFrame, { formatDate, statusBadge } from "./ParentFrame";

export default function ParentHomework() {
  return (
    <ParentFrame
      kicker="Homework"
      title="Class work"
      subtitle={(ctx) => `${ctx.student.name} · ${ctx.homework.length} assignments`}
    >
      {(ctx) => (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Due</th>
                <th>Teacher</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ctx.homework.length ? ctx.homework.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="st-cell-stack">
                      <b>{row.title}</b>
                      {row.description ? <small>{row.description}</small> : null}
                    </div>
                  </td>
                  <td>{row.subject || "—"}</td>
                  <td>{row.assignment_type || "Homework"}</td>
                  <td>{formatDate(row.due_date)}{row.due_time ? ` · ${row.due_time}` : ""}</td>
                  <td>{row.teacher_name || "—"}</td>
                  <td><span className={`st-badge ${statusBadge(row.status)}`}>{row.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={6}>No homework assigned.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </ParentFrame>
  );
}
