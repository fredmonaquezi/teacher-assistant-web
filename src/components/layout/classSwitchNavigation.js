export function getClassSwitchDestination(pathname, nextClassId) {
  if (!nextClassId) return null;

  if (/^\/classes\/[^/]+\/assess-activity(?:\/[^/]+)?$/.test(pathname)) {
    return `/classes/${nextClassId}/assess-activity`;
  }
  if (/^\/classes\/[^/]+$/.test(pathname)) {
    return `/classes/${nextClassId}`;
  }
  if (/^\/attendance\/[^/]+$/.test(pathname)) {
    return "/attendance";
  }
  if (/^\/students\/[^/]+$/.test(pathname)) {
    return `/classes/${nextClassId}`;
  }

  return null;
}
