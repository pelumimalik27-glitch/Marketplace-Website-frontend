
import React, { createContext, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../lib/api";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  getValidAccessToken,
  saveSession,
} from "../lib/authSession";
import { fetchUnreadMessageCount } from "../lib/sellerApi";
import { getChatSocket } from "../lib/chatSocket";
import { emitProductUpdate } from "../lib/productApi";


const AppContext = createContext();

const AppProvider = ({ children }) => {
  const initialUser = getStoredUser();
  const initialToken = getAccessToken();
  const [isLogin, setIsLogin] = useState(Boolean(initialUser && initialToken));
  const [user, setUser] = useState(initialUser || null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sellers, setSellers] = useState([
    { id: 1, name: "Sony Store", rating: 4.5, verified: true, products: 45 },
    { id: 2, name: "Apple Store", rating: 4.8, verified: true, products: 120 },
    { id: 3, name: "Urban Wears", rating: 4.2, verified: true, products: 89 },
    { id: 4, name: "Street Style", rating: 4.0, verified: false, products: 34 },
    { id: 5, name: "HomeGlow", rating: 4.6, verified: true, products: 56 },
    { id: 6, name: "ActiveFit", rating: 4.3, verified: true, products: 78 },
    { id: 7, name: "CoolAir", rating: 4.1, verified: false, products: 23 },
    { id: 8, name: "AutoCare", rating: 4.4, verified: true, products: 67 },
  ]);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  
  const navigate = useNavigate();
  const searchRef = useRef();

  const handleLogin = ({ token, refreshToken, user }) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      return;
    }

    saveSession({
      accessToken: activeToken,
      refreshToken,
      user,
    });
    setIsLogin(true);
    setUser(user);
    setAuthReady(true);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await fetch(buildApiUrl("/auth/logout"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (_) {
      // Ignore logout API errors; local session is still cleared below.
    }

    setIsLogin(false);
    setUser(null);
    setCart([]);
    clearSession();
    setUnreadMessages(0);
    navigate("/authpage");
  };

  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
  };

  useEffect(() => {
    let mounted = true;

  const bootstrapSession = async () => {
    try {
      const storedUser = getStoredUser();
      if (!storedUser) {
        if (!mounted) return;
        setIsLogin(false);
        setUser(null);
        clearSession();
        setAuthReady(true);
        return;
      }

      const token = await getValidAccessToken();
      if (!token) {
        if (!mounted) return;
        setIsLogin(false);
        setUser(null);
        clearSession();
        setAuthReady(true);
        return;
      }

      const latestUser = getStoredUser() || storedUser;
      if (!mounted) return;
      setUser(latestUser);
      setIsLogin(true);
      try {
        const count = await fetchUnreadMessageCount(latestUser?.userId);
        if (mounted) setUnreadMessages(count);
      } catch (_) {
        if (mounted) setUnreadMessages(0);
      }
      setAuthReady(true);
    } catch (_) {
      if (!mounted) return;
      clearSession();
      setIsLogin(false);
      setUser(null);
      setAuthReady(true);
    }
  };

  bootstrapSession();
  return () => {
    mounted = false;
  };
  }, []);

  const refreshUnreadMessages = async () => {
    if (!user?.userId) {
      setUnreadMessages(0);
      return 0;
    }
    try {
      const count = await fetchUnreadMessageCount(user.userId);
      setUnreadMessages(count);
      return count;
    } catch (_) {
      setUnreadMessages(0);
      return 0;
    }
  };

  const resolveProductId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") return value.id || value._id || "";
    return String(value);
  };

  const notifyInventoryUpdate = (product) => {
    const safeId = resolveProductId(product);
    if (safeId) emitProductUpdate(safeId);
  };

  const getAuthHeaders = async () => {
    const token = await getValidAccessToken().catch(
      () => (localStorage.getItem("userToken") || "")
    );
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}`, "x-access-token": token } : {}),
    };
  };

  const requestCart = async (path, options = {}) => {
    let response = await fetch(buildApiUrl(path), {
      ...options,
      headers: {
        ...(await getAuthHeaders()),
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
            "Content-Type": "application/json",
            ...(retryToken ? { Authorization: `Bearer ${retryToken}`, "x-access-token": retryToken } : {}),
            ...(options.headers || {}),
          },
        });
      } catch (_) {
        // fall through to error handling below
      }
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || "Cart request failed");
    }
    return payload;
  };

  const loadCart = async () => {
    if (!isLogin || !user?.userId) {
      setCart([]);
      return;
    }
    try {
      const payload = await requestCart("/cart/my", { method: "GET" });
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
      setCart(items);
    } catch (_) {
      // keep existing cart on failure
    }
  };

  useEffect(() => {
    if (!isLogin || !user?.userId) return undefined;
    const socket = getChatSocket();
    const seenIds = new Set();

    const onMessage = ({ message } = {}) => {
      const senderId = String(message?.senderId || "");
      const messageId = String(message?._id || "");
      if (!messageId || seenIds.has(messageId)) return;
      seenIds.add(messageId);
      if (senderId && senderId !== String(user.userId)) {
        setUnreadMessages((prev) => prev + 1);
      }
    };

    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [isLogin, user?.userId]);

  useEffect(() => {
    loadCart();
  }, [isLogin, user?.userId]);











  const addToCart = async (product, quantity = 1, sellerId) => {
    if (!isLogin || !user?.userId) {
      setCart((prev) => {
        const exist = prev.find((i) => i.id === product.id && i.sellerId === sellerId);
        if (exist) {
          return prev.map((i) =>
            i.id === product.id && i.sellerId === sellerId ? { ...i, qty: i.qty + quantity } : i
          );
        }
        return [
          ...prev,
          {
            ...product,
            qty: quantity,
            sellerId,
            sellerName: product.seller,
          },
        ];
      });
      return;
    }

    try {
      const productId = resolveProductId(product);
      const payload = await requestCart("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
      setCart(items);
      notifyInventoryUpdate(productId);
    } catch (_) {
      // fallback to local update
      setCart((prev) => {
        const exist = prev.find((i) => i.id === product.id && i.sellerId === sellerId);
        if (exist) {
          return prev.map((i) =>
            i.id === product.id && i.sellerId === sellerId ? { ...i, qty: i.qty + quantity } : i
          );
        }
        return [
          ...prev,
          {
            ...product,
            qty: quantity,
            sellerId,
            sellerName: product.seller,
          },
        ];
      });
    }
  };

  const removeFromCart = async (id) => {
    if (!isLogin || !user?.userId) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    try {
      const payload = await requestCart(`/cart/items/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
      setCart(items);
      notifyInventoryUpdate(id);
    } catch (_) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateQuantity = async (id, newQty) => {
    if (newQty < 1) {
      removeFromCart(id);
      return;
    }
    if (!isLogin || !user?.userId) {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
      );
      return;
    }
    try {
      const payload = await requestCart(`/cart/items/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: newQty }),
      });
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
      setCart(items);
      notifyInventoryUpdate(id);
    } catch (_) {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
      );
    }
  };

  const clearCart = async () => {
    const productIds = cart.map((item) => item.id).filter(Boolean);
    if (!isLogin || !user?.userId) {
      setCart([]);
      return;
    }
    let cleared = false;
    try {
      await requestCart("/cart/clear", { method: "DELETE" });
      cleared = true;
    } catch (_) {
      // ignore
    }
    setCart([]);
    if (cleared) {
      productIds.forEach((id) => notifyInventoryUpdate(id));
    }
  };

  const groupCartBySeller = () => {
    return cart.reduce((groups, item) => {
      const sellerId = item.sellerId;
      if (!groups[sellerId]) {
        groups[sellerId] = {
          sellerId,
          sellerName: item.sellerName,
          items: [],
          shipping: item.freeShipping ? 0 : 9.99,
        };
      }
      groups[sellerId].items.push(item);
      return groups;
    }, {});
  };

  const placeOrder = (orderData) => {
    const newOrder = {
      id: Date.now(),
      ...orderData,
      date: new Date().toLocaleString(),
      status: "Processing",
      subOrders: Object.values(groupCartBySeller()).map(sellerGroup => ({
        sellerId: sellerGroup.sellerId,
        sellerName: sellerGroup.sellerName,
        items: sellerGroup.items,
        status: "Pending",
        shipping: sellerGroup.shipping,
        total: sellerGroup.items.reduce((sum, item) => sum + (item.price * item.qty), 0) + sellerGroup.shipping,
      })),
    };
    
    setOrders(prev => [...prev, newOrder]);
    clearCart();
    return newOrder;
  };

  const fileDispute = (orderId, disputeData) => {
    const newDispute = {
      id: Date.now(),
      orderId,
      ...disputeData,
      status: "Open",
      date: new Date().toLocaleString(),
    };
    setDisputes(prev => [...prev, newDispute]);
    return newDispute;
  };

  return (
    <AppContext.Provider
      value={{
        isLogin,
        user,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        groupCartBySeller,
        searchTerm,
        handleSearch,
        searchRef,
        authReady,
        handleLogin,
        handleLogout,
        unreadMessages,
        refreshUnreadMessages,
        orders,
        placeOrder,
        sellers,
        disputes,
        fileDispute,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export { AppContext, AppProvider };
