import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import {
  fetchMySellerProfile,
  fetchSellerOrders,
  fetchSellerProducts,
} from "../../lib/sellerApi";
import { formatNaira } from "../../lib/currency";

const money = (value) => formatNaira(value);

function SellerAnalytics() {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const profile = await fetchMySellerProfile(user?.userId);
      setSellerProfile(profile);
      if (!profile?._id) {
        setProducts([]);
        setOrders([]);
        return;
      }

      const [productList, orderList] = await Promise.all([
        fetchSellerProducts(profile._id),
        fetchSellerOrders(profile._id),
      ]);

      setProducts(Array.isArray(productList) ? productList : []);
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user?.userId]);

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => {
      const total =
        Array.isArray(order?.items)
          ? order.items.reduce((itemSum, item) => itemSum + Number(item?.total || 0), 0)
          : Number(order?.summary?.total || 0);
      return sum + total;
    }, 0);

    const completedOrders = orders.filter(
      (order) => String(order?.status || "").toLowerCase() === "completed"
    ).length;

    const averageOrderValue = orders.length ? revenue / orders.length : 0;

    return {
      revenue,
      products: products.length,
      orders: orders.length,
      completedOrders,
      averageOrderValue,
    };
  }, [orders, products]);

  const monthlySeries = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const date = order?.createdAt ? new Date(order.createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = map.get(key) || { orders: 0, revenue: 0 };
      const total =
        Array.isArray(order?.items)
          ? order.items.reduce((itemSum, item) => itemSum + Number(item?.total || 0), 0)
          : Number(order?.summary?.total || 0);
      current.orders += 1;
      current.revenue += total;
      map.set(key, current);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([key, value]) => ({ key, ...value }));
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-600">{sellerProfile?.storeName || "Seller Store"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAnalytics}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate("/seller/orders")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Open Orders
          </button>
          <button
            onClick={() => navigate("/seller/products")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Open Products
          </button>
        </div>
      </div>

      {loading && <div className="rounded border bg-white p-4 text-sm">Loading...</div>}
      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">Revenue: {money(stats.revenue)}</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">Orders: {stats.orders}</div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">Completed: {stats.completedOrders}</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">Products: {stats.products}</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              Avg Order: {money(stats.averageOrderValue)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b p-4">
              <h2 className="text-base font-semibold">Monthly Summary (Last 6 months)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySeries.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-gray-500" colSpan={3}>
                        No data available.
                      </td>
                    </tr>
                  ) : (
                    monthlySeries.map((row) => (
                      <tr key={row.key} className="border-t">
                        <td className="px-4 py-3">{row.key}</td>
                        <td className="px-4 py-3">{row.orders}</td>
                        <td className="px-4 py-3">{money(row.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SellerAnalytics;
