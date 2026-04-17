import api from "../api/axios";

export const loginUser = async (credentials) => {
  const response = await api.post("token/", credentials);
  return response.data; // { access, refresh }
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
