import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import { fetchMySellerProfile, fetchSellerOrders } from "../../lib/sellerApi";
import { formatNaira } from "../../lib/currency";

const money = (value) => formatNaira(value);

const customerName = (customer) => {
  if (!customer) return "Unknown";
  if (typeof customer === "string") return `Customer ${customer.slice(-6)}`;
  return customer.name || customer.email || `Customer ${String(customer?._id || "").slice(-6)}`;
};

const customerId = (customer) => {
  if (!customer) return "";
  if (typeof customer === "string") return customer;
  return String(customer._id || "");
};

function SellerCustomers() {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const profile = await fetchMySellerProfile(user?.userId);
      setSellerProfile(profile);
      if (!profile?._id) {
        setOrders([]);
        return;
      }
      const list = await fetchSellerOrders(profile._id);
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [user?.userId]);

  const customers = useMemo(() => {
    const sellerId = String(sellerProfile?._id || "");
    const map = new Map();

    orders.forEach((order) => {
      const buyer = order?.buyer;
      const id = customerId(buyer) || "unknown";
      const entry = map.get(id) || {
        id,
        name: customerName(buyer),
        email: typeof buyer === "object" ? buyer?.email || "" : "",
        orders: 0,
        spent: 0,
        lastOrderAt: null,
      };

      const sellerItems = Array.isArray(order?.items)
        ? order.items.filter((item) => {
            const itemSeller = item?.seller?._id || item?.seller;
            return String(itemSeller || "") === sellerId;
          })
        : [];

      const itemTotal = sellerItems.reduce((sum, item) => sum + Number(item?.total || 0), 0);

      entry.orders += 1;
      entry.spent += itemTotal;
      entry.lastOrderAt = order?.createdAt || entry.lastOrderAt;
      map.set(id, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [orders, sellerProfile]);

  const filtered = useMemo(
    () =>
      customers.filter((c) =>
        `${c.name} ${c.email} ${c.id}`.toLowerCase().includes(search.toLowerCase())
      ),
    [customers, search]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-600">{sellerProfile?.storeName || "Seller Store"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadCustomers}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate("/seller/orders")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            View Orders
          </button>
          <button
            onClick={() => navigate("/seller/messages")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Open Messages
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
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
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Last Order</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={6}>
                    No customers yet.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3">{customer.email || "-"}</td>
                    <td className="px-4 py-3">{customer.orders}</td>
                    <td className="px-4 py-3">{money(customer.spent)}</td>
                    <td className="px-4 py-3">
                      {customer.lastOrderAt
                        ? new Date(customer.lastOrderAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate("/seller/messages")}
                        className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-100"
                      >
                        Message
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SellerCustomers;
