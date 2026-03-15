const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const resolveBaseUrl = () => {
  if (envBaseUrl) {
    if (
      !import.meta.env.DEV &&
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      envBaseUrl.startsWith("http://")
    ) {
      return envBaseUrl.replace(/^http:\/\//i, "https://");
    }
    return envBaseUrl;
  }

  if (import.meta.env.DEV) return "";

  if (typeof window !== "undefined" && window.location?.origin) {
    console.warn(
      "VITE_API_BASE_URL is not set. Falling back to window.location.origin."
    );
    return window.location.origin;
  }

  return "";
};

const API_BASE_URL = resolveBaseUrl().replace(/\/+$/, "");
const API_VERSION_PREFIX = "/api/v1";

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_VERSION_PREFIX}${normalizedPath}`;
};

export const getApiBaseUrl = () => API_BASE_URL;
