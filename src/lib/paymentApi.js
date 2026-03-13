import { buildApiUrl } from "./api";
import { getValidAccessToken, refreshSession } from "./authSession";

const getHeaders = async (isRetry = false) => {
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
    throw new Error(payload?.message || "Payment request failed");
  }
  return payload;
};

export const initializePayment = async (orderId, callbackPath = "/checkout/verify") => {
  const callbackUrl = `${window.location.origin}${callbackPath}`;
  return request("/payment/initialize", {
    method: "POST",
    body: JSON.stringify({ orderId, callbackUrl }),
  });
};

export const verifyPayment = async (reference) => {
  return request(`/payment/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
};
