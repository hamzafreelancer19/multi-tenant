import ParentFrame, { formatDate, money, statusBadge } from "./ParentFrame";

export default function ParentLibrary() {
  return (
    <ParentFrame
      kicker="Library"
      title="Issued books"
      subtitle={(ctx) => `${ctx.student.name} · ${ctx.library.filter((row) => row.status === "Issued").length} currently issued`}
    >
      {(ctx) => (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Returned</th>
                <th>Fine</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ctx.library.length ? ctx.library.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="st-cell-stack">
                      <b>{row.title}</b>
                      <small>{row.author || "Library"}</small>
                    </div>
                  </td>
                  <td>{formatDate(row.issue_date)}</td>
                  <td>{formatDate(row.due_date)}</td>
                  <td>{formatDate(row.return_date)}</td>
                  <td>{money(row.fine_amount)}</td>
                  <td><span className={`st-badge ${statusBadge(row.status)}`}>{row.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={6}>No library books issued to your child.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </ParentFrame>
  );
}
