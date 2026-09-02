import ParentFrame, { formatDate, money, statusBadge } from "./ParentFrame";

export default function ParentFees() {
  return (
    <ParentFrame
      kicker="Fees"
      title="Fee record"
      subtitle={(ctx) => `${ctx.student.name} · ${ctx.fees.pending_count || 0} unpaid challans`}
    >
      {(ctx) => {
        const rows = ctx.fees.rows || [];
        return (
          <>
            <div className="dash-stats tp-stats">
              <article className="dash-stat dash-stat-green"><span>Paid</span><strong>{money(ctx.fees.paid_total || 0)}</strong><small>received</small></article>
              <article className="dash-stat dash-stat-orange"><span>Due</span><strong>{money(ctx.fees.due_total || 0)}</strong><small>remaining</small></article>
              <article className="dash-stat dash-stat-navy"><span>Challans</span><strong>{rows.length}</strong><small>on file</small></article>
            </div>
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.fee_type || "Fee"}</td>
                      <td>{row.month || "—"}</td>
                      <td>{money(row.amount)}</td>
                      <td>{money(row.paid_amount)}</td>
                      <td>{money(row.remaining)}</td>
                      <td><span className={`st-badge ${statusBadge(row.status)}`}>{row.status}</span></td>
                      <td>{formatDate(row.due_date)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}>No fee challans yet.</td></tr>
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
