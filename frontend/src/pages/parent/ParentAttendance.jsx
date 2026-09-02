import ParentFrame, { formatDate, statusBadge } from "./ParentFrame";

export default function ParentAttendance() {
  return (
    <ParentFrame
      kicker="Attendance"
      title="Daily register"
      subtitle={(ctx) => `${ctx.student.name} · ${ctx.attendance.rate || 0}% present`}
    >
      {(ctx) => {
        const rows = ctx.attendance.recent || [];
        return (
          <>
            <div className="dash-stats tp-stats">
              <article className="dash-stat dash-stat-green"><span>Present</span><strong>{ctx.attendance.present || 0}</strong><small>days</small></article>
              <article className="dash-stat dash-stat-navy"><span>Late</span><strong>{ctx.attendance.late || 0}</strong><small>days</small></article>
              <article className="dash-stat dash-stat-orange"><span>Absent / leave</span><strong>{(ctx.attendance.absent || 0) + (ctx.attendance.leave || 0)}</strong><small>{ctx.attendance.leave || 0} leave</small></article>
            </div>
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map((row) => (
                    <tr key={row.date}>
                      <td>{formatDate(row.date)}</td>
                      <td><span className={`st-badge ${statusBadge(row.status)}`}>{row.status}</span></td>
                      <td>{row.remarks || "—"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3}>No attendance marked yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      }}
    </ParentFrame>
  );
}
