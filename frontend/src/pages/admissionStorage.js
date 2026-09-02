const PREFIX = "classora_admissions_";

export function admissionStorageKey(schoolId, schoolSlug) {
  return `${PREFIX}${schoolSlug || schoolId || "local"}`;
}

export function listAdmissions(schoolId, schoolSlug) {
  try {
    const raw = localStorage.getItem(admissionStorageKey(schoolId, schoolSlug));
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function saveAdmission(schoolId, schoolSlug, record) {
  const rows = listAdmissions(schoolId, schoolSlug);
  const next = [record, ...rows.filter((row) => String(row.id) !== String(record.id))].slice(0, 10);
  localStorage.setItem(admissionStorageKey(schoolId, schoolSlug), JSON.stringify(next));
  return next;
}

export function getAdmission(schoolId, schoolSlug, id) {
  return listAdmissions(schoolId, schoolSlug).find((row) => String(row.id) === String(id)) || null;
}

export function removeAdmission(schoolId, schoolSlug, id) {
  const next = listAdmissions(schoolId, schoolSlug).filter((row) => String(row.id) !== String(id));
  localStorage.setItem(admissionStorageKey(schoolId, schoolSlug), JSON.stringify(next));
  return next;
}
