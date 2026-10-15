import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { rootNavigate } from "../navigation/rootNav";
import { getMyChild } from "../api";
import { Badge, Card, EmptyState, ErrorText, Hero, LoadingBlock, MenuRow, Screen, StatRow } from "../components/ui";
import { apiError, formatDate, money } from "../utils";

function useChild() {
  const [ctx, setCtx] = useState({ loading: true, error: "", student: {}, attendance: {}, fees: {}, exams: [], results: [], homework: [], timetable: [], notices: [], library: [], incharge: {} });
  const load = async () => {
    try {
      const res = await getMyChild();
      const data = res.data || {};
      setCtx({
        loading: false,
        error: "",
        data,
        student: data.student || {},
        attendance: data.attendance || {},
        fees: data.fees || {},
        exams: data.exams || [],
        results: data.results || [],
        homework: data.homework || [],
        timetable: data.timetable || [],
        notices: data.notices || [],
        library: data.library || [],
        incharge: data.incharge || {},
      });
    } catch (err) {
      setCtx((p) => ({ ...p, loading: false, error: apiError(err, "Could not load child record.") }));
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  return { ...ctx, load };
}

function Frame({ kicker, title, subtitle, children }) {
  const ctx = useChild();
  if (ctx.loading) return <Screen><LoadingBlock /></Screen>;
  if (!ctx.student.id) {
    return (
      <Screen onRefresh={ctx.load}>
        <EmptyState title="No child linked" text="Ask school admin to create the parent portal username." />
      </Screen>
    );
  }
  return (
    <Screen onRefresh={ctx.load}>
      <Hero kicker={kicker} title={typeof title === "function" ? title(ctx) : title} subtitle={typeof subtitle === "function" ? subtitle(ctx) : subtitle} />
      <ErrorText>{ctx.error}</ErrorText>
      {children(ctx)}
    </Screen>
  );
}

export function ParentHomeScreen() {
  const navigation = { navigate: rootNavigate };
  return (
    <Frame kicker="Parent portal" title={(c) => c.student.name} subtitle={(c) => `${c.student.class_name || "Class"} ${c.student.roll_no || ""}`}>
      {(ctx) => {
        const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const todayPeriods = ctx.timetable.filter((row) => row.day === todayName);
        return (
          <>
            <StatRow items={[
              { label: "Attendance", value: `${ctx.attendance.rate || 0}%`, desc: `${ctx.attendance.present || 0} present`, tone: "orange" },
              { label: "Homework", value: ctx.homework.length, desc: "assigned", tone: "navy" },
              { label: "Fees due", value: ctx.fees.pending_count || 0, desc: money(ctx.fees.due_total || 0), tone: "gold" },
            ]} />
            <Card>
              <Hero kicker={`Today · ${todayName}`} title="Periods" />
              {todayPeriods.length ? todayPeriods.map((row) => (
                <Hero key={row.id} kicker={`${row.start_time}–${row.end_time}`} title={row.subject} subtitle={row.teacher_name} />
              )) : <EmptyState text="No periods today." />}
            </Card>
            <MenuRow title="Child profile" onPress={() => navigation.navigate("ParentProfile")} />
            <MenuRow title="Attendance" onPress={() => navigation.navigate("ParentAttendance")} />
            <MenuRow title="Fees" onPress={() => navigation.navigate("ParentFees")} />
            <MenuRow title="Exams" onPress={() => navigation.navigate("ParentExams")} />
            <MenuRow title="Homework" onPress={() => navigation.navigate("ParentHomework")} />
            <MenuRow title="Timetable" onPress={() => navigation.navigate("ParentTimetable")} />
            <MenuRow title="Notices" onPress={() => navigation.navigate("ParentNotices")} />
            <MenuRow title="Library" onPress={() => navigation.navigate("ParentLibrary")} />
            <MenuRow title="Chat" onPress={() => navigation.navigate("Chat")} />
          </>
        );
      }}
    </Frame>
  );
}

export function ParentProfileScreen() {
  return (
    <Frame kicker="Child profile" title={(c) => c.student.name} subtitle={(c) => c.student.class_name}>
      {(ctx) => {
        const s = ctx.student;
        const rows = [
          ["Class", s.class_name], ["Roll no", s.roll_no], ["Status", s.status], ["Gender", s.gender],
          ["Date of birth", s.date_of_birth], ["B-Form", s.bform_cnic], ["Incharge", ctx.incharge.name],
          ["Father", s.father_name], ["Guardian phone", s.father_phone], ["Mother", s.mother_name],
          ["Email", s.email], ["City", s.city], ["Address", s.address],
        ];
        return rows.map(([label, value]) => <Card key={label}><Hero kicker={label} title={value || "—"} /></Card>);
      }}
    </Frame>
  );
}

export function ParentAttendanceScreen() {
  return (
    <Frame kicker="Attendance" title="Daily register" subtitle={(c) => `${c.attendance.rate || 0}% present`}>
      {(ctx) => (
        <>
          <StatRow items={[
            { label: "Present", value: ctx.attendance.present || 0, tone: "green" },
            { label: "Late", value: ctx.attendance.late || 0, tone: "gold" },
            { label: "Absent / leave", value: (ctx.attendance.absent || 0) + (ctx.attendance.leave || 0), tone: "navy" },
          ]} />
          {(ctx.attendance.recent || []).length ? ctx.attendance.recent.map((row) => (
            <Card key={row.date}><Hero kicker={formatDate(row.date)} title={row.status} subtitle={row.remarks} /><Badge status={row.status} label={row.status} /></Card>
          )) : <EmptyState text="No attendance marked yet." />}
        </>
      )}
    </Frame>
  );
}

export function ParentFeesScreen() {
  return (
    <Frame kicker="Fees" title="Fee record" subtitle={(c) => `${c.fees.pending_count || 0} unpaid`}>
      {(ctx) => (
        <>
          <StatRow items={[
            { label: "Paid", value: money(ctx.fees.paid_total || 0), tone: "green" },
            { label: "Due", value: money(ctx.fees.due_total || 0), tone: "gold" },
          ]} />
          {(ctx.fees.rows || []).map((row) => (
            <Card key={row.id}>
              <Hero kicker={row.fee_type} title={money(row.amount)} subtitle={`${row.month} · paid ${money(row.paid_amount)}`} />
              <Badge status={row.status} label={row.status} />
            </Card>
          ))}
        </>
      )}
    </Frame>
  );
}

export function ParentExamsScreen() {
  return (
    <Frame kicker="Exams" title="Papers and results">
      {(ctx) => (
        <>
          {ctx.exams.map((row) => (
            <Card key={row.id}><Hero kicker={row.subject} title={row.title} subtitle={`${formatDate(row.start_date)} · ${row.venue || ""}`} /></Card>
          ))}
          {ctx.results.map((row, i) => (
            <Card key={i}><Hero kicker={row.exam_title || row.subject} title={`${row.marks ?? row.obtained}/${row.total_marks || ""}`} /></Card>
          ))}
          {!ctx.exams.length && !ctx.results.length && <EmptyState text="No exams yet." />}
        </>
      )}
    </Frame>
  );
}

export function ParentHomeworkScreen() {
  return (
    <Frame kicker="Homework" title="Class work">
      {(ctx) => ctx.homework.length ? ctx.homework.map((row) => (
        <Card key={row.id}><Hero kicker={row.subject} title={row.title} subtitle={`Due ${formatDate(row.due_date)} · ${row.teacher_name || ""}`} /><Badge status={row.status} label={row.status} /></Card>
      )) : <EmptyState text="No homework assigned." />}
    </Frame>
  );
}

export function ParentTimetableScreen() {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (
    <Frame kicker="Timetable" title="Class schedule">
      {(ctx) => {
        const days = DAYS.filter((d) => ctx.timetable.some((r) => r.day === d));
        return days.length ? days.map((day) => (
          <Card key={day}>
            <Hero title={day} />
            {ctx.timetable.filter((r) => r.day === day).map((row) => (
              <Hero key={row.id} kicker={`${row.start_time}–${row.end_time}`} title={row.subject} subtitle={row.teacher_name} />
            ))}
          </Card>
        )) : <EmptyState text="No timetable yet." />;
      }}
    </Frame>
  );
}

export function ParentNoticesScreen() {
  return (
    <Frame kicker="Notices" title="School notices">
      {(ctx) => ctx.notices.length ? ctx.notices.map((row) => (
        <Card key={row.id}><Hero kicker={row.category} title={row.title} subtitle={row.content} /></Card>
      )) : <EmptyState text="No notices right now." />}
    </Frame>
  );
}

export function ParentLibraryScreen() {
  return (
    <Frame kicker="Library" title="Issued books">
      {(ctx) => ctx.library.length ? ctx.library.map((row) => (
        <Card key={row.id}><Hero kicker={row.status} title={row.title} subtitle={`Due ${formatDate(row.due_date)}`} /><Badge status={row.status} label={row.status} /></Card>
      )) : <EmptyState text="No library books issued." />}
    </Frame>
  );
}
