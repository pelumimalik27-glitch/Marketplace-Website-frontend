import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Trash2 } from "lucide-react";
import { AppContext } from "../../contexts/AppContext";
import {
  createConversation,
  fetchConversationMessages,
  fetchConversationsByUser,
  fetchMySellerProfile,
  fetchSellerOrders,
  sendConversationMessage,
  deleteConversationMessage,
  markMessageRead,
} from "../../lib/sellerApi";
import { getChatSocket } from "../../lib/chatSocket";

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const customerLabel = (customer, id) =>
  customer?.name || customer?.email || `Customer ${String(id).slice(-6)}`;

function SellerMessages() {
  const { user, refreshUnreadMessages } = useContext(AppContext);
  const bottomRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [toasts, setToasts] = useState([]);
  const [deletingId, setDeletingId] = useState("");
  const activeConversationRef = useRef("");

  const loadConversations = async () => {
    const rows = await fetchConversationsByUser(user?.userId);
    setConversations(Array.isArray(rows) ? rows : []);
  };

  const loadInbox = async () => {
    try {
      setLoading(true);
      setError("");

      const profile = await fetchMySellerProfile(user?.userId);
      setSellerProfile(profile);
      if (!profile?._id) {
        setOrders([]);
        setConversations([]);
        setActiveConversationId("");
        return;
      }

      const [orderRows] = await Promise.all([fetchSellerOrders(profile._id), loadConversations()]);
      setOrders(Array.isArray(orderRows) ? orderRows : []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const customerMap = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const buyer = order?.buyer;
      const id = asId(buyer);
      if (!id) return;

      const current = map.get(id) || {
        id,
        name: typeof buyer === "object" ? buyer?.name || "" : "",
        email: typeof buyer === "object" ? buyer?.email || "" : "",
        orders: 0,
      };

      current.orders += 1;
      map.set(id, current);
    });
    return map;
  }, [orders]);

  const conversationRows = useMemo(() => {
    const me = String(user?.userId || "");
    return conversations
      .map((conversation) => {
        const participants = Array.isArray(conversation?.participants)
          ? conversation.participants
          : [];
        const otherId = participants.map(asId).find((id) => id !== me) || "";
        const customer = customerMap.get(otherId);

        return {
          ...conversation,
          otherId,
          title: customerLabel(customer, otherId || conversation?._id),
        };
      })
      .filter((conversation) =>
        `${conversation.title} ${conversation.lastMessage || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
          new Date(a?.updatedAt || a?.createdAt || 0).getTime()
      );
  }, [conversations, customerMap, search, user?.userId]);

  const activeConversation = conversationRows.find(
    (conversation) => String(conversation?._id || "") === String(activeConversationId)
  );

  const loadMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    try {
      setMessagesLoading(true);
      const rows = await fetchConversationMessages(conversationId);
      const list = Array.isArray(rows) ? rows : [];
      setMessages(list);
      const currentUserId = String(user?.userId || "");
      const unread = list.filter(
        (item) => !item?.isRead && asId(item?.senderId) !== currentUserId
      );
      if (unread.length > 0) {
        await Promise.all(unread.map((item) => markMessageRead(item?._id)));
        setMessages((prev) =>
          prev.map((item) =>
            unread.some((u) => String(u?._id) === String(item?._id))
              ? { ...item, isRead: true }
              : item
          )
        );
        refreshUnreadMessages();
      }
    } catch (err) {
      setError(err.message || "Failed to load conversation");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    activeConversationRef.current = String(activeConversationId || "");
  }, [activeConversationId]);

  useEffect(() => {
    if (!user?.userId) return undefined;
    const socket = getChatSocket();

    const onConversation = ({ conversation } = {}) => {
      if (!conversation?._id) return;
      setConversations((prev) => {
        const id = String(conversation._id);
        const exists = prev.findIndex((item) => String(item?._id) === id);
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = { ...next[exists], ...conversation };
          return next;
        }
        return [conversation, ...prev];
      });
    };

    const onMessage = ({ message, conversationId } = {}) => {
      const currentUserId = String(user.userId || "");
      const senderId = String(message?.senderId || "");
      const safeConversationId = String(conversationId || message?.conversationId || "");
      if (!safeConversationId || !message?._id) return;

      if (safeConversationId === activeConversationRef.current) {
        setMessages((prev) => {
          if (prev.some((item) => String(item?._id) === String(message._id))) return prev;
          return [...prev, message];
        });
        if (senderId && senderId !== currentUserId) {
          markMessageRead(message?._id).finally(() => {
            refreshUnreadMessages();
          });
        }
      }

      setConversations((prev) => {
        const exists = prev.findIndex(
          (item) => String(item?._id || "") === safeConversationId
        );
        if (exists < 0) return prev;
        const next = [...prev];
        next[exists] = {
          ...next[exists],
          lastMessage: message.content || next[exists].lastMessage,
          updatedAt: message.createdAt || new Date().toISOString(),
        };
        return next;
      });

      if (senderId !== currentUserId) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const content = String(message?.content || "").trim();
        setToasts((prev) => [...prev, { id, text: content || "New message received" }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 5000);
      }
    };

    socket.on("chat:conversation", onConversation);
    socket.on("chat:message", onMessage);

    return () => {
      socket.off("chat:conversation", onConversation);
      socket.off("chat:message", onMessage);
    };
  }, [user?.userId]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    const socket = getChatSocket();
    socket.emit("chat:join", activeConversationId);
    return () => {
      socket.emit("chat:leave", activeConversationId);
    };
  }, [activeConversationId]);

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  useEffect(() => {
    if (!activeConversationId && conversationRows.length > 0) {
      setActiveConversationId(String(conversationRows[0]._id));
    }
  }, [activeConversationId, conversationRows]);

  useEffect(() => {
    loadMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async (customerId) => {
    if (!customerId || !user?.userId) return;

    const existing = conversations.find((conversation) => {
      const participants = Array.isArray(conversation?.participants)
        ? conversation.participants.map(asId)
        : [];
      return participants.includes(String(user.userId)) && participants.includes(String(customerId));
    });

    if (existing?._id) {
      setActiveConversationId(String(existing._id));
      return;
    }

    try {
      const response = await createConversation([user.userId, customerId], "");
      const created = response?.data;
      if (created?._id) {
        setConversations((prev) => [created, ...prev]);
        setActiveConversationId(String(created._id));
      }
    } catch (err) {
      setError(err.message || "Failed to start conversation");
    }
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !activeConversationId || !user?.userId) return;

    try {
      setSending(true);
      await sendConversationMessage(activeConversationId, user.userId, text);
      setNewMessage("");
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;
    try {
      setDeletingId(String(messageId));
      await deleteConversationMessage(messageId);
      setMessages((prev) => prev.filter((item) => String(item?._id) !== String(messageId)));
    } catch (err) {
      setError(err.message || "Failed to delete message");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="relative grid min-h-0 grid-cols-1 gap-4 lg:h-[calc(100vh-11rem)] lg:grid-cols-[340px_1fr]">
      <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-lg"
          >
            New message: {toast.text}
          </div>
        ))}
      </div>
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="border-b p-4">
          <h1 className="text-lg font-semibold text-slate-900">Seller Messages</h1>
          <p className="text-xs text-slate-500">{sellerProfile?.storeName || "Seller Store"}</p>
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && <p className="p-4 text-sm text-gray-500">Loading conversations...</p>}
          {!loading && conversationRows.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
          )}
          {conversationRows.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => setActiveConversationId(String(conversation._id))}
              className={`w-full border-b px-4 py-3 text-left transition ${
                String(conversation._id) === String(activeConversationId)
                  ? "border-l-4 border-orange-500 bg-orange-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{conversation.title}</p>
              <p className="mt-1 truncate text-xs text-gray-600">{conversation.lastMessage || "-"}</p>
            </button>
          ))}
        </div>

        <div className="border-t p-4">
          <p className="mb-2 text-xs font-medium text-slate-700">Start chat with customer</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(customerMap.values()).slice(0, 8).map((customer) => (
              <button
                key={customer.id}
                onClick={() => startConversation(customer.id)}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                {customerLabel(customer, customer.id)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {activeConversation?.title || "Select a conversation"}
            </h2>
            <p className="text-xs text-slate-500">
              {activeConversation
                ? `Last update: ${formatDateTime(activeConversation.updatedAt)}`
                : "No active conversation"}
            </p>
          </div>
          <button
            onClick={loadInbox}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4">
          {!activeConversationId && (
            <div className="rounded border bg-white p-4 text-sm text-gray-500">
              Select a conversation from the left panel.
            </div>
          )}
          {messagesLoading && <p className="text-sm text-gray-500">Loading messages...</p>}
          {!messagesLoading && activeConversationId && messages.length === 0 && (
            <div className="rounded border bg-white p-4 text-sm text-gray-500">
              No messages yet. Send the first message.
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message) => {
              const mine = asId(message?.senderId) === String(user?.userId || "");
              return (
                <div
                  key={message._id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                <div
                  className={`max-w-[80%] rounded px-3 py-2 text-sm ${
                    mine
                      ? "rounded-br-none bg-orange-100 text-slate-900"
                      : "rounded-bl-none border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <p>{message?.content || ""}</p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                    <span>{formatDateTime(message?.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(message?._id)}
                      disabled={deletingId === String(message?._id)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 disabled:opacity-60"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSend();
              }}
              disabled={!activeConversationId || sending}
              placeholder={activeConversationId ? "Type your message..." : "Select conversation"}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-gray-100"
            />
            <button
              onClick={handleSend}
              disabled={!activeConversationId || !newMessage.trim() || sending}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-2 text-sm text-white shadow hover:bg-orange-700 disabled:opacity-50"
            >
              <Send size={14} />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </section>
    </div>
  );
}

export default SellerMessages;
