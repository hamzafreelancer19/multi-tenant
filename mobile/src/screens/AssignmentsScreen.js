import React from "react";
import { createAssignment, deleteAssignment, getAssignments, updateAssignment } from "../api";
import { useAuth } from "../auth/AuthContext";
import { isSchoolAdmin, todayISO } from "../utils";
import ResourceScreen from "./ResourceScreen";

export default function AssignmentsScreen() {
  const { role } = useAuth();
  const canManage = isSchoolAdmin(role) || role === "teacher";
  return (
    <ResourceScreen
      kicker="Homework"
      title="Assignments"
      subtitle="Class work, due dates, and types."
      fetcher={getAssignments}
      creator={canManage ? createAssignment : null}
      updater={canManage ? updateAssignment : null}
      deleter={canManage ? deleteAssignment : null}
      canManage={canManage}
      searchKeys={["title", "subject", "class_name", "teacher_name"]}
      titleOf={(r) => r.title}
      metaOf={(r) => [r.class_name, r.subject, r.due_date].filter(Boolean).join(" · ")}
      defaults={{ title: "", description: "", class_name: "", subject: "Mathematics", assignment_type: "Homework", status: "Assigned", due_date: todayISO(), due_time: "", max_marks: "100", notes: "" }}
      toPayload={(f) => ({ ...f, teacher: f.teacher ? Number(f.teacher) : undefined, max_marks: Number(f.max_marks) || 100 })}
      fields={[
        { key: "title", label: "Title" },
        { key: "description", label: "Description", type: "multiline" },
        { key: "class_name", label: "Class" },
        { key: "subject", label: "Subject" },
        { key: "assignment_type", label: "Type", type: "select", options: ["Homework", "Project", "Worksheet", "Quiz", "Practical", "Reading"] },
        { key: "status", label: "Status", type: "select", options: ["Assigned", "Draft", "Closed"] },
        { key: "due_date", label: "Due date" },
        { key: "due_time", label: "Due time" },
        { key: "max_marks", label: "Max marks", type: "number" },
        { key: "notes", label: "Notes", type: "multiline" },
      ]}
    />
  );
}
