import { buildApiUrl } from "./api";
import { getValidAccessToken, refreshSession } from "./authSession";

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const getHeaders = async () => {
  const token = await getValidAccessToken().catch(() => "");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}`, "x-access-token": token } : {}),
  };
};

const request = async (path, options = {}) => {
  let headers = await getHeaders();
  let response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    try {
      const refreshed = await refreshSession();
      const retryToken = refreshed?.accessToken || "";
      headers = {
        "Content-Type": "application/json",
        ...(retryToken ? { Authorization: `Bearer ${retryToken}`, "x-access-token": retryToken } : {}),
      };
      response = await fetch(buildApiUrl(path), {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
      });
    } catch (_) {
      // fall through to error handling
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Order request failed");
  }
  return payload;
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
