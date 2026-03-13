import { io } from "socket.io-client";
import { getAccessToken } from "./authSession";

const resolveSocketBaseUrl = () => {
  const explicit = String(import.meta.env.VITE_SOCKET_URL || "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (apiBase) return apiBase.replace(/\/+$/, "");

  if (import.meta.env.DEV) return "http://localhost:6001";
  return window.location.origin;
};

let chatSocket = null;
let publicSocket = null;

export const getChatSocket = () => {
  if (!chatSocket) {
    chatSocket = io(resolveSocketBaseUrl(), {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  const token = getAccessToken();
  chatSocket.auth = {
    token: token ? `Bearer ${token}` : "",
  };

  if (!chatSocket.connected) {
    chatSocket.connect();
  }

  return chatSocket;
};

export const closeChatSocket = () => {
  if (!chatSocket) return;
  chatSocket.disconnect();
  chatSocket = null;
};

export const getPublicSocket = () => {
  if (!publicSocket) {
    publicSocket = io(resolveSocketBaseUrl(), {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  if (!publicSocket.connected) {
    publicSocket.connect();
  }

  return publicSocket;
};

export const closePublicSocket = () => {
  if (!publicSocket) return;
  publicSocket.disconnect();
  publicSocket = null;
};
