const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const rawBaseUrl = envBaseUrl || (import.meta.env.DEV ? "" : "http://localhost:6001");
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
const API_VERSION_PREFIX = "/api/v1";

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_VERSION_PREFIX}${normalizedPath}`;
};
