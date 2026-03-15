import { buildApiUrl, getApiBaseUrl } from "./api";

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

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
  if (!response.ok) {
    const textMessage = stripHtml(raw);
    throw new Error(
      payload?.message ||
        payload?.error ||
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
