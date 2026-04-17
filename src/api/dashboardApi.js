import api from "./axios";

// Default dashboard summary
export const getDashboardStats = () => api.get("dashboard/stats/");
export const getActivities = () => api.get("dashboard/activities/");
export const getNotifications = () => api.get("dashboard/notifications/");
export const markNotificationAsRead = (id) => api.post(`notifications/${id}/read/`);
export const markAllNotificationsAsRead = () => api.post(`notifications/read-all/`);
export const getSystemData = (model) => api.get(`system/explorer/?model=${model}`);
