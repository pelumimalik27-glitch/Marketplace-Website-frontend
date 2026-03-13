import { buildApiUrl } from "./api";

const TOKEN_KEY = "userToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "userInfo";

const parseJson = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
};

const decodeBase64Url = (value = "") => {
  try {
    const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const padded = `${normalized}${"=".repeat(paddingLength)}`;
    return atob(padded);
  } catch (_) {
    return "";
  }
};

const decodePayload = (token = "") => {
  try {
    const base64 = String(token).split(".")[1];
    if (!base64) return null;
    return parseJson(decodeBase64Url(base64), null);
  } catch (_) {
    return null;
  }
};

export const isJwtExpired = (token = "", skewMs = 10_000) => {
  if (!token) return true;
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  return Date.now() + skewMs >= payload.exp * 1000;
};

export const getStoredUser = () => parseJson(localStorage.getItem(USER_KEY), null);
export const getAccessToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY) || "";

export const saveSession = ({ accessToken, refreshToken, user } = {}) => {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("userRole");
};

let refreshPromise = null;

export const refreshSession = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message || "Session refresh failed");
        }
        const data = payload?.data || {};
        saveSession({
          accessToken: data?.accessToken,
          refreshToken: data?.refreshToken,
          user: data?.user,
        });
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const getValidAccessToken = async () => {
  const token = getAccessToken();
  if (token && !isJwtExpired(token)) {
    return token;
  }

  const refreshed = await refreshSession();
  return refreshed?.accessToken || getAccessToken();
};
