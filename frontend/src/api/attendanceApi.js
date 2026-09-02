import api from "./axios";

// Get all attendance records (optional ?date=YYYY-MM-DD filter)
export const getAttendance = (params = {}) => api.get("attendance/", { params });

// Mark attendance for a SINGLE record
export const markAttendance = (data) => api.post("attendance/", data);

// Bulk save attendance for multiple students at once
export const bulkMarkAttendance = (records) =>
  api.post("attendance/bulk/", { records });

export const getTeacherAttendance = (params = {}) =>
  api.get("attendance/teachers/", { params });

export const bulkMarkTeacherAttendance = (records) =>
  api.post("attendance/teachers/bulk/", { records });
