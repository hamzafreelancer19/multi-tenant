import ParentFrame from "./ParentFrame";

function Row({ label, value, wide }) {
  return (
    <div className={wide ? "st-span-2" : ""}>
      <small>{label}</small>
      <b>{value || "—"}</b>
    </div>
  );
}

export default function ParentProfile() {
  return (
    <ParentFrame
      kicker="Child profile"
      title={(ctx) => ctx.student.name}
      subtitle={(ctx) => `${ctx.student.class_name || "Class"} · ${ctx.student.roll_no || "No roll no"}`}
    >
      {(ctx) => {
        const s = ctx.student;
        const ic = ctx.incharge || {};
        return (
          <section className="tp-class">
            <div className="st-view-grid">
              <Row label="Class" value={s.class_name} />
              <Row label="Roll no" value={s.roll_no} />
              <Row label="Status" value={s.status} />
              <Row label="Gender" value={s.gender} />
              <Row label="Date of birth" value={s.date_of_birth} />
              <Row label="B-Form / CNIC" value={s.bform_cnic} />
              <Row label="Class incharge" value={ic.name} />
              <Row label="Incharge phone" value={ic.phone} />
              <Row label="Room" value={ic.room_no} />
              <Row label="Shift" value={ic.shift} />
              <Row label="Father / guardian" value={s.father_name} />
              <Row label="Guardian phone" value={s.father_phone} />
              <Row label="Guardian CNIC" value={s.father_cnic} />
              <Row label="Occupation" value={s.father_occupation} />
              <Row label="Mother" value={s.mother_name} />
              <Row label="Mother’s phone" value={s.mother_phone} />
              <Row label="Emergency" value={s.emergency_phone} />
              <Row label="Student phone" value={s.phone} />
              <Row label="Email" value={s.email} />
              <Row label="City" value={s.city} />
              <Row label="Previous school" value={s.previous_school} />
              <Row label="Address" value={s.address} wide />
              <Row label="Notes" value={s.notes} wide />
            </div>
          </section>
        );
      }}
    </ParentFrame>
  );
}
