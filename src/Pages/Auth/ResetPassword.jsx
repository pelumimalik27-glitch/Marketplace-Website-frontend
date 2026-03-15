import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftCircle } from "lucide-react";
import { buildApiUrl } from "../../lib/api";

const parseResponse = async (response) => {
  const rawText = await response.text();
  let data = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (_) {
      data = {};
    }
  }
  return { rawText, data };
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => String(searchParams.get("token") || ""), [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token.trim()) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }
    if (!password.trim()) {
      setError("New password is required");
      return;
    }
    if (password.trim() !== confirmPassword.trim()) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/auth/password-reset/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password: password.trim() }),
      });

      const { rawText, data } = await parseResponse(response);
      if (!response.ok) {
        const fallbackMessage = `Reset failed (HTTP ${response.status})`;
        setError(data?.message || data?.error || rawText || fallbackMessage);
        return;
      }

      setMessage(data?.message || "Password reset successful. Redirecting...");
      setTimeout(() => {
        navigate("/authpage?mode=login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(
        err?.message
          ? `Could not reach server (${err.message}). Check backend is running.`
          : "Could not reach server. Check backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-orange-100 px-3 py-4 sm:px-4 sm:py-5">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/authpage?mode=login")}
          className="mb-3 inline-flex items-center text-orange-800 transition hover:text-orange-900"
        >
          <ArrowLeftCircle size={30} className="cursor-pointer" />
        </button>

        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Set New Password
          </h1>
          <p className="mt-1.5 text-sm text-gray-600 sm:text-base">
            Enter a new password for your account.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-xl sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-transparent focus:ring-2 focus:ring-orange-500 sm:text-base"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-transparent focus:ring-2 focus:ring-orange-500 sm:text-base"
                placeholder="Confirm new password"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            {message && (
              <div className="text-emerald-700 text-sm bg-emerald-50 p-3 rounded-lg">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-70 sm:text-base"
            >
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
