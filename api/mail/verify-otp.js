const MAIL_BASE_URL = String(
  process.env.MAIL_API_BASE_URL ||
    process.env.VITE_MAIL_API_BASE_URL ||
    "https://marketplace-website-backend-e6q0.onrender.com"
)
  .trim()
  .replace(/\/+$/, "");

const toJsonBody = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return {};
    }
  }
  if (typeof value === "object") return value;
  return {};
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const payload = toJsonBody(req.body);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const upstream = await fetch(`${MAIL_BASE_URL}/api/v1/mail/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";
    res.status(upstream.status);
    res.setHeader("content-type", contentType);
    return res.send(raw);
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: `OTP upstream unavailable: ${error?.message || "proxy error"}`,
    });
  } finally {
    clearTimeout(timeout);
  }
}
