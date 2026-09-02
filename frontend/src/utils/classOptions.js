import { getRole } from "../store/authStore";

export function isTeacherRole() {
  return getRole() === "teacher";
}

export function mergeClassOptions(groups, fallback = []) {
  const merged = [...new Set(groups.flat().map((v) => (v || "").trim()).filter(Boolean))];
  if (isTeacherRole()) return merged;
  return merged.length ? merged : fallback;
}
