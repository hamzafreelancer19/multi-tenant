import ParentFrame, { money } from "./ParentFrame";

function Row({ label, value }) {
  return (
    <div>
      <small>{label}</small>
      <b>{value || "—"}</b>
    </div>
  );
}

export default function ParentTransport() {
  return (
    <ParentFrame
      kicker="Transport"
      title="Van / bus"
      subtitle={(ctx) => `${ctx.student.name} · ${ctx.transport?.route_name || "not on a route"}`}
    >
      {(ctx) => {
        const t = ctx.transport;
        if (!t) {
          return <div className="st-empty"><p>Your child is not assigned to a school van or bus yet.</p></div>;
        }
        return (
          <section className="tp-class">
            <div className="tp-class-top">
              <span className="tp-badge is-home">{t.vehicle_type || "Vehicle"}</span>
            </div>
            <h2>{t.route_name}</h2>
            <p>{t.start_point || "Start"} → {t.end_point || "Campus"}</p>
            <div className="st-view-grid" style={{ marginTop: 16 }}>
              <Row label="Pickup stop" value={t.stop_name} />
              <Row label="Vehicle no" value={t.vehicle_no} />
              <Row label="Morning" value={t.morning_time} />
              <Row label="Evening" value={t.evening_time} />
              <Row label="Driver" value={t.driver_name} />
              <Row label="Driver phone" value={t.driver_phone} />
              <Row label="Route fare" value={t.route_fare ? money(t.route_fare) : ""} />
              <Row label="Stops" value={t.stops} />
            </div>
          </section>
        );
      }}
    </ParentFrame>
  );
}
