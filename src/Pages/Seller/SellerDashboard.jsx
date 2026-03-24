import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Boxes, Clock3, CircleCheckBig, DollarSign, ShoppingBag } from "lucide-react";
import { AppContext } from "../../contexts/AppContext";
import {
  fetchMySellerProfile,
  fetchSellerOrders,
  fetchSellerProducts,
} from "../../lib/sellerApi";
import { formatNaira } from "../../lib/currency";

const money = (value) => formatNaira(value);

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const labelize = (value) => {
  if (!value) return "Unknown";
  const text = String(value).toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function SellerDashboard() {
  const navigate = useNavigate();
  const { user, handleLogout } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const loadDashboard = async () => {
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

      const [productRows, orderRows] = await Promise.all([
        fetchSellerProducts(profile._id),
        fetchSellerOrders(profile._id),
      ]);

      setProducts(Array.isArray(productRows) ? productRows : []);
      setOrders(Array.isArray(orderRows) ? orderRows : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.roles?.includes("seller")) {
      navigate("/", { replace: true });
      return;
    }
    loadDashboard();
  }, [navigate, user]);

  const stats = useMemo(() => {
    const sellerId = String(sellerProfile?._id || "");

    const revenue = orders.reduce((sum, order) => {
      const items = Array.isArray(order?.items) ? order.items : [];
      const total = items
        .filter((item) => asId(item?.seller) === sellerId)
        .reduce((sub, item) => sub + Number(item?.total || 0), 0);
      return sum + total;
    }, 0);

    const activeProducts = products.filter(
      (product) => String(product?.status || "").toLowerCase() === "active"
    ).length;

    const pendingOrders = orders.filter((order) =>
      ["pending", "processing"].includes(String(order?.status || "").toLowerCase())
    ).length;

    const completedOrders = orders.filter(
      (order) => String(order?.status || "").toLowerCase() === "completed"
    ).length;

    return {
      revenue,
      totalProducts: products.length,
      activeProducts,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
    };
  }, [orders, products, sellerProfile]);

  const recentProducts = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        )
        .slice(0, 5),
    [products]
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        )
        .slice(0, 5),
    [orders]
  );

  const quickActions = [
    { label: "Add Product", path: "/seller/products" },
    { label: "Manage Orders", path: "/seller/orders" },
    { label: "Messages", path: "/seller/messages" },
    { label: "Analytics", path: "/seller/analytics" },
    { label: "Customers", path: "/seller/customers" },
    { label: "Payouts", path: "/seller/payouts" },
    { label: "Settings", path: "/seller/settings" },
    { label: "Logout", action: handleLogout, tone: "danger" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {sellerProfile?.storeLogo ? (
            <img
              src={sellerProfile.storeLogo}
              alt={sellerProfile.storeName || "Store logo"}
              className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h1>
            <p className="text-sm text-slate-600">
              {sellerProfile?.storeName || user?.name || "Seller"}
            </p>
          </div>
        </div>
        <button
          onClick={loadDashboard}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="rounded border bg-white p-4 text-sm">Loading dashboard...</div>}
      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && !error && !sellerProfile && (
        <div className="rounded border bg-yellow-50 p-4 text-sm text-yellow-800">
          Seller profile not found.
        </div>
      )}

      {!loading && !error && sellerProfile && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <DollarSign size={16} />
                Revenue
              </div>
              <p className="mt-1 text-lg font-semibold text-emerald-900">{money(stats.revenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Boxes size={16} />
                Products
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-900">{stats.totalProducts}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <BarChart3 size={16} />
                Active
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-900">{stats.activeProducts}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <ShoppingBag size={16} />
                Orders
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock3 size={16} />
                Pending
              </div>
              <p className="mt-1 text-lg font-semibold text-amber-900">{stats.pendingOrders}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <CircleCheckBig size={16} />
                Completed
              </div>
              <p className="mt-1 text-lg font-semibold text-blue-900">{stats.completedOrders}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {quickActions.map((action) => (
                <button
                  key={action.path || action.label}
                  onClick={() => {
                    if (typeof action.action === "function") {
                      action.action();
                      return;
                    }
                    if (action.path) {
                      navigate(action.path);
                    }
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    action.tone === "danger"
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-base font-semibold text-slate-900">Recent Products</h2>
                <button
                  onClick={() => navigate("/seller/products")}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Manage
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-gray-500" colSpan={4}>
                        No products yet.
                      </td>
                    </tr>
                  ) : (
                    recentProducts.map((product) => (
                      <tr key={product._id} className="border-t">
                        <td className="px-4 py-3 font-medium">{product?.name || "-"}</td>
                        <td className="px-4 py-3">{money(product?.price)}</td>
                        <td className="px-4 py-3">{Number(product?.inventory?.quantity || 0)}</td>
                        <td className="px-4 py-3">{labelize(product?.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
                <button
                  onClick={() => navigate("/seller/orders")}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Open
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-gray-500" colSpan={4}>
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order._id} className="border-t">
                        <td className="px-4 py-3 font-medium">#{String(order._id).slice(-8)}</td>
                        <td className="px-4 py-3">{labelize(order?.status)}</td>
                        <td className="px-4 py-3">{money(order?.summary?.total)}</td>
                        <td className="px-4 py-3">
                          {order?.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
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

export default SellerDashboard;
