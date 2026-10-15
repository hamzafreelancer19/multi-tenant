import React from "react";
import { createTimetable, deleteTimetable, getTimetables, updateTimetable } from "../api";
import { useAuth } from "../auth/AuthContext";
import { isSchoolAdmin } from "../utils";
import ResourceScreen from "./ResourceScreen";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SUBJECTS = ["Mathematics", "English", "Urdu", "Physics", "Chemistry", "Biology", "Computer Science", "Islamiat", "Pakistan Studies", "Break", "Assembly", "Sports"];

export default function TimetableScreen() {
  const { role } = useAuth();
  const canManage = isSchoolAdmin(role) || role === "teacher";
  return (
    <ResourceScreen
      kicker="Schedule"
      title="Timetable"
      subtitle="Periods for each class and day."
      fetcher={getTimetables}
      creator={canManage ? createTimetable : null}
      updater={canManage ? updateTimetable : null}
      deleter={canManage ? deleteTimetable : null}
      canManage={canManage}
      searchKeys={["class_name", "subject", "day", "teacher_name"]}
      titleOf={(r) => `${r.subject} · ${r.class_name}`}
      metaOf={(r) => `${r.day} ${String(r.start_time || "").slice(0, 5)}–${String(r.end_time || "").slice(0, 5)}`}
      defaults={{ class_name: "", subject: "Mathematics", teacher: "", day: "Monday", start_time: "08:00", end_time: "08:45", room_no: "", period_type: "Lecture", notes: "" }}
      toPayload={(f) => ({ ...f, teacher: f.teacher ? Number(f.teacher) : null })}
      fields={[
        { key: "class_name", label: "Class" },
        { key: "subject", label: "Subject", type: "select", options: SUBJECTS },
        { key: "teacher", label: "Teacher ID (optional)" },
        { key: "day", label: "Day", type: "select", options: DAYS },
        { key: "start_time", label: "Start (HH:MM)" },
        { key: "end_time", label: "End (HH:MM)" },
        { key: "room_no", label: "Room" },
        { key: "period_type", label: "Type", type: "select", options: ["Lecture", "Lab", "Break", "Assembly", "Sports"] },
        { key: "notes", label: "Notes" },
      ]}
    />
  );
}
