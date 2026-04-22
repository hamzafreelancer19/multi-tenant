export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = () => {
  if (isDemoMode()) {
    return { 
      username: "Demo Admin", 
      email: "demo@edusaas.com", 
      role: "admin", 
      school_name: "Demo International School",
      plan_status: "Active"
    };
  }
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getRole = () => {
  const user = getUser();
  return user?.role;
};

export const setRefreshToken = (token) => {
  localStorage.setItem("refreshToken", token);
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const setDemoMode = (val) => {
  if (val) localStorage.setItem("isDemo", "true");
  else localStorage.removeItem("isDemo");
};

export const isDemoMode = () => {
  return localStorage.getItem("isDemo") === "true";
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isDemo");
};

export const isAuthenticated = () => {
  return isDemoMode() || !!localStorage.getItem("token");
};
