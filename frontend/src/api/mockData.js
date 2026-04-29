/**
 * MOCK DATA ENGINE
 * Handles frontend-only data simulation for Demo Mode.
 * Data is stored in localStorage for persistence within the session.
 */

const INITIAL_STATS = {
  students: 124,
  teachers: 15,
  attendance: 94,
  fees_collected: 850,
  is_superadmin: false,
};

const INITIAL_ACTIVITIES = [
  { id: 1, name: "Sikandar G.", action: "Marked attendance for Class 10", avatar: "S", created_at: new Date().toISOString() },
  { id: 2, name: "Amna Khan", action: "Paid monthly fee", avatar: "A", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, name: "John Doe", action: "Added to Grade 8", avatar: "J", created_at: new Date(Date.now() - 7200000).toISOString() },
];

const INITIAL_STUDENTS = [
  { id: 101, name: "Ayaan Ahmed", roll_no: "1001", class_name: "Grade 10", status: "Active" },
  { id: 102, name: "Zoya Malik", roll_no: "1002", class_name: "Grade 10", status: "Active" },
  { id: 103, name: "Omar Farooq", roll_no: "1003", class_name: "Grade 9", status: "Inactive" },
  { id: 104, name: "Sara Ali", roll_no: "1004", class_name: "Grade 8", status: "Active" },
];

/** 
 * Data initialization in localStorage 
 */
const initDemoStorage = () => {
  if (!localStorage.getItem("demo_students")) {
    localStorage.setItem("demo_students", JSON.stringify(INITIAL_STUDENTS));
  }
  if (!localStorage.getItem("demo_activities")) {
    localStorage.setItem("demo_activities", JSON.stringify(INITIAL_ACTIVITIES));
  }
};

/**
 * Mock Request Handler
 */
export const handleMockRequest = async (config) => {
  initDemoStorage();
  const { url, method, data } = config;

  // Wait 500ms to simulate network latency
  await new Promise(r => setTimeout(r, 500));

  // --- DASHBOARD ---
  if (url.includes("/stats/")) {
    return { data: INITIAL_STATS };
  }
  if (url.includes("/activities/")) {
    const acts = JSON.parse(localStorage.getItem("demo_activities"));
    return { data: acts };
  }

  // --- STUDENTS ---
  if (url.includes("/students/")) {
    if (method === "get") {
      const studs = JSON.parse(localStorage.getItem("demo_students"));
      return { data: Array.isArray(studs) ? studs : [] };
    }
    if (method === "post") {
      const newStudent = { ...JSON.parse(data), id: Date.now() };
      const current = JSON.parse(localStorage.getItem("demo_students"));
      localStorage.setItem("demo_students", JSON.stringify([newStudent, ...current]));
      
      // Also add to activity
      const currentActs = JSON.parse(localStorage.getItem("demo_activities"));
      localStorage.setItem("demo_activities", JSON.stringify([
        { id: Date.now(), name: "Demo Admin", action: `Added student ${newStudent.name}`, created_at: new Date().toISOString() },
        ...currentActs.slice(0, 9)
      ]));

      return { data: newStudent };
    }
  }

  // --- FEES ---
  if (url.endsWith("/fees/stats/")) {
    return { data: { collected: 45000, pending: 12000, overdue_count: 3 } };
  }
  if (url.endsWith("/fees/")) {
    if (method === "get") {
      return { data: [
        { id: 1, student_name: "Ayaan Ahmed", amount: 5000, status: "Paid", date: "2026-04-10" },
        { id: 2, student_name: "Zoya Malik", amount: 5000, status: "Pending", date: "2026-04-15" },
      ] };
    }
    return { data: { message: "Success" } };
  }

  // --- TEACHERS ---
  if (url.includes("/teachers/")) {
    return { data: [
      { id: 1, name: "Dr. Sarah", subject: "Science", status: "Active" },
      { id: 2, name: "Mr. Khan", subject: "Math", status: "Active" }
    ] };
  }

  // --- ATTENDANCE ---
  if (url.includes("/attendance/")) {
    return { data: [
      { id: 1, student_name: "Ayaan Ahmed", date: new Date().toISOString().split('T')[0], status: "Present" },
      { id: 2, student_name: "Zoya Malik", date: new Date().toISOString().split('T')[0], status: "Absent" }
    ] };
  }

  // Fallback for unhandled mock routes
  if (method === "get" && !url.includes("stats") && !url.includes("activities")) {
    return { data: [] };
  }

  return { data: { collected: 0, pending: 0, overdue_count: 0 } };
}
