import api from "../api/axios";

export const getPlatformStatus = async () => {
  const response = await api.get("platform/status/");
  return response.data || {};
};

export const loginUser = async (credentials) => {
  const response = await api.post("token/", credentials);
  return response.data; // { access, refresh }
};

export const googleLoginAuth = async (access_token, school_name = null) => {
  const response = await api.post("auth/google/", { access_token, school_name });
  return response.data; // { access, refresh, user }
};

export const signupUser = async (data) => {
  const response = await api.post("signup/", data);
  return response.data;
};

export const refreshToken = async (refresh) => {
  const response = await api.post("token/refresh/", { refresh });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get("me/");
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await api.patch("me/", data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.post("me/password/", data);
  return response.data;
};

export const setPresence = async (online) => {
  const response = await api.post("me/presence/", { online: Boolean(online) });
  return response.data;
};
