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
  const [paymentStatus, setPaymentStatus] = useState("");
  const isSuccess = status === "success";
  const title =
    status === "success"
      ? "Updated Payment Status"
      : status === "error"
        ? "Payment Status Update Failed"
        : "Updating Payment Status...";

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
        const verification = await verifyPayment(reference);
        if (!mounted) return;
        const verifiedStatus = String(verification?.data?.paymentStatus || "success").toUpperCase();
        setPaymentStatus(verifiedStatus);
        clearCart();
        setStatus("success");
        setMessage(`Payment status updated to ${verifiedStatus}. Redirecting to your orders...`);
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
          ? "border-4 border-orange-400 bg-emerald-600"
          : "border-slate-200 bg-white"
      }`}
    >
      {isSuccess && <div className="mb-4 h-1 w-full rounded-full bg-orange-300" />}
      <h1 className={`text-xl font-semibold ${isSuccess ? "text-white" : "text-slate-900"}`}>{title}</h1>
      <p className={`mt-3 text-sm ${isSuccess ? "text-white" : "text-slate-600"}`}>{message}</p>

      {isSuccess && (
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          {paymentStatus ? `Status: ${paymentStatus}` : "Payment confirmed"}
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
