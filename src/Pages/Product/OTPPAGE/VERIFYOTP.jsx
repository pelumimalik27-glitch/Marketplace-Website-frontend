import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp } from "../../../lib/mailApi";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [autoSentDone, setAutoSentDone] = useState(false);

  useEffect(() => {
    if (autoSentDone) return;
    if (!email.trim()) return;
    const fromSignup = Boolean(location.state?.fromSignup);
    const alreadySent = Boolean(location.state?.autoSent);
    const initialAutoSendError = location.state?.autoSendError || "";

    if (!fromSignup) {
      if (alreadySent) {
        setMessage("OTP sent. Check your email and enter it below.");
      } else if (initialAutoSendError) {
        setError(initialAutoSendError);
      }
      setAutoSentDone(true);
      return;
    }

    if (alreadySent) {
      setMessage("OTP sent. Check your email and enter it below.");
      setAutoSentDone(true);
      return;
    }

    let cancelled = false;
    const retryAutoSend = async () => {
      try {
        setIsSending(true);
        setError("");
        setMessage("");
        setDevOtp("");
        const response = await sendOtp(email.trim());
        if (cancelled) return;
        setMessage(response?.message || "OTP sent successfully");
        if (response?.devOtp) {
          setDevOtp(String(response.devOtp));
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          initialAutoSendError ||
            err?.message ||
            "Failed to send OTP. Tap Send OTP to try again."
        );
      } finally {
        if (!cancelled) {
          setIsSending(false);
          setAutoSentDone(true);
        }
      }
    };

    retryAutoSend();
    return () => {
      cancelled = true;
    };
  }, [autoSentDone, location.state, email]);

  const onSendOtp = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setIsSending(true);
      setError("");
      setMessage("");
      setDevOtp("");
      const response = await sendOtp(email.trim());
      setMessage(response?.message || "OTP sent successfully");
      if (response?.devOtp) {
        setDevOtp(String(response.devOtp));
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!email.trim() || !otp.trim()) {
      setError("Email and OTP are required");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");
      setMessage("");
      setDevOtp("");

      const response = await verifyOtp(email.trim(), otp.trim());
      setMessage(response?.message || "OTP verified. Redirecting to login...");
      navigate("/authpage?mode=login", {
        replace: true,
        state: {
          mode: "login",
          email: email.trim(),
          otpVerified: true,
        },
      });
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Email OTP Verification</h2>
      <p className="mt-1 text-sm text-slate-600">Request an OTP and verify your email.</p>

      <div className="mt-5 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onSendOtp}
          disabled={isSending}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send OTP"}
        </button>

        <input
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          placeholder="Enter OTP"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onVerifyOtp}
          disabled={isVerifying}
          className="w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {isVerifying ? "Verifying..." : "Verify OTP"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {devOtp && (
        <p className="mt-2 text-sm text-slate-600">
          Dev OTP: <span className="font-semibold">{devOtp}</span>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
