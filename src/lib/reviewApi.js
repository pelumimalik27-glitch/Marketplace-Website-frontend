import { buildApiUrl } from "./api";
import { getValidAccessToken } from "./authSession";

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const normalizeReview = (item = {}) => ({
  ...item,
  id: asId(item?.id || item?._id),
  _id: asId(item?._id || item?.id),
  product: asId(item?.product),
  userName: String(item?.user?.name || item?.userName || "Anonymous"),
  rating: Number(item?.rating || 0),
  comment: String(item?.comment || "").trim(),
  createdAt: item?.createdAt || "",
  isVerifiedPurchase: Boolean(item?.isVerifiedPurchase),
});

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

export const fetchProductReviews = async (productId) => {
  const safeId = asId(productId);
  if (!safeId) return [];
  const payload = await request(`/reviews/product/${encodeURIComponent(safeId)}`, {
    method: "GET",
  });
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map(normalizeReview);
};
