import React from "react";
import { createNotice, deleteNotice, getNotices, updateNotice } from "../api";
import { useAuth } from "../auth/AuthContext";
import { isSchoolAdmin } from "../utils";
import ResourceScreen from "./ResourceScreen";

export default function NoticesScreen() {
  const { role } = useAuth();
  const canManage = isSchoolAdmin(role) || role === "teacher";
  return (
    <ResourceScreen
      kicker="Communication"
      title="Notice board"
      subtitle="School and class notices."
      fetcher={getNotices}
      creator={canManage ? createNotice : null}
      updater={canManage ? updateNotice : null}
      deleter={canManage ? deleteNotice : null}
      canManage={canManage}
      searchKeys={["title", "content", "category"]}
      titleOf={(n) => n.title}
      metaOf={(n) => [n.category, n.audience, n.priority].filter(Boolean).join(" · ")}
      badgeOf={(n) => n.priority || n.status}
      defaults={{ title: "", content: "", category: "General", audience: "All", class_name: "", priority: "Normal", expires_at: "", is_active: true, is_pinned: false }}
      fields={[
        { key: "title", label: "Title" },
        { key: "content", label: "Content", type: "multiline" },
        { key: "category", label: "Category", type: "select", options: ["General", "Holiday", "Exam", "Fee", "Event", "Emergency"] },
        { key: "audience", label: "Audience", type: "select", options: ["All", "Students", "Teachers", "Parents", "Class"] },
        { key: "class_name", label: "Class (if audience is Class)" },
        { key: "priority", label: "Priority", type: "select", options: ["Normal", "Important", "Urgent"] },
        { key: "expires_at", label: "Expires (YYYY-MM-DD)" },
      ]}
    />
  );
}
