function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof atob === "function") {
    return atob(padded);
  }

  if (typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(padded, "base64").toString("utf8");
  }

  throw new Error("Base64 decoding is not available in this runtime.");
}

function parseJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;

  try {
    const raw = decodeBase64Url(parts[1]);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isLikelyServiceRoleKey(key) {
  const value = String(key || "").trim();
  if (!value) return false;

  const lower = value.toLowerCase();
  if (lower.startsWith("sb_secret_")) return true;
  if (lower.includes("service_role")) return true;

  const payload = parseJwtPayload(value);
  return payload?.role === "service_role";
}

function readEnv(name) {
  return String(import.meta.env[name] || "").trim();
}

function readBooleanEnv(name, defaultValue = false) {
  const raw = readEnv(name);
  if (!raw) return defaultValue;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function loadSupabaseClientEnv() {
  const supabaseUrl = readEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY");

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL. Add it to your environment.");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_ANON_KEY. Add it to your environment.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error("VITE_SUPABASE_URL is invalid. Expected a full URL.");
  }

  const isLocalHost =
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1" ||
    parsedUrl.hostname === "0.0.0.0";
  if (parsedUrl.protocol !== "https:" && !isLocalHost) {
    throw new Error("VITE_SUPABASE_URL must use HTTPS for non-local environments.");
  }

  if (isLikelyServiceRoleKey(supabaseAnonKey)) {
    throw new Error(
      "VITE_SUPABASE_ANON_KEY appears to be a service-role/secret key. Use the public anon/publishable key in frontend code."
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function loadAuthEnv() {
  const enableGoogleAuth = readBooleanEnv("VITE_ENABLE_GOOGLE_AUTH", false);
  const googleClientId = readEnv("VITE_GOOGLE_CLIENT_ID");

  return {
    enableGoogleAuth,
    googleClientId,
  };
}
