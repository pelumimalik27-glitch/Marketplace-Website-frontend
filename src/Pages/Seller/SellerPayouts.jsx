import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import {
  fetchMySellerProfile,
  fetchPaystackBanks,
  fetchSellerWallet,
  fetchSellerWalletTransactions,
  requestSellerWithdrawal,
} from "../../lib/sellerApi";
import { formatNaira } from "../../lib/currency";

const money = (value) => formatNaira(value);

function SellerPayouts() {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState({ loading: false, error: "", success: "" });
  const [banks, setBanks] = useState([]);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });

  const loadPayouts = async () => {
    try {
      setLoading(true);
      setError("");
      const profile = await fetchMySellerProfile(user?.userId);
      setSellerProfile(profile);
      const [walletPayload, txRows, bankList] = await Promise.all([
        fetchSellerWallet(),
        fetchSellerWalletTransactions(),
        fetchPaystackBanks().catch(() => []),
      ]);
      setWallet(walletPayload?.data || null);
      setTransactions(Array.isArray(txRows) ? txRows : []);
      setBanks(Array.isArray(bankList) ? bankList : []);
      setWithdrawForm((prev) => ({
        ...prev,
        bankName: profile?.bankName || prev.bankName,
        bankCode: profile?.bankCode || prev.bankCode,
        accountNumber: profile?.accountNumber || prev.accountNumber,
        accountName: profile?.accountName || prev.accountName,
      }));
    } catch (err) {
      setError(err.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [user?.userId]);

  const payoutRows = useMemo(() => {
    return transactions
      .map((row) => ({
        id: String(row?._id || ""),
        date: row?.createdAt || null,
        status: String(row?.status || "pending").toLowerCase(),
        type: String(row?.type || "").toLowerCase(),
        source: String(row?.source || "").toLowerCase(),
        amount: Number(row?.amount || 0) / 100,
        reference: row?.reference || "",
      }))
      .filter((row) => (statusFilter === "all" ? true : row.status === statusFilter))
      .sort(
        (a, b) =>
          new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime()
      );
  }, [transactions, statusFilter]);

  const summary = useMemo(() => {
    const totalCredits = payoutRows
      .filter((row) => row.type === "credit" && row.status === "success")
      .reduce((sum, row) => sum + row.amount, 0);
    const totalDebits = payoutRows
      .filter((row) => row.type === "debit" && row.status === "success")
      .reduce((sum, row) => sum + row.amount, 0);
    const available = Number(wallet?.walletBalance || 0) / 100;
    const pending = Number(wallet?.pendingPayouts || 0) / 100;

    return {
      total: totalCredits,
      debits: totalDebits,
      available,
      pending,
      count: payoutRows.length,
    };
  }, [payoutRows, wallet]);

  const exportReport = () => {
    const header = ["TransactionId", "Date", "Type", "Status", "Amount", "Reference"];
    const lines = payoutRows.map((row) => [
      row.id,
      row.date ? new Date(row.date).toISOString() : "",
      row.type,
      row.status,
      Number(row.amount || 0).toFixed(2),
      row.reference,
    ]);
    const csv = [header, ...lines].map((line) => line.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "seller-payout-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleWithdrawChange = (event) => {
    const { name, value } = event.target;
    setWithdrawForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWithdrawBankSelect = (event) => {
    const bankCode = event.target.value;
    const selected = banks.find((bank) => bank.code === bankCode);
    setWithdrawForm((prev) => ({
      ...prev,
      bankCode,
      bankName: selected?.name || prev.bankName,
    }));
  };

  const submitWithdrawal = async (event) => {
    event.preventDefault();
    try {
      setWithdrawStatus({ loading: true, error: "", success: "" });
      await requestSellerWithdrawal({
        amount: Number(withdrawForm.amount || 0),
        bankName: withdrawForm.bankName,
        bankCode: withdrawForm.bankCode,
        accountNumber: withdrawForm.accountNumber,
        accountName: withdrawForm.accountName,
      });
      setWithdrawStatus({ loading: false, error: "", success: "Withdrawal request sent." });
      setWithdrawOpen(false);
      setWithdrawForm((prev) => ({ ...prev, amount: "" }));
      await loadPayouts();
    } catch (err) {
      setWithdrawStatus({
        loading: false,
        error: err.message || "Withdrawal failed",
        success: "",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Payouts</h1>
          <p className="text-sm text-slate-600">{sellerProfile?.storeName || "Seller Store"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPayouts}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
          <button
            onClick={() => setWithdrawOpen((prev) => !prev)}
            disabled={summary.available <= 0}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Withdraw
          </button>
          <button
            onClick={exportReport}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Export CSV
          </button>
        </div>
      </div>

      {withdrawOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Withdraw Funds</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter your bank details to receive payouts. Bank code is required by Paystack.
          </p>
          {withdrawStatus.error && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {withdrawStatus.error}
            </div>
          )}
          <form onSubmit={submitWithdrawal} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount (NGN)</label>
              <input
                name="amount"
                type="number"
                min="0"
                value={withdrawForm.amount}
                onChange={handleWithdrawChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="5000"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Select bank</label>
              <select
                name="bankCode"
                value={withdrawForm.bankCode}
                onChange={handleWithdrawBankSelect}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
                disabled={banks.length === 0}
              >
                <option value="">Select bank</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {banks.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Bank list unavailable. Enter bank code manually.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bank name</label>
              <input
                name="bankName"
                value={withdrawForm.bankName}
                onChange={handleWithdrawChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Auto from bank list"
                readOnly={banks.length > 0}
              />
            </div>
            {banks.length === 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bank code</label>
                <input
                  name="bankCode"
                  value={withdrawForm.bankCode}
                  onChange={handleWithdrawChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. 044"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Account number
              </label>
              <input
                name="accountNumber"
                value={withdrawForm.accountNumber}
                onChange={handleWithdrawChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="10-digit NUBAN"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Account name
              </label>
              <input
                name="accountName"
                value={withdrawForm.accountName}
                onChange={handleWithdrawChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Account holder name"
                required
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={withdrawStatus.loading}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {withdrawStatus.loading ? "Processing..." : "Submit Withdrawal"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/seller/settings")}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Open Settings
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          Total Earned: {money(summary.total)}
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          Available: {money(summary.available)}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">Pending: {money(summary.pending)}</div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          Transactions: {summary.count}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">pending</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
          </select>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            Showing: {payoutRows.length}
          </div>
        </div>
      </div>

      {loading && <div className="rounded border bg-white p-4 text-sm">Loading...</div>}
      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && withdrawStatus.success && (
        <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {withdrawStatus.success}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payoutRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={6}>
                      No payout data found.
                    </td>
                  </tr>
                ) : (
                  payoutRows.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3 font-medium">#{row.id.slice(-8)}</td>
                      <td className="px-4 py-3">
                        {row.date ? new Date(row.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">{row.type}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">{money(row.amount)}</td>
                      <td className="px-4 py-3">{row.reference || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default SellerPayouts;
