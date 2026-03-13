import { buildApiUrl } from "./api";

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const request = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

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
