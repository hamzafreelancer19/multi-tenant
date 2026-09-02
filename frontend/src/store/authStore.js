export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  const token = localStorage.getItem("token");
  if (token) return token;
  
  // Fallback to URL params for domain handoff
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-user-updated"));
};

export const getUser = () => {
  if (isDemoMode()) {
    return { 
      username: "Demo Admin",
      first_name: "Demo",
      last_name: "Admin",
      email: "demo@edusaas.com", 
      phone: "",
      role: "admin", 
      school_name: "Demo International School",
      plan_status: "Active",
      has_usable_password: true,
    };
  }
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getDisplayName = () => {
  const user = getUser();
  if (!user) return "User";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.username || "User";
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

export const logout = async () => {
  const token = localStorage.getItem("token");
  if (token && localStorage.getItem("isDemo") !== "true") {
    const hostname = window.location.hostname.toLowerCase();
    const isPlatformHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app");
    const storedDomain = localStorage.getItem("schoolDomain");
    try {
      await fetch("/api/me/presence/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Tenant-Domain": isPlatformHost ? (storedDomain || hostname) : hostname,
        },
        body: JSON.stringify({ online: false }),
        keepalive: true,
      });
    } catch {
      /* still clear the local session */
    }
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isDemo");
};

export const isAuthenticated = () => {
  if (isDemoMode()) return true;
  if (localStorage.getItem("token")) return true;
  
  // Check URL during handoff
  const urlParams = new URLSearchParams(window.location.search);
  return !!urlParams.get('token');
};
