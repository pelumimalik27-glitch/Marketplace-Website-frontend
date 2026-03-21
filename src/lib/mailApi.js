import { buildApiUrlCandidates, getApiBaseUrl, hasExplicitApiBaseUrl } from "./api";

const MAIL_API_VERSION_PREFIX = "/api/v1";
const DEFAULT_MAIL_SERVICE_BASE_URL = "https://marketplace-website-backend-e6q0.onrender.com";
const envMailFallbackBaseUrls = String(import.meta.env.VITE_MAIL_API_FALLBACK_BASE_URLS || "").trim();

const normalizeAbsoluteBaseUrl = (value = "") => {
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

const normalizeAbsoluteBaseUrlList = (value = "") =>
  Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((entry) => normalizeAbsoluteBaseUrl(entry))
        .filter(Boolean)
    )
  );

const buildMailRequestUrlCandidates = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // In dev, keep OTP requests same-origin so Vite can proxy /api/v1/mail reliably.
  if (import.meta.env.DEV) {
    return [`${MAIL_API_VERSION_PREFIX}${normalizedPath}`];
  }

  const apiCandidates = buildApiUrlCandidates(path);
  const explicitMailBase = normalizeAbsoluteBaseUrl(
    import.meta.env.VITE_MAIL_API_BASE_URL || DEFAULT_MAIL_SERVICE_BASE_URL
  );
  const fallbackMailBases = normalizeAbsoluteBaseUrlList(envMailFallbackBaseUrls);

  const directMailCandidates = [
    explicitMailBase,
    ...fallbackMailBases,
  ]
    .filter(Boolean)
    .map((baseUrl) => `${baseUrl}${MAIL_API_VERSION_PREFIX}${normalizedPath}`);

  // Prefer direct mail-service hosts first in production, then API gateway candidates.
  return Array.from(new Set([...directMailCandidates, ...apiCandidates]));
};

const getMailBaseLabel = () => {
  if (import.meta.env.DEV) return "dev-proxy:/api/v1/mail";

  const candidates = buildMailRequestUrlCandidates("/mail/send-otp");
  if (candidates.length) {
    return candidates
      .map((url) => {
        try {
          return new URL(url).origin;
        } catch (_) {
          return url;
        }
      })
      .join(", ");
  }

  return getApiBaseUrl() || "unknown";
};

const stripHtml = (value = "") =>
  String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const looksLikeHtml = (response, raw = "") => {
  const contentType = response.headers.get("content-type") || "";
  return (
    contentType.includes("text/html") ||
    /<(?:!doctype|html|head|body|style|script)\b/i.test(raw)
  );
};

const buildHtmlErrorMessage = (response, raw) => {
  const statusLabel = `HTTP ${response.status}`;
  const baseUrl = getApiBaseUrl() || "unknown";
  const windowOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin.replace(/\/+$/, "")
      : "";
  const sameOriginFallback =
    !hasExplicitApiBaseUrl() && windowOrigin && baseUrl === windowOrigin;

  if (sameOriginFallback) {
    return `OTP service is misconfigured. Requests are hitting the frontend origin instead of the backend. Set VITE_API_BASE_URL. (${statusLabel})`;
  }

  if (/render/i.test(raw) || /bad gateway/i.test(raw)) {
    return `OTP service is currently unavailable on Render. Try again in a few minutes. (${statusLabel})`;
  }

  return `OTP service returned an HTML error page instead of JSON. Check VITE_API_BASE_URL and backend health. (${statusLabel})`;
};

const request = async (path, options = {}) => {
  let response;
  let raw = "";
  let lastError = null;
  const requestUrls = buildMailRequestUrlCandidates(path);
  const retryableErrorPattern =
    /error occurred while trying to proxy|mail service unavailable|bad gateway|gateway timeout|upstream/i;

  try {
    for (let index = 0; index < requestUrls.length; index += 1) {
      const requestUrl = requestUrls[index];
      const hasMoreCandidates = index < requestUrls.length - 1;

      try {
        const currentResponse = await fetch(requestUrl, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
          },
        });

        const currentRaw = await currentResponse.text();
        const isRetryableStatus = currentResponse.status >= 500;
        const isRetryableBody = retryableErrorPattern.test(currentRaw);

        if (hasMoreCandidates && !currentResponse.ok && (isRetryableStatus || isRetryableBody)) {
          continue;
        }

        response = currentResponse;
        raw = currentRaw;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to fetch");
    }
  } catch (error) {
    const baseUrl = getMailBaseLabel();
    throw new Error(
      `Could not reach OTP server. Check mail API URL/proxy and CORS. Base URL: ${baseUrl}`
    );
  }

  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      payload = {};
    }
  }
  const htmlResponse = looksLikeHtml(response, raw);
  if (response.ok && htmlResponse) {
    throw new Error(buildHtmlErrorMessage(response, raw));
  }
  if (!response.ok) {
    const textMessage = htmlResponse ? "" : stripHtml(raw);
    throw new Error(
      payload?.message ||
        payload?.error ||
        (htmlResponse ? buildHtmlErrorMessage(response, raw) : "") ||
        textMessage ||
        `Mail request failed (HTTP ${response.status})`
    );
  }
  return payload;
};

export const sendOtp = async (email) => {
  return request("/mail/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const verifyOtp = async (email, otp) => {
  return request("/mail/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
};
