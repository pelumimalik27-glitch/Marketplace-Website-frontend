const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const envDevBaseUrl = String(import.meta.env.VITE_DEV_API_BASE_URL || "").trim();
const envFallbackBaseUrls = String(import.meta.env.VITE_API_FALLBACK_BASE_URLS || "").trim();
const isDev = Boolean(import.meta.env.DEV);
const API_VERSION_PREFIX = "/api/v1";

const normalizeBaseUrl = (value) => {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";

  let candidate = raw;
  if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(candidate)) {
    if (candidate.startsWith("//")) {
      candidate = `https:${candidate}`;
    } else if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(candidate)) {
      candidate = `http://${candidate}`;
    } else {
      candidate = `https://${candidate}`;
    }
  }

  try {
    const url = new URL(candidate);
    const safePath = url.pathname.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
    return `${url.origin}${safePath}`.replace(/\/+$/, "");
  } catch (_) {
    return "";
  }
};

const normalizedEnvBaseUrl = normalizeBaseUrl(envBaseUrl);
const normalizedEnvDevBaseUrl = normalizeBaseUrl(envDevBaseUrl);
const normalizedFallbackBaseUrls = Array.from(
  new Set(
    envFallbackBaseUrls
      .split(",")
      .map((entry) => normalizeBaseUrl(entry))
      .filter(Boolean)
  )
);

const resolveBaseUrl = () => {
  if (isDev) {
    return normalizedEnvDevBaseUrl || normalizedEnvBaseUrl || "http://localhost:6001";
  }

  if (normalizedEnvBaseUrl) {
    if (
      !isDev &&
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      normalizedEnvBaseUrl.startsWith("http://")
    ) {
      return normalizedEnvBaseUrl.replace(/^http:\/\//i, "https://");
    }
    return normalizedEnvBaseUrl;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    console.warn(
      "VITE_API_BASE_URL is not set. Falling back to window.location.origin."
    );
    return window.location.origin;
  }

  return "";
};

const API_BASE_URL = resolveBaseUrl().replace(/\/+$/, "");

export const getApiBaseUrlCandidates = () => {
  const primary = API_BASE_URL;
  const browserOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin.replace(/\/+$/, "")
      : "";
  const ordered = [primary, ...normalizedFallbackBaseUrls, browserOrigin].filter(Boolean);
  return Array.from(new Set(ordered));
};

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_VERSION_PREFIX}${normalizedPath}`;
};

export const buildApiUrlCandidates = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return getApiBaseUrlCandidates().map(
    (baseUrl) => `${baseUrl}${API_VERSION_PREFIX}${normalizedPath}`
  );
};

export const getApiBaseUrl = () => API_BASE_URL;
export const hasExplicitApiBaseUrl = () =>
  Boolean(isDev ? normalizedEnvDevBaseUrl || normalizedEnvBaseUrl : normalizedEnvBaseUrl);
