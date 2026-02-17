export function formatDisplayName(user) {
  const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const emailLocalPart = String(user?.email || "").split("@")[0] || "";
  const source = (metadataName || emailLocalPart || "Teacher").replace(/[._-]+/g, " ").trim();
  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
