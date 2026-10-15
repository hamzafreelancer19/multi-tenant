import React from "react";
import { createClass, deleteClass, getClasses, updateClass } from "../api";
import ResourceScreen from "./ResourceScreen";
import { classLabel } from "../utils";

const GRADES = ["Nursery", "KG-I", "KG-II", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "First Year", "Second Year"];

export default function ClassesScreen() {
  return (
    <ResourceScreen
      kicker="Academics"
      title="Classes"
      subtitle="Sections, rooms, and capacity."
      fetcher={getClasses}
      creator={createClass}
      updater={updateClass}
      deleter={deleteClass}
      searchKeys={["name", "section", "room_no"]}
      titleOf={classLabel}
      metaOf={(c) => [c.shift, c.academic_year, c.room_no && `Room ${c.room_no}`].filter(Boolean).join(" · ")}
      defaults={{ name: "Class 1", section: "", room_no: "", capacity: "40", shift: "Morning", academic_year: "", status: "Active", notes: "" }}
      toPayload={(f) => ({ ...f, capacity: Number(f.capacity) || 40, class_teacher: f.class_teacher ? Number(f.class_teacher) : null })}
      fields={[
        { key: "name", label: "Grade", type: "select", options: GRADES },
        { key: "section", label: "Section" },
        { key: "room_no", label: "Room" },
        { key: "capacity", label: "Capacity", type: "number" },
        { key: "shift", label: "Shift", type: "select", options: ["Morning", "Afternoon", "Evening"] },
        { key: "academic_year", label: "Academic year" },
        { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        { key: "notes", label: "Notes", type: "multiline" },
      ]}
    />
  );
}
