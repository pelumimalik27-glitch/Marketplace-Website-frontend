import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

export default function RequestPasswordReset() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/auth/password-reset/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const { rawText, data } = await parseResponse(response);
      if (!response.ok) {
        const fallbackMessage = `Request failed (HTTP ${response.status})`;
        setError(data?.message || data?.error || rawText || fallbackMessage);
        return;
      }

      setMessage(
        data?.message ||
          "If the email exists, a reset link has been sent. Check your inbox."
      );
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
            Reset Your Password
          </h1>
          <p className="mt-1.5 text-sm text-gray-600 sm:text-base">
            Enter your email to receive a reset link.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-xl sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-transparent focus:ring-2 focus:ring-orange-500 sm:text-base"
                placeholder="Enter your email"
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
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
