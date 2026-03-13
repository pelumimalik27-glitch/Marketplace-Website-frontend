import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import {
  fetchMySellerProfile,
  fetchSellerOrders,
  updateOrderStatus,
} from "../../lib/sellerApi";
import { formatNaira } from "../../lib/currency";

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const money = (value) => formatNaira(value);

const labelize = (value) => {
  if (!value) return "Unknown";
  const text = String(value).toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const getNextStatus = (status) => {
  const current = String(status || "").toLowerCase();
  if (current === "pending") return "processing";
  if (current === "processing") return "shipped";
  if (current === "shipped") return "completed";
  return null;
};

function SellerOrders() {
  const { user } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const profile = await fetchMySellerProfile(user?.userId);
      setSellerProfile(profile);
      if (!profile?._id) {
        setOrders([]);
        return;
      }

      const rows = await fetchSellerOrders(profile._id);
      setOrders(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user?.userId]);

  const sellerOrderTotal = (order) => {
    const sellerId = String(sellerProfile?._id || "");
    const items = Array.isArray(order?.items) ? order.items : [];
    return items
      .filter((item) => asId(item?.seller) === sellerId)
      .reduce((sum, item) => sum + Number(item?.total || 0), 0);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderId = String(order?._id || "");
      const status = String(order?.status || "").toLowerCase();
      const matchesSearch = orderId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const count = (status) =>
      filteredOrders.filter(
        (order) => String(order?.status || "").toLowerCase() === status
      ).length;

    const revenue = filteredOrders.reduce(
      (sum, order) => sum + Number(sellerOrderTotal(order) || 0),
      0
    );

    return {
      total: filteredOrders.length,
      pending: count("pending"),
      processing: count("processing"),
      shipped: count("shipped"),
      completed: count("completed"),
      revenue,
    };
  }, [filteredOrders, sellerProfile]);

  const handleAdvanceStatus = async (order) => {
    const next = getNextStatus(order?.status);
    if (!next) return;

    try {
      setUpdatingOrderId(String(order?._id || ""));
      await updateOrderStatus(order._id, { status: next });
      await loadOrders();
      if (selectedOrder?._id === order?._id) {
        setSelectedOrder({ ...order, status: next });
      }
    } catch (err) {
      setError(err.message || "Failed to update order");
    } finally {
      setUpdatingOrderId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-600">
            {sellerProfile?.storeName || "Seller Store"}
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">Total: {stats.total}</div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">Pending: {stats.pending}</div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          Processing: {stats.processing}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">Shipped: {stats.shipped}</div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
          Completed: {stats.completed}
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          Revenue: {money(stats.revenue)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order id"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="shipped">shipped</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            Showing: {filteredOrders.length}
          </div>
        </div>
      </div>

      {loading && <div className="rounded border bg-white p-4 text-sm">Loading...</div>}
      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Your Total</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const nextStatus = getNextStatus(order?.status);
                  const isUpdating = updatingOrderId === String(order?._id || "");
                  return (
                    <tr key={order._id} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        #{String(order?._id || "").slice(-8)}
                      </td>
                      <td className="px-4 py-3">{labelize(order?.status)}</td>
                      <td className="px-4 py-3">{money(sellerOrderTotal(order))}</td>
                      <td className="px-4 py-3">
                        {Array.isArray(order?.items) ? order.items.length : 0}
                      </td>
                      <td className="px-4 py-3">
                        {order?.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-100"
                          >
                            View
                          </button>
                          <button
                            disabled={!nextStatus || isUpdating}
                            onClick={() => handleAdvanceStatus(order)}
                            className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
                          >
                            {isUpdating
                              ? "Updating..."
                              : nextStatus
                                ? `Mark ${labelize(nextStatus)}`
                                : "No Update"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-base font-semibold">
                Order #{String(selectedOrder?._id || "").slice(-8)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 p-4 text-sm">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded border bg-gray-50 px-3 py-2">
                  Status: {labelize(selectedOrder?.status)}
                </div>
                <div className="rounded border bg-gray-50 px-3 py-2">
                  Date:{" "}
                  {selectedOrder?.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleDateString()
                    : "-"}
                </div>
                <div className="rounded border bg-gray-50 px-3 py-2">
                  Your total: {money(sellerOrderTotal(selectedOrder))}
                </div>
              </div>

              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(selectedOrder?.items) ? selectedOrder.items : []).map((item, index) => (
                      <tr key={`${selectedOrder._id}-${index}`} className="border-t">
                        <td className="px-3 py-2">{asId(item?.product).slice(-8) || "-"}</td>
                        <td className="px-3 py-2">{Number(item?.quantity || 0)}</td>
                        <td className="px-3 py-2">{money(item?.price)}</td>
                        <td className="px-3 py-2">{money(item?.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerOrders;
