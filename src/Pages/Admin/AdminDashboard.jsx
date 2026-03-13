import React, { useEffect, useState } from "react";
import {
  approvePendingSeller,
  fetchAdminAnalytics,
  fetchPendingSellers,
  rejectPendingSeller,
} from "../../lib/adminApi";
import { formatNaira } from "../../lib/currency";

const money = (value) => formatNaira(value);

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [analyticsRes, sellersRes] = await Promise.all([
        fetchAdminAnalytics(),
        fetchPendingSellers(),
      ]);
      setAnalytics(analyticsRes?.data || null);
      setPendingSellers(Array.isArray(sellersRes?.data) ? sellersRes.data : []);
    } catch (err) {
      setError(err.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (sellerId, type) => {
    try {
      setActionLoadingId(String(sellerId));
      if (type === "approve") {
        await approvePendingSeller(sellerId);
      } else {
        await rejectPendingSeller(sellerId);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update seller status");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <button
          onClick={loadData}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="rounded border bg-white p-4 text-sm">Loading...</div>}
      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded border bg-white p-3 text-sm">Users: {analytics?.users || 0}</div>
            <div className="rounded border bg-white p-3 text-sm">Sellers: {analytics?.sellers || 0}</div>
            <div className="rounded border bg-white p-3 text-sm">Orders: {analytics?.orders || 0}</div>
            <div className="rounded border bg-white p-3 text-sm">
              Open Disputes: {analytics?.openDisputes || 0}
            </div>
            <div className="rounded border bg-white p-3 text-sm">
              Revenue: {money(analytics?.revenue)}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <div className="border-b p-4">
              <h2 className="text-base font-semibold">Pending Seller Applications</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-gray-500">
                      No pending applications.
                    </td>
                  </tr>
                ) : (
                  pendingSellers.map((seller) => {
                    const busy = actionLoadingId === String(seller?._id || "");
                    return (
                      <tr key={seller._id} className="border-t">
                        <td className="px-4 py-3">{seller?.storeName || "-"}</td>
                        <td className="px-4 py-3">
                          {seller?.user?.name || "-"} ({seller?.user?.email || "-"})
                        </td>
                        <td className="px-4 py-3">{seller?.contactPhone || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              disabled={busy}
                              onClick={() => handleAction(seller._id, "approve")}
                              className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => handleAction(seller._id, "reject")}
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 disabled:opacity-50"
                            >
                              Reject
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
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
