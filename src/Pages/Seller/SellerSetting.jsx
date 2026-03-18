import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import {
  fetchMySellerProfile,
  fetchPaystackBanks,
  updateSellerProfile,
} from "../../lib/sellerApi";

const defaultForm = {
  storeName: "",
  storeLogo: "",
  contactPhone: "",
  businessAddress: "",
  paymentDetails: "",
  paystackSubaccountCode: "",
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountName: "",
  idNumber: "",
  verificationNotes: "",
  offlineAutoReplyEnabled: false,
  offlineAutoReplyDelayMinutes: 3,
  offlineAutoReplyPrompt: "",
  offlineAutoReplyFallback: "",
};

function SellerSettings() {
  const { user } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [banks, setBanks] = useState([]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const [profile, bankList] = await Promise.all([
        fetchMySellerProfile(user?.userId),
        fetchPaystackBanks().catch(() => []),
      ]);
      setSellerProfile(profile);
      setBanks(Array.isArray(bankList) ? bankList : []);
      setForm({
        storeName: profile?.storeName || "",
        storeLogo: profile?.storeLogo || "",
        contactPhone: profile?.contactPhone || "",
        businessAddress: profile?.businessAddress || "",
        paymentDetails: profile?.paymentDetails || "",
        paystackSubaccountCode: profile?.paystackSubaccountCode || "",
        bankName: profile?.bankName || "",
        bankCode: profile?.bankCode || "",
        accountNumber: profile?.accountNumber || "",
        accountName: profile?.accountName || "",
        idNumber: profile?.idNumber || "",
        verificationNotes: profile?.verificationNotes || "",
        offlineAutoReplyEnabled: Boolean(profile?.offlineAutoReplyEnabled),
        offlineAutoReplyDelayMinutes: Number(profile?.offlineAutoReplyDelayMinutes) || 3,
        offlineAutoReplyPrompt: profile?.offlineAutoReplyPrompt || "",
        offlineAutoReplyFallback: profile?.offlineAutoReplyFallback || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load seller settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user?.userId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleBankSelect = (event) => {
    const bankCode = event.target.value;
    const selected = banks.find((bank) => bank.code === bankCode);
    setForm((prev) => ({
      ...prev,
      bankCode,
      bankName: selected?.name || prev.bankName,
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      setForm((prev) => ({ ...prev, storeLogo: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, storeLogo: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!sellerProfile?._id) {
      setError("Seller profile not found.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        storeName: form.storeName.trim(),
        storeLogo: String(form.storeLogo || "").trim(),
        contactPhone: form.contactPhone.trim(),
        businessAddress: form.businessAddress.trim(),
        paymentDetails: form.paymentDetails.trim(),
        paystackSubaccountCode: form.paystackSubaccountCode.trim(),
        bankName: form.bankName.trim(),
        bankCode: form.bankCode.trim(),
        accountNumber: form.accountNumber.trim(),
        accountName: form.accountName.trim(),
        idNumber: form.idNumber.trim(),
        verificationNotes: form.verificationNotes.trim(),
        offlineAutoReplyEnabled: Boolean(form.offlineAutoReplyEnabled),
        offlineAutoReplyDelayMinutes: Math.min(
          15,
          Math.max(1, Number(form.offlineAutoReplyDelayMinutes) || 3)
        ),
        offlineAutoReplyPrompt: form.offlineAutoReplyPrompt.trim(),
        offlineAutoReplyFallback: form.offlineAutoReplyFallback.trim(),
      };

      const response = await updateSellerProfile(sellerProfile._id, payload);
      const updated = response?.data || null;
      if (updated) {
        setSellerProfile(updated);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("seller-profile-updated", { detail: updated })
          );
        }
      }
      setSuccess("Settings updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-[calc(100vh-11rem)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Store Settings</h1>
          <p className="text-sm text-slate-600">Manage your seller profile and payout details</p>
        </div>
        <button
          onClick={loadSettings}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
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
      {!loading && success && (
        <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {!loading && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Store name</label>
                <input
                  name="storeName"
                  value={form.storeName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Store logo
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-auto"
                  />
                  {form.storeLogo ? (
                    <img
                      src={form.storeLogo}
                      alt="Store logo preview"
                      className="h-14 w-14 rounded object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="text-xs text-slate-500">No logo uploaded</div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contact phone</label>
                <input
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Business address</label>
                <input
                  name="businessAddress"
                  value={form.businessAddress}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Payment details</label>
                <textarea
                  name="paymentDetails"
                  value={form.paymentDetails}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Paystack subaccount code
                </label>
                <input
                  name="paystackSubaccountCode"
                  value={form.paystackSubaccountCode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="ACCT_..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Select bank</label>
                <select
                  name="bankCode"
                  value={form.bankCode}
                  onChange={handleBankSelect}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                    Bank list unavailable. You can enter bank name and code manually.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bank name</label>
                <input
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Select from list"
                  readOnly={banks.length > 0}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bank code</label>
                <input
                  name="bankCode"
                  value={form.bankCode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Auto from bank list"
                  readOnly={banks.length > 0}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Account number
                </label>
                <input
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="10-digit NUBAN"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Account name
                </label>
                <input
                  name="accountName"
                  value={form.accountName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">ID number</label>
                <input
                  name="idNumber"
                  value={form.idNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Application status</label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  {sellerProfile?.status || "-"}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Admin notes</label>
                <textarea
                  name="verificationNotes"
                  value={form.verificationNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">AI auto-reply</h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Send an automatic chat response if you do not reply within the grace period.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="offlineAutoReplyEnabled"
                      checked={form.offlineAutoReplyEnabled}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    Enable
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Wait time before AI reply
                    </label>
                    <input
                      type="number"
                      name="offlineAutoReplyDelayMinutes"
                      min="1"
                      max="15"
                      value={form.offlineAutoReplyDelayMinutes}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Choose how many minutes the system should wait for your manual reply before sending an automated response.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      AI instructions
                    </label>
                    <textarea
                      name="offlineAutoReplyPrompt"
                      value={form.offlineAutoReplyPrompt}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Example: Mention business hours, ask buyers to include product name and size, and keep replies polite."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Fallback reply
                    </label>
                    <textarea
                      name="offlineAutoReplyFallback"
                      value={form.offlineAutoReplyFallback}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Used when the AI provider is not configured or unavailable."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      The system waits for your selected delay, then sends at most one automated reply per conversation within a short cooldown window.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-orange-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SellerSettings;
