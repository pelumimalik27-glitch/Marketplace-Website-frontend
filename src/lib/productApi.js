import { buildApiUrl } from "./api";

const PRODUCT_CACHE_KEY = "product_cache_v2";
const LEGACY_CACHE_KEY = "cached_products";
const hasLocalStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";
const REQUEST_TIMEOUT_MS = 8000;

let lastProductFetchSource = "backend";
const inFlightProductsByPath = new Map();

const asId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null) return fallback;
  return Boolean(value);
};

const isLikelyObjectId = (value) => /^[a-f0-9]{24}$/i.test(asId(value));
const hasRealSellerLink = (item = {}) => isLikelyObjectId(item?.sellerId);

const getImage = (item = {}) => {
  if (item.image) return String(item.image);
  if (Array.isArray(item.images) && item.images[0]) return String(item.images[0]);
  return "";
};

const fingerprint = (item = {}) => {
  const name = String(item?.name || "").trim().toLowerCase();
  const category = String(item?.category || "").trim().toLowerCase();
  const sellerId = String(item?.sellerId || "").trim().toLowerCase();
  return `${name}::${category}::${sellerId}`;
};

const normalize = (item = {}) => {
  const sellerId = asId(item.sellerId || item.seller);
  const inventoryQty = toNumber(item?.inventory?.quantity, 0);

  return {
    ...item,
    id: asId(item.id || item._id),
    _id: asId(item._id || item.id),
    sellerId: sellerId || "unknown-seller",
    seller:
      item?.sellerName ||
      item?.sellerId?.storeName ||
      item?.seller?.name ||
      item?.seller?.storeName ||
      item?.seller ||
      "",
    image: getImage(item),
    images:
      Array.isArray(item.images) && item.images.length
        ? item.images
        : getImage(item)
          ? [getImage(item)]
          : [],
    price: toNumber(item.price, 0),
    rating: toNumber(item.rating, 0),
    reviews: toNumber(item.reviews, 0),
    freeShipping: toBoolean(item.freeShipping, false),
    inStock: toBoolean(item.inStock, inventoryQty > 0),
    category: String(item.category || "Uncategorized"),
    description: String(item.description || ""),
  };
};

const readCachedProducts = () => {
  if (!hasLocalStorage) return [];
  try {
    const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed?.items) ? parsed.items : [];
      return dedupeProducts(list).filter(
        (item) => isLikelyObjectId(item?._id || item?.id) && hasRealSellerLink(item)
      );
    }

    return [];
  } catch (_) {
    return [];
  }
};

const writeCachedProducts = (items = []) => {
  if (!hasLocalStorage) return;
  try {
    const rows = dedupeProducts(items);
    localStorage.setItem(
      PRODUCT_CACHE_KEY,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        items: rows,
      })
    );
    // Keep old key updated for compatibility with older code paths.
    localStorage.setItem(LEGACY_CACHE_KEY, JSON.stringify(rows));
  } catch (_) {
    // Ignore cache write errors to avoid breaking product browsing.
  }
};

const isNetworkFailure = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    error instanceof TypeError ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("timeout")
  );
};

const dedupeProducts = (items = []) => {
  const seenIds = new Set();
  const seenFingerprint = new Set();
  const rows = [];
  for (const item of items.map(normalize)) {
    const id = asId(item?.id || item?._id);
    if (id && seenIds.has(id)) continue;
    if (id) seenIds.add(id);
    const key = fingerprint(item);
    if (key && seenFingerprint.has(key)) continue;
    if (key) seenFingerprint.add(key);
    rows.push(item);
  }
  return rows;
};

const sortProducts = (items = [], sort = "") => {
  const list = [...items];
  const key = String(sort || "");
  if (!key) return list;

  if (key === "-createdAt") {
    return list.sort(
      (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
    );
  }
  if (key === "createdAt") {
    return list.sort(
      (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
    );
  }

  return list;
};

const applyOptions = (items = [], options = {}) => {
  const { limit, sort } = options || {};
  const sorted = sortProducts(items, sort);
  const safeLimit = Number(limit);
  if (Number.isFinite(safeLimit) && safeLimit > 0) {
    return sorted.slice(0, safeLimit);
  }
  return sorted;
};

const requestProducts = async (path) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(buildApiUrl(path), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || "Failed to load products");
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildProductsPath = (options = {}) => {
  const params = new URLSearchParams();
  const limitValue = Number(options?.limit);
  const sortValue = String(options?.sort || "").trim();

  if (Number.isFinite(limitValue) && limitValue > 0) {
    params.set("limit", String(Math.trunc(limitValue)));
  }
  if (sortValue === "createdAt" || sortValue === "-createdAt") {
    params.set("sort", sortValue);
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
};

export const getLastProductFetchSource = () => lastProductFetchSource;
export const getCachedProductsSnapshot = (options = {}) =>
  applyOptions(readCachedProducts(), options);

export const fetchProducts = async (options = {}) => {
  const { useCacheOnError = true } = options;
  const cached = readCachedProducts();
  const path = buildProductsPath(options);

  try {
    if (!inFlightProductsByPath.has(path)) {
      inFlightProductsByPath.set(
        path,
        requestProducts(path).finally(() => {
          inFlightProductsByPath.delete(path);
        })
      );
    }

    const payload = await inFlightProductsByPath.get(path);
    const items = Array.isArray(payload?.data)
      ? dedupeProducts(payload.data).filter(hasRealSellerLink)
      : [];
    writeCachedProducts(items);
    lastProductFetchSource = "backend";
    return applyOptions(items, options);
  } catch (error) {
    if (useCacheOnError && cached.length > 0 && isNetworkFailure(error)) {
      lastProductFetchSource = "cache";
      return applyOptions(cached, options);
    }
    throw new Error(error?.message || "Unable to load products");
  }
};

export const fetchProductById = async (id) => {
  const safeId = asId(id);
  if (!safeId) {
    throw new Error("Product not found");
  }

  try {
    const payload = await requestProducts(`/products/${safeId}`);
    const product = normalize(payload?.data || {});
    if (!product?.id) {
      throw new Error("Product not found");
    }

    const cached = readCachedProducts();
    const existsAt = cached.findIndex((item) => asId(item?.id) === product.id);
    if (existsAt >= 0) {
      cached[existsAt] = normalize({ ...cached[existsAt], ...product });
    } else {
      cached.unshift(product);
    }
    writeCachedProducts(cached);

    return product;
  } catch (error) {
    const cached = readCachedProducts();
    const product = cached.find((item) => asId(item.id) === safeId);
    if (product) return normalize(product);
    throw new Error(error?.message || "Product not found");
  }
};
