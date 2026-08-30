export const SUGGESTED_SUBJECTS = ["ELA", "Math", "Science", "History", "Geography", "Art", "Music", "Physical Education"];

export const subjectKey = (name) => String(name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();

export function normalizeSubjectNames(names = []) {
  const seen = new Set();
  return names.map((name) => String(name || "").trim().replace(/\s+/g, " "))
    .filter((name) => {
      const key = subjectKey(name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
