import { buildApiUrl } from "./api";
import { getValidAccessToken, refreshSession } from "./authSession";

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const getAuthHeaders = async (isFormData = false) => {
  const token = await getValidAccessToken().catch(
    () => (localStorage.getItem("userToken") || "")
  );
  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token
      ? { Authorization: `Bearer ${token}`, "x-access-token": token }
      : {}),
  };
};

const request = async (path, options = {}) => {
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const authHeaders = await getAuthHeaders(isFormData);
  let response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    try {
      const refreshed = await refreshSession();
      const retryToken = refreshed?.accessToken || "";
      response = await fetch(buildApiUrl(path), {
        ...options,
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(retryToken
            ? { Authorization: `Bearer ${retryToken}`, "x-access-token": retryToken }
            : {}),
          ...(options.headers || {}),
        },
      });
    } catch (_) {
      // Leave the original 401 response handling below.
    }
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
    const message =
      payload?.message ||
      payload?.error ||
      stripHtml(raw) ||
      `Request failed (HTTP ${response.status})`;
    throw new Error(message);
  }
  return payload;
};

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

export const fetchMySellerProfile = async (userId) => {
  const payload = await request("/seller");
  const sellers = Array.isArray(payload?.data) ? payload.data : [];
  if (!userId) return sellers[0] || null;
  return sellers.find((seller) => asId(seller.user) === String(userId)) || null;
};

export const fetchSellerProducts = async (sellerId) => {
  const payload = await request("/products");
  const products = Array.isArray(payload?.data) ? payload.data : [];
  if (!sellerId) return products;
  return products.filter((product) => asId(product.sellerId) === String(sellerId));
};

export const becomeSeller = async (payload) => {
  return request("/auth/upgrade-to-seller", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const fetchSellerApplicationStatus = async () => {
  return request("/auth/seller-application");
};

export const createSellerProduct = async (payload) => {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateSellerProduct = async (productId, payload) => {
  return request(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteSellerProduct = async (productId) => {
  return request(`/products/${productId}`, {
    method: "DELETE",
  });
};

export const fetchSellerOrders = async (sellerId) => {
  if (!sellerId) return [];
  const payload = await request(`/orders/seller/${encodeURIComponent(String(sellerId))}`);
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const updateOrderStatus = async (orderId, payload) => {
  return request(`/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const fetchCategories = async () => {
  return request("/categories");
};

export const fetchConversations = async () => {
  const payload = await request("/conversations");
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const fetchConversationsByUser = async (userId = "") => {
  const conversations = await fetchConversations();
  if (!userId) return conversations;
  return conversations.filter((conversation) => {
    const participants = Array.isArray(conversation?.participants)
      ? conversation.participants
      : [];
    return participants.some((participant) => asId(participant) === String(userId));
  });
};

export const fetchConversationMessages = async (conversationId = "") => {
  const suffix = conversationId
    ? `?conversationId=${encodeURIComponent(String(conversationId))}`
    : "";
  const payload = await request(`/messages${suffix}`);
  const messages = Array.isArray(payload?.data) ? payload.data : [];
  return messages.sort(
    (a, b) =>
      new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
  );
};

export const sendConversationMessage = async (conversationId, senderId, content) => {
  const safeContent = String(content || "").trim();
  const safeSenderId = String(senderId || "").trim();
  return request("/messages", {
    method: "POST",
    body: JSON.stringify({
      conversationId,
      content: safeContent,
      ...(safeSenderId ? { senderId: safeSenderId } : {}),
    }),
  });
};

export const deleteConversationMessage = async (messageId) => {
  if (!messageId) return null;
  return request(`/messages/${messageId}`, {
    method: "DELETE",
  });
};

export const createConversation = async (
  participants = [],
  lastMessage = "",
  productContext = null
) => {
  return request("/conversations", {
    method: "POST",
    body: JSON.stringify({
      participants,
      lastMessage,
      ...(productContext ? { productContext } : {}),
    }),
  });
};

export const updateConversation = async (conversationId, payload) => {
  return request(`/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const markMessageRead = async (messageId) => {
  if (!messageId) return null;
  return request(`/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ isRead: true }),
  });
};

export const fetchUnreadMessageCount = async (userId = "") => {
  const payload = await request("/messages");
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  if (!userId) return rows.filter((item) => item?.isRead === false).length;
  return rows.filter(
    (item) => item?.isRead === false && asId(item?.senderId) !== String(userId)
  ).length;
};

export const updateSellerProfile = async (sellerId, payload) => {
  return request(`/seller/${sellerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const fetchSellerWallet = async () => {
  return request("/payouts/wallet");
};

export const fetchSellerWalletTransactions = async () => {
  const payload = await request("/payouts/transactions");
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const requestSellerWithdrawal = async (payload) => {
  return request("/payouts/withdraw", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const fetchPaystackBanks = async () => {
  const payload = await request("/payouts/banks");
  return Array.isArray(payload?.data) ? payload.data : [];
};
