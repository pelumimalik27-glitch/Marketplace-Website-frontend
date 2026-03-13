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
    throw new Error(payload?.message || "Admin request failed");
  }
  return payload;
};

export const fetchAdminAnalytics = async () => {
  return request("/admin/platform-analytics");
};

export const fetchPendingSellers = async () => {
  return request("/admin/pending-sellers");
};

export const approvePendingSeller = async (sellerId, verificationNotes = "") => {
  return request(`/admin/pending-sellers/${sellerId}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ verificationNotes }),
  });
};

export const rejectPendingSeller = async (sellerId, verificationNotes = "") => {
  return request(`/admin/pending-sellers/${sellerId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ verificationNotes }),
  });
};

export const fetchDisputes = async () => {
  return request("/admin/disputes");
};
