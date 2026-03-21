import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeProxyTarget = (value, fallback = "http://localhost:6001") => {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return fallback;

  let candidate = raw;
  if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(candidate)) {
    if (candidate.startsWith("//")) {
      candidate = `https:${candidate}`;
    } else if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(candidate)) {
      candidate = `http://${candidate}`;
    } else {
      candidate = `https://${candidate}`;
    }
  }

  try {
    return new URL(candidate).origin;
  } catch (_) {
    return fallback;
  }
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget = normalizeProxyTarget(
    env.VITE_DEV_API_BASE_URL ||
    env.VITE_API_BASE_URL ||
    "http://localhost:6001"
  )
  const mailProxyTarget = normalizeProxyTarget(
    env.VITE_DEV_MAIL_API_BASE_URL ||
    env.VITE_MAIL_API_BASE_URL ||
    proxyTarget
  )

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/v1/mail": {
          target: mailProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
