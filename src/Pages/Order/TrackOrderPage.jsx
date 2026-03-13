import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackOrderByCode } from "../../lib/orderApi";
import { formatNaira } from "../../lib/currency";
import QRCode from "qrcode";
import { getPublicSocket } from "../../lib/chatSocket";

const getStatusColor = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "bg-green-100 text-green-800";
  if (normalized === "shipped") return "bg-blue-100 text-blue-800";
  if (normalized === "processing") return "bg-yellow-100 text-yellow-800";
  if (normalized === "cancelled") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

const labelize = (value) => {
  const text = String(value || "pending").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

function TrackOrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(orderId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [qrCode, setQrCode] = useState("");

  const loadOrder = async (code) => {
    const trimmed = String(code || "").trim();
    if (!trimmed) {
      setError("Enter a valid order id.");
      setOrder(null);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await trackOrderByCode(trimmed);
      setOrder(data);
      if (data?.orderId) {
        const url = `${window.location.origin}/track-order/${encodeURIComponent(
          data.orderId
        )}`;
        QRCode.toDataURL(url)
          .then((dataUrl) => setQrCode(dataUrl))
          .catch(() => setQrCode(""));
      } else {
        setQrCode("");
      }
    } catch (err) {
      setOrder(null);
      setQrCode("");
      setError(err.message || "Order not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return undefined;
    const socket = getPublicSocket();
    const code = String(orderId || "").trim();
    if (!code) return undefined;

    const onOrderUpdated = ({ orderId: updatedId, orderCode, status, updatedAt } = {}) => {
      if (!status) return;
      setOrder((prev) => {
        if (!prev) return prev;
        const matches =
          (updatedId && String(prev?._id || "") === String(updatedId)) ||
          (orderCode && String(prev?.orderId || "") === String(orderCode)) ||
          String(prev?.orderId || "") === code;
        if (!matches) return prev;
        return { ...prev, status, updatedAt: updatedAt || prev.updatedAt };
      });
    };

    socket.emit("track:join", code);
    socket.on("order:tracked", onOrderUpdated);
    return () => {
      socket.emit("track:leave", code);
      socket.off("order:tracked", onOrderUpdated);
    };
  }, [orderId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      setError("Enter a valid order id.");
      return;
    }
    navigate(`/track-order/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Track Order</h1>
      <p className="mt-1 text-sm text-gray-600">
        Enter the tracking order id you received by email.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. ORD-1234567890"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? "Tracking..." : "Track Order"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {order && (
        <div className="mt-6 space-y-4 rounded-xl border bg-white p-5 shadow">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Order #{String(order?._id || "").slice(-8)}</span>
            {order?.orderId && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {order.orderId}
              </span>
            )}
            <span
              className={`ml-auto rounded-full px-2 py-1 text-xs ${getStatusColor(
                order?.status
              )}`}
            >
              {labelize(order?.status)}
            </span>
          </div>
          <div className="text-sm text-slate-600">
            Placed on{" "}
            {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
          </div>
          <div className="text-sm text-slate-600">
            Delivery address: {order?.deliveryAddress || "-"}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Items</h2>
            <div className="mt-3 space-y-3">
              {(Array.isArray(order?.items) ? order.items : []).map((item, index) => {
                const product = item?.product || {};
                return (
                  <div
                    key={`${asId(item?.product?._id || item?.product)}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm"
                  >
                    {product?.image ? (
                      <img
                        src={product.image}
                        alt={product?.name || "Product"}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-slate-100" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">
                        {product?.name || "Product"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Qty: {Number(item?.quantity || 0)} • {formatNaira(item?.price)}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {formatNaira(item?.total || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between border-t pt-3 text-sm">
            <span className="font-medium text-slate-700">Total</span>
            <span className="font-semibold text-orange-600">
              {formatNaira(order?.summary?.total || 0)}
            </span>
          </div>

          {qrCode && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-slate-900">QR Code</p>
              <p className="text-xs text-slate-500">
                Scan or download to share your tracking link.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <img
                  src={qrCode}
                  alt={`Order ${order?.orderId} QR`}
                  className="h-28 w-28 rounded border"
                />
                <a
                  href={qrCode}
                  download={`order-${order?.orderId || "tracking"}.png`}
                  className="rounded-lg border border-orange-200 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                >
                  Download QR
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TrackOrderPage;
