import api from "./axios";

export const getChatContacts = () => api.get("chat/contacts/");
export const getChatThreads = () => api.get("chat/threads/");
export const startChat = (userId) => api.post("chat/threads/", { user_id: userId });
export const getChatMessages = (threadId, after) =>
  api.get(`chat/threads/${threadId}/messages/`, { params: after ? { after } : {} });
export const sendChatMessage = (threadId, payload) => {
  const data = typeof payload === "string" ? { body: payload } : payload;
  return api.post(`chat/threads/${threadId}/messages/`, data);
};
export const uploadChatFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("chat/upload/", formData);
};
