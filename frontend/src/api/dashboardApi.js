import api from "./axios";

// Default dashboard summary
export const getDashboardStats = () => api.get("dashboard/stats/");
export const getActivities = (params = {}) => api.get("dashboard/activities/", { params });
export const getNotifications = () => api.get("dashboard/notifications/");
export const markNotificationAsRead = (id) => api.post(`notifications/${id}/read/`);
export const markAllNotificationsAsRead = () => api.post(`notifications/read-all/`);
export const getSystemData = (model, params = {}) =>
  api.get("system/explorer/", { params: { model, ...params } });
export const getSystemSummary = () => api.get("system/explorer/", { params: { summary: 1 } });
