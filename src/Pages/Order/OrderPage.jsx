import React, { useContext, useEffect, useMemo, useState } from "react";
import { Package, Truck, CheckCircle, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import { fetchMyOrders, fetchOrderById, trackOrderByCode } from "../../lib/orderApi";
import { emitProductUpdate, fetchProductById, fetchProducts } from "../../lib/productApi";
import { formatNaira } from "../../lib/currency";
import { createReview } from "../../lib/reviewApi";
import QRCode from "qrcode";
import { getChatSocket } from "../../lib/chatSocket";

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const getStatusColor = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "bg-green-100 text-green-800";
  if (normalized === "shipped") return "bg-blue-100 text-blue-800";
  if (normalized === "processing") return "bg-yellow-100 text-yellow-800";
  if (normalized === "cancelled") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

const getStatusIcon = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return <CheckCircle size={16} />;
  if (normalized === "shipped") return <Truck size={16} />;
  return <Package size={16} />;
};

const labelize = (value) => {
  const text = String(value || "pending").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function OrderPage() {
  const { user } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewForms, setReviewForms] = useState({});
  const [trackValue, setTrackValue] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [qrByOrderId, setQrByOrderId] = useState({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [orderRows, productRows] = await Promise.all([
          fetchMyOrders(user?.userId),
          fetchProducts({ limit: 1000, sort: "-createdAt" }),
        ]);
        if (!mounted) return;
        setOrders(Array.isArray(orderRows) ? orderRows : []);
        setProducts(Array.isArray(productRows) ? productRows : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user?.userId) {
      load();
    } else {
      setOrders([]);
      setProducts([]);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return undefined;
    const socket = getChatSocket();

    const onOrderUpdated = ({ orderId, status, updatedAt } = {}) => {
      if (!orderId || !status) return;
      setOrders((prev) =>
        prev.map((order) =>
          String(order?._id || "") === String(orderId)
            ? { ...order, status, updatedAt: updatedAt || order.updatedAt }
            : order
        )
      );
      setTrackedOrder((prev) =>
        prev && String(prev?._id || "") === String(orderId)
          ? { ...prev, status, updatedAt: updatedAt || prev.updatedAt }
          : prev
      );
    };

    socket.on("order:updated", onOrderUpdated);
    return () => {
      socket.off("order:updated", onOrderUpdated);
    };
  }, [user?.userId]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((item) => {
      map.set(asId(item?.id || item?._id), item);
    });
    return map;
  }, [products]);

  const rows = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
    );
  }, [orders]);

  const reviewKey = (orderId, productId) => `${orderId}:${productId}`;
  const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

  useEffect(() => {
    let active = true;
    const buildQrs = async () => {
      if (!rows.length) {
        if (active) setQrByOrderId({});
        return;
      }
      const next = {};
      for (const order of rows) {
        const code = String(order?.orderId || "").trim();
        if (!code) continue;
        const url = `${window.location.origin}/track-order/${encodeURIComponent(code)}`;
        try {
          const dataUrl = await QRCode.toDataURL(url);
          next[String(order?._id || code)] = dataUrl;
        } catch (_) {
          // ignore QR generation failures
        }
      }
      if (active) setQrByOrderId(next);
    };
    buildQrs();
    return () => {
      active = false;
    };
  }, [rows]);

  const openReviewForm = (key) => {
    setReviewForms((prev) => ({
      ...prev,
      [key]: {
        rating: prev[key]?.rating || 5,
        comment: prev[key]?.comment || "",
        open: true,
        loading: false,
        error: "",
        success: "",
        done: prev[key]?.done || false,
      },
    }));
  };

  const closeReviewForm = (key) => {
    setReviewForms((prev) => ({
      ...prev,
      [key]: { ...prev[key], open: false, error: "" },
    }));
  };

  const updateReviewField = (key, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const submitReview = async (key, { orderId, productId }) => {
    setReviewForms((prev) => ({
      ...prev,
      [key]: { ...prev[key], loading: true, error: "", success: "" },
    }));

    try {
      const payload = {
        order: orderId,
        product: productId,
        rating: Number(reviewForms[key]?.rating || 5),
        comment: String(reviewForms[key]?.comment || "").trim(),
      };
      await createReview(payload);
      try {
        const updatedProduct = await fetchProductById(productId);
        setProducts((prev) =>
          prev.map((item) =>
            String(item?.id || item?._id) === String(updatedProduct?.id || updatedProduct?._id)
              ? { ...item, ...updatedProduct }
              : item
          )
        );
        emitProductUpdate(updatedProduct?.id || productId);
      } catch (_) {
        // ignore product refresh failures
      }
      setReviewForms((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loading: false,
          open: false,
          error: "",
          success: "Review submitted.",
          done: true,
        },
      }));
    } catch (err) {
      const message = err.message || "Failed to submit review";
      const isDuplicate = message.toLowerCase().includes("already reviewed");
      setReviewForms((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loading: false,
          error: message,
          success: isDuplicate ? "Review already submitted." : "",
          done: prev[key]?.done || isDuplicate,
        },
      }));
    }
  };

  const findOrderMatch = (input) => {
    const value = String(input || "").trim();
    if (!value) return null;
    const lower = value.toLowerCase();
    return (
      orders.find((order) => String(order?._id || "").toLowerCase() === lower) ||
      orders.find((order) => String(order?.orderId || "").toLowerCase() === lower) ||
      orders.find((order) => String(order?._id || "").toLowerCase().endsWith(lower))
    );
  };

  const handleTrackOrder = async (event) => {
    event.preventDefault();
    const value = String(trackValue || "").trim();
    setTrackingError("");
    setTrackedOrder(null);

    if (!value) {
      setTrackingError("Enter your order id to track.");
      return;
    }

    const localMatch = findOrderMatch(value);
    if (localMatch) {
      setTrackedOrder(localMatch);
      return;
    }

    try {
      setTracking(true);
      const fetched = isObjectId(value) ? await fetchOrderById(value) : await trackOrderByCode(value);
      if (!fetched) {
        setTrackingError("Order not found.");
        return;
      }
      setTrackedOrder(fetched);
    } catch (err) {
      setTrackingError(err.message || "Failed to track order.");
    } finally {
      setTracking(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">My Orders</h1>
      <p className="text-gray-600 mb-8">Track and manage your orders</p>

      <div className="mb-8 rounded-xl border bg-white p-5 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Track an order</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your full order id (or the last 8 characters shown in your order list).
        </p>
        <form onSubmit={handleTrackOrder} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={trackValue}
            onChange={(event) => setTrackValue(event.target.value)}
            placeholder="e.g. 65f8a1c0d2b3e4f56789abcd or 89abcd"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={tracking}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {tracking ? "Tracking..." : "Track Order"}
          </button>
        </form>
        {trackingError && (
          <p className="mt-2 text-sm text-red-600">{trackingError}</p>
        )}
        {trackedOrder && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">
                Order #{String(trackedOrder?._id || "").slice(-8)}
              </span>
              {trackedOrder?.orderId && (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                  {trackedOrder.orderId}
                </span>
              )}
              <span
                className={`ml-auto rounded-full px-2 py-1 text-xs ${getStatusColor(
                  trackedOrder?.status
                )}`}
              >
                {labelize(trackedOrder?.status)}
              </span>
            </div>
            <p className="mt-2 text-slate-600">
              Placed on{" "}
              {trackedOrder?.createdAt
                ? new Date(trackedOrder.createdAt).toLocaleString()
                : "-"}
            </p>
            <p className="mt-1 text-slate-600">
              Total: {formatNaira(trackedOrder?.summary?.total || 0)}
            </p>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <Link
            to="/shoppage"
            className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {rows.map((order) => {
            const orderId = asId(order?._id);
            const orderItems = Array.isArray(order?.items) ? order.items : [];
            const summary = order?.summary || {};
            const isCompleted = String(order?.status || "").toLowerCase() === "completed";

            return (
              <div key={orderId} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">Order #{orderId.slice(-8)}</span>
                        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getStatusColor(order?.status)}`}>
                          {getStatusIcon(order?.status)}
                          {labelize(order?.status)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        Placed on {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                      </p>
                    </div>

                    <button className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                      <Download size={16} />
                      Invoice
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold mb-4">Order Items</h3>
                      <div className="space-y-4">
                        {orderItems.map((item, idx) => {
                          const productId = asId(item?.product?._id || item?.product);
                          const product = productMap.get(productId) || item?.product;
                          const key = reviewKey(orderId, productId || `idx-${idx}`);
                          const reviewState = reviewForms[key] || {};
                          return (
                            <div key={`${orderId}-${idx}`} className="flex items-center gap-4 p-3 border rounded-lg">
                              {product?.image ? (
                                <img src={product.image} alt={product?.name || "Product"} className="w-16 h-16 object-cover rounded" />
                              ) : (
                                <div className="w-16 h-16 rounded bg-slate-100" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{product?.name || `Product ${asId(item?.product).slice(-6)}`}</p>
                                <p className="text-sm text-gray-500">Qty: {Number(item?.quantity || 0)} x {formatNaira(item?.price)}</p>
                                {isCompleted && productId && (
                                  <div className="mt-2 space-y-2">
                                    {reviewState.success && (
                                      <p className="text-xs text-emerald-600">{reviewState.success}</p>
                                    )}
                                    {reviewState.error && (
                                      <p className="text-xs text-red-600">{reviewState.error}</p>
                                    )}
                                    {!reviewState.done && !reviewState.open && (
                                      <button
                                        type="button"
                                        onClick={() => openReviewForm(key)}
                                        className="rounded border border-orange-200 px-2 py-1 text-xs text-orange-700 hover:bg-orange-50"
                                      >
                                        Leave review
                                      </button>
                                    )}
                                    {reviewState.open && (
                                      <div className="rounded border border-slate-200 bg-slate-50 p-2 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <label className="text-xs font-medium text-slate-600">
                                            Rating
                                          </label>
                                          <select
                                            value={reviewState.rating || 5}
                                            onChange={(e) => updateReviewField(key, "rating", e.target.value)}
                                            className="rounded border border-slate-200 px-2 py-1 text-xs"
                                          >
                                            {[5, 4, 3, 2, 1].map((value) => (
                                              <option key={value} value={value}>
                                                {value}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <textarea
                                          value={reviewState.comment || ""}
                                          onChange={(e) => updateReviewField(key, "comment", e.target.value)}
                                          rows={2}
                                          placeholder="Share your feedback"
                                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            disabled={reviewState.loading}
                                            onClick={() => submitReview(key, { orderId, productId })}
                                            className="rounded bg-orange-600 px-2 py-1 text-xs text-white disabled:opacity-60"
                                          >
                                            {reviewState.loading ? "Submitting..." : "Submit"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => closeReviewForm(key)}
                                            className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold">{formatNaira(item?.total)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-4">Order Summary</h3>
                      <div className="space-y-3 p-4 border rounded-lg">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatNaira(summary?.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span>{formatNaira(summary?.shipping)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax</span>
                          <span>{formatNaira(summary?.tax)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                          <span className="font-bold">Total</span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatNaira(summary?.total)}
                          </span>
                        </div>
                      </div>

                      {order?.orderId && qrByOrderId[String(order?._id || order?.orderId)] && (
                        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">Track this order</p>
                          <p className="text-xs text-slate-500">
                            Scan the QR code or open the tracking page.
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            <img
                              src={qrByOrderId[String(order?._id || order?.orderId)]}
                              alt={`Track order ${order?.orderId}`}
                              className="h-28 w-28 rounded border"
                            />
                            <Link
                              to={`/track-order/${encodeURIComponent(order.orderId)}`}
                              className="rounded-lg border border-orange-200 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                            >
                              Open tracking
                            </Link>
                            <a
                              href={qrByOrderId[String(order?._id || order?.orderId)]}
                              download={`order-${order?.orderId || "tracking"}.png`}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Download QR
                            </a>
                          </div>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="mt-5">
                          <Link
                            to={`/dispute/${orderId}`}
                            className="inline-flex rounded-lg border-2 border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            File Dispute
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderPage;
