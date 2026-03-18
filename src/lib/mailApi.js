import { buildApiUrl, getApiBaseUrl, hasExplicitApiBaseUrl } from "./api";

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
  try {
    response = await fetch(buildApiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    const baseUrl = getApiBaseUrl() || "unknown";
    throw new Error(
      `Could not reach server. Check VITE_API_BASE_URL and CORS. Base URL: ${baseUrl}`
    );
  }

  const raw = await response.text();
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
