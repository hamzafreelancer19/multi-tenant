import api from "./client";

export const loginUser = (credentials) => api.post("token/", credentials);
export const refreshToken = (refresh) => api.post("token/refresh/", { refresh });
export const getUserProfile = () => api.get("me/");
export const updateUserProfile = (data) => api.patch("me/", data);
export const changePassword = (data) => api.post("me/password/", data);
export const setPresence = (online) => api.post("me/presence/", { online: Boolean(online) });
export const getTenantInfo = (params = {}) => api.get("tenant-info/", { params });
export const getPlatformStatus = () => api.get("platform/status/");

export const getDashboardStats = () => api.get("dashboard/stats/");
export const getActivities = (params = {}) => api.get("dashboard/activities/", { params });
export const getNotifications = () => api.get("dashboard/notifications/");
export const markNotificationAsRead = (id) => api.post(`notifications/${id}/read/`);
export const markAllNotificationsAsRead = () => api.post("notifications/read-all/");

export const getStudents = (params = {}) => api.get("students/", { params });
export const createStudent = (data) => api.post("students/", data);
export const updateStudent = (id, data) => api.patch(`students/${id}/`, data);
export const deleteStudent = (id) => api.delete(`students/${id}/`);
export const getMyChild = () => api.get("students/my-child/");
export const setParentLogin = (id) => api.post(`students/${id}/set-parent-login/`);

export const getTeachers = (params = {}) => api.get("teachers/", { params });
export const createTeacher = (data) => api.post("teachers/", data);
export const updateTeacher = (id, data) => api.patch(`teachers/${id}/`, data);
export const deleteTeacher = (id) => api.delete(`teachers/${id}/`);
export const getMyTeacherProfile = () => api.get("teachers/me/");
export const setTeacherLogin = (id, data) => api.post(`teachers/${id}/set-login/`, data);

export const getClasses = () => api.get("classes/classes/");
export const createClass = (data) => api.post("classes/classes/", data);
export const updateClass = (id, data) => api.patch(`classes/classes/${id}/`, data);
export const deleteClass = (id) => api.delete(`classes/classes/${id}/`);

export const getAttendance = (params = {}) => api.get("attendance/", { params });
export const bulkMarkAttendance = (records) => api.post("attendance/bulk/", { records });
export const getTeacherAttendance = (params = {}) => api.get("attendance/teachers/", { params });
export const bulkMarkTeacherAttendance = (records) => api.post("attendance/teachers/bulk/", { records });

export const getFees = (params = {}) => api.get("fees/", { params });
export const createFee = (data) => api.post("fees/", data);
export const updateFee = (id, data) => api.patch(`fees/${id}/`, data);
export const deleteFee = (id) => api.delete(`fees/${id}/`);
export const getFeeStats = () => api.get("fees/stats/");

export const getExams = () => api.get("exams/exams/");
export const createExam = (data) => api.post("exams/exams/", data);
export const updateExam = (id, data) => api.patch(`exams/exams/${id}/`, data);
export const deleteExam = (id) => api.delete(`exams/exams/${id}/`);
export const getExamResults = (examId) => api.get(`exams/exams/${examId}/results/`);
export const saveExamResults = (examId, data) => api.post(`exams/exams/${examId}/results/`, data);

export const getNotices = () => api.get("notices/notices/");
export const createNotice = (data) => api.post("notices/notices/", data);
export const updateNotice = (id, data) => api.patch(`notices/notices/${id}/`, data);
export const deleteNotice = (id) => api.delete(`notices/notices/${id}/`);

export const getTimetables = (params = {}) => api.get("timetable/timetable/", { params });
export const createTimetable = (data) => api.post("timetable/timetable/", data);
export const updateTimetable = (id, data) => api.patch(`timetable/timetable/${id}/`, data);
export const deleteTimetable = (id) => api.delete(`timetable/timetable/${id}/`);
export const getCoverBoard = (params = {}) => api.get("timetable/timetable/cover-board/", { params });
export const getFreeTeachers = (id, params = {}) =>
  api.get(`timetable/timetable/${id}/free-teachers/`, { params });
export const assignPeriodCover = (id, data) => api.post(`timetable/timetable/${id}/cover/`, data);
export const clearPeriodCover = (id, params = {}) =>
  api.delete(`timetable/timetable/${id}/cover/`, { params });

export const getAssignments = (params = {}) => api.get("assignments/assignments/", { params });
export const createAssignment = (data) => api.post("assignments/assignments/", data);
export const updateAssignment = (id, data) => api.patch(`assignments/assignments/${id}/`, data);
export const deleteAssignment = (id) => api.delete(`assignments/assignments/${id}/`);

export const getEnrollments = () => api.get("enrollments/");
export const acceptEnrollment = (id) => api.post(`enrollments/${id}/accept/`);
export const rejectEnrollment = (id) => api.post(`enrollments/${id}/reject/`);
export const submitEnrollmentTest = (id, data) => api.post(`enrollments/${id}/submit-test/`, data);
export const deleteEnrollment = (id) => api.delete(`enrollments/${id}/`);

export const getStaff = (params = {}) => api.get("staff/staff/", { params });
export const createStaff = (data) => api.post("staff/staff/", data);
export const updateStaff = (id, data) => api.patch(`staff/staff/${id}/`, data);
export const deleteStaff = (id) => api.delete(`staff/staff/${id}/`);
export const getPayroll = (params = {}) => api.get("staff/payroll/", { params });
export const createPayroll = (data) => api.post("staff/payroll/", data);
export const deletePayroll = (id) => api.delete(`staff/payroll/${id}/`);

export const getBooks = (params = {}) => api.get("library/books/", { params });
export const createBook = (data) => api.post("library/books/", data);
export const updateBook = (id, data) => api.patch(`library/books/${id}/`, data);
export const deleteBook = (id) => api.delete(`library/books/${id}/`);
export const getIssues = (params = {}) => api.get("library/issue-returns/", { params });
export const createIssue = (data) => api.post("library/issue-returns/", data);
export const updateIssue = (id, data) => api.patch(`library/issue-returns/${id}/`, data);

export const getItems = () => api.get("inventory/items/");
export const createItem = (data) => api.post("inventory/items/", data);
export const updateItem = (id, data) => api.patch(`inventory/items/${id}/`, data);
export const deleteItem = (id) => api.delete(`inventory/items/${id}/`);
export const getLogs = (params) => api.get("inventory/stock-logs/", { params });
export const createLog = (data) => api.post("inventory/stock-logs/", data);

export const getVehicles = (params = {}) => api.get("transport/vehicles/", { params });
export const createVehicle = (data) => api.post("transport/vehicles/", data);
export const updateVehicle = (id, data) => api.patch(`transport/vehicles/${id}/`, data);
export const deleteVehicle = (id) => api.delete(`transport/vehicles/${id}/`);
export const getRoutes = (params = {}) => api.get("transport/routes/", { params });
export const getRiders = (params = {}) => api.get("transport/riders/", { params });

export const getChatContacts = () => api.get("chat/contacts/");
export const getChatThreads = () => api.get("chat/threads/");
export const startChat = (userId) => api.post("chat/threads/", { user_id: userId });
export const getChatMessages = (threadId, after) =>
  api.get(`chat/threads/${threadId}/messages/`, { params: after ? { after } : {} });
export const sendChatMessage = (threadId, payload) => {
  const data = typeof payload === "string" ? { body: payload } : payload;
  return api.post(`chat/threads/${threadId}/messages/`, data);
};

export const getSchools = (params = {}) => api.get("schools/", { params });
export const getSchool = (id) => api.get(`schools/${id}/`);
export const updateSchool = (id, data) => api.patch(`schools/${id}/`, data);
export const approveSchool = (id) => api.post(`schools/${id}/approve/`);
export const rejectSchool = (id) => api.post(`schools/${id}/reject/`);
export const approvePlan = (id) => api.post(`schools/${id}/approve_plan/`);
export const rejectPlan = (id) => api.post(`schools/${id}/reject_plan/`);
export const buyPlan = (id, data) => api.post(`schools/${id}/buy_plan/`, data);
export const getPlans = (params = {}) => api.get("plans/", { params });
export const getPlatformUsers = (params = {}) => api.get("platform-users/", { params });
export const getPlatformSettings = () => api.get("platform/settings/");
export const updatePlatformSettings = (data) => api.patch("platform/settings/", data);
