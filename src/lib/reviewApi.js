import { buildApiUrl } from "./api";
import { getValidAccessToken } from "./authSession";

const getHeaders = async () => {
  const token = await getValidAccessToken().catch(() => "");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (path, options = {}) => {
  const headers = await getHeaders();
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Review request failed");
  }
  return payload;
};

export const createReview = async (payload) => {
  return request("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
