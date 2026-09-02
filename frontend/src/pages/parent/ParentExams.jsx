import ParentFrame, { formatDate } from "./ParentFrame";

export default function ParentExams() {
  return (
    <ParentFrame
      kicker="Exams"
      title="Papers and results"
      subtitle={(ctx) => `${ctx.student.name} · ${ctx.student.class_name || "Class"}`}
    >
      {(ctx) => (
        <>
          <section className="tp-class" style={{ marginBottom: 14 }}>
            <div className="tp-class-top"><span className="tp-badge">Upcoming</span></div>
            <h2>Exam schedule</h2>
            <div className="st-table-wrap" style={{ marginTop: 12 }}>
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {ctx.exams.length ? ctx.exams.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.subject || "—"}</td>
                      <td>{row.exam_type || "—"}</td>
                      <td>{formatDate(row.start_date)}{row.end_date ? ` – ${formatDate(row.end_date)}` : ""}</td>
                      <td>{row.venue || "—"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5}>No exams scheduled.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="tp-class">
            <div className="tp-class-top"><span className="tp-badge">Results</span></div>
            <h2>Marks</h2>
            <div className="st-table-wrap" style={{ marginTop: 12 }}>
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {ctx.results.length ? ctx.results.map((row, idx) => (
                    <tr key={`${row.exam}-${idx}`}>
                      <td>{row.exam}</td>
                      <td>{row.subject}</td>
                      <td>{row.marks}/{row.total}</td>
                      <td>{row.grade || "—"}</td>
                      <td>{row.remarks || "—"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5}>No results entered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </ParentFrame>
  );
}
