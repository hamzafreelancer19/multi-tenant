import ParentFrame from "./ParentFrame";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ParentTimetable() {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <ParentFrame
      kicker="Timetable"
      title="Class schedule"
      subtitle={(ctx) => `${ctx.student.name} · ${ctx.student.class_name || "Class"}`}
    >
      {(ctx) => {
        const days = DAYS.filter((day) => ctx.timetable.some((row) => row.day === day));
        return (
          <>
            {days.length ? days.map((day) => (
              <section key={day} className="tp-class" style={{ marginBottom: 14 }}>
                <div className="tp-class-top">
                  <span className={`tp-badge ${day === todayName ? "is-home" : ""}`}>{day}</span>
                </div>
                <h2>{day === todayName ? "Today" : day}</h2>
                <div className="st-table-wrap" style={{ marginTop: 12 }}>
                  <table className="st-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.timetable.filter((row) => row.day === day).map((row) => (
                        <tr key={row.id}>
                          <td className="st-mono">{row.start_time}–{row.end_time}</td>
                          <td>{row.subject}{row.period_type && row.period_type !== "Lecture" ? ` · ${row.period_type}` : ""}</td>
                          <td>{row.teacher_name || "—"}</td>
                          <td>{row.room_no || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )) : (
              <div className="st-empty"><p>No timetable is set for this class yet.</p></div>
            )}
          </>
        );
      }}
    </ParentFrame>
  );
}
