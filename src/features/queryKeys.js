export const featureQueryKeys = {
  classroom: (userId) => ["classroom", userId || "anonymous"],
  subjects: (userId) => ["subjects", userId || "anonymous"],
  attendance: (userId) => ["attendance", userId || "anonymous"],
  groups: (userId) => ["groups", userId || "anonymous"],
  usefulLinks: (userId) => ["useful-links", userId || "anonymous"],
  randomPicker: (userId) => ["random-picker", userId || "anonymous"],
};

export function getFeatureDomainsForPath(pathname) {
  const path = typeof pathname === "string" && pathname ? pathname : "/";
  return {
    classroom: true,
    subjects:
      path.startsWith("/classes/") ||
      path.startsWith("/students/") ||
      path.startsWith("/groups"),
    attendance: path.startsWith("/attendance") || path.startsWith("/students/"),
    groups: path.startsWith("/groups"),
    usefulLinks: path.startsWith("/useful-links"),
    randomPicker: path.startsWith("/random"),
  };
}
