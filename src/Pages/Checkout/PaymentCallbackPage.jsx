import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment } from "../../lib/paymentApi";
import { AppContext } from "../../contexts/AppContext";

function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useContext(AppContext);

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const isSuccess = status === "success";

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference in callback URL.");
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        await verifyPayment(reference);
        if (!mounted) return;
        clearCart();
        setStatus("success");
        setMessage("Payment successful. Redirecting to your orders...");
        setTimeout(() => navigate("/orderpage", { replace: true }), 1200);
      } catch (error) {
        if (!mounted) return;
        setStatus("error");
        setMessage(error.message || "Payment verification failed");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [searchParams, navigate, clearCart]);

  return (
    <div
      className={`mx-auto mt-12 max-w-lg rounded-xl border p-6 text-center shadow-sm ${
        isSuccess
          ? "border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-orange-50"
          : "border-slate-200 bg-white"
      }`}
    >
      {isSuccess && <div className="mb-4 h-1 w-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-orange-400" />}
      <h1 className={`text-xl font-semibold ${isSuccess ? "text-emerald-800" : "text-slate-900"}`}>Payment Status</h1>
      <p className={`mt-3 text-sm ${isSuccess ? "text-emerald-700" : "text-slate-600"}`}>{message}</p>

      {isSuccess && (
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Payment confirmed
        </div>
      )}

      {status === "error" && (
        <button
          type="button"
          onClick={() => navigate("/checkout", { replace: true })}
          className="mt-5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Back to Checkout
        </button>
      )}
    </div>
  );
}

export default PaymentCallbackPage;
