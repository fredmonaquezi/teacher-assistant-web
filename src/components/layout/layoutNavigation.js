export function getClassesNavigationPath(activeClassId) {
  return activeClassId ? `/classes/${activeClassId}` : "/classes";
}
