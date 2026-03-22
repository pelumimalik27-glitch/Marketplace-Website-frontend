import { buildApiUrlCandidates } from "./api";
import { getValidAccessToken, refreshSession } from "./authSession";

const REQUEST_TIMEOUT_MS = 8000;
const RETRYABLE_BODY_PATTERN =
  /error occurred while trying to proxy|mail service unavailable|bad gateway|gateway timeout|upstream|route not found|cannot (get|post|patch|delete)/i;

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const buildHeaders = (token = "") => {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}`, "x-access-token": token } : {}),
  };
};

const isRetryableHttpStatus = (status = 0) =>
  Number(status) >= 500 || Number(status) === 404 || Number(status) === 405;

const isRetryableNetworkError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.name === "AbortError" ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("timeout")
  );
};

const fetchWithTimeout = async (endpoint, options = {}, headers = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(endpoint, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const readPayload = async (response) => {
  const raw = await response.text();
  if (!raw) return { raw, payload: {} };
  try {
    return { raw, payload: JSON.parse(raw) };
  } catch (_) {
    return { raw, payload: {} };
  }
};

const request = async (path, options = {}) => {
  const endpoints = buildApiUrlCandidates(path);
  let lastError = null;

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];
    const hasMore = index < endpoints.length - 1;
    let token = await getValidAccessToken().catch(() => "");

    try {
      let response = await fetchWithTimeout(endpoint, options, buildHeaders(token));

      if (response.status === 401) {
        try {
          const refreshed = await refreshSession();
          token = refreshed?.accessToken || "";
          response = await fetchWithTimeout(endpoint, options, buildHeaders(token));
        } catch (_) {
          // fall through to response error handling
        }
      }

      const { raw, payload } = await readPayload(response);
      if (!response.ok) {
        const message = payload?.message || payload?.error || "Order request failed";
        const details = `${message} ${raw || ""}`;
        if (
          hasMore &&
          (isRetryableHttpStatus(response.status) || RETRYABLE_BODY_PATTERN.test(details))
        ) {
          continue;
        }
        throw new Error(message);
      }

      return payload;
    } catch (error) {
      lastError =
        error?.name === "AbortError" ? new Error("Order request timed out") : error;
      if (hasMore && isRetryableNetworkError(error)) {
        continue;
      }
      if (!hasMore) break;
    }
  }

  throw lastError || new Error("Order request failed");
};

export const createOrder = async (payload) => {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const fetchMyOrders = async (userId = "") => {
  if (!userId) return [];
  const payload = await request(`/orders/buyer/${encodeURIComponent(String(userId))}`);
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const fetchOrderById = async (orderId = "") => {
  const safeId = asId(orderId);
  if (!safeId) {
    throw new Error("Order id is required");
  }
  const payload = await request(`/orders/${encodeURIComponent(safeId)}`);
  return payload?.data || null;
};

export const trackOrderByCode = async (orderCode = "") => {
  const code = String(orderCode || "").trim();
  if (!code) {
    throw new Error("Order id is required");
  }
  const payload = await request(`/orders/track/${encodeURIComponent(code)}`);
  return payload?.data || null;
};
