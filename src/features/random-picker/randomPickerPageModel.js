export const DEFAULT_CATEGORIES = ["Helper", "Guardian", "Line Leader", "Messenger"];

const CATEGORY_ICONS = {
  Helper: "⭐",
  Guardian: "🛡️",
  "Line Leader": "🚶",
  Messenger: "✉️",
};

const CATEGORY_COLORS = {
  Helper: "#0077b6",
  Guardian: "#03045e",
  "Line Leader": "#00b4d8",
  Messenger: "#168aad",
  Custom: "#0096c7",
};

export const getCategoryIcon = (category) => CATEGORY_ICONS[category] || "🏳️";
export const getCategoryColor = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.Custom;
export const sameScope = (firstClassId, secondClassId) =>
  (firstClassId || null) === (secondClassId || null);

export function normalizeUsedStudentIds(usedStudentIds) {
  if (!Array.isArray(usedStudentIds)) return [];
  return Array.from(new Set(usedStudentIds.map((item) => String(item || "").trim()).filter(Boolean)));
}
