export function unwrapList(data) {
  return asList(data);
}

export function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function apiError(err, fallback = "Request failed") {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === "string") return data;
  const pick = (v) => (Array.isArray(v) ? v[0] : v);
  if (data.error) return String(pick(data.error));
  if (data.detail) return String(pick(data.detail));
  if (data.non_field_errors) return String(pick(data.non_field_errors));
  const first = Object.values(data).flat()?.[0];
  return first ? String(first) : fallback;
}

export function money(n) {
  return `Rs ${Number(n || 0).toLocaleString()}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const raw = String(value);
  const d = new Date(raw.length <= 10 ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export function displayName(user) {
  if (!user) return "User";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.username || "User";
}

export function roleLabel(role) {
  if (!role) return "User";
  if (role === "superadmin") return "Super Admin";
  if (role === "schooladmin") return "School Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function isSchoolAdmin(role) {
  return role === "admin" || role === "schooladmin";
}

export function classLabel(c) {
  if (!c) return "";
  if (c.label) return c.label;
  return c.section ? `${c.name} - ${c.section}` : c.name;
}

export function unique(list) {
  return [...new Set((list || []).map((v) => (v || "").trim()).filter(Boolean))];
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function badgeTone(status) {
  const value = String(status || "").toLowerCase();
  if (["present", "paid", "returned", "active", "accepted", "approved"].includes(value)) return "on";
  if (["late", "partial", "leave", "pending", "pendingadmin", "pendingincharge"].includes(value)) return "warn";
  return "off";
}
