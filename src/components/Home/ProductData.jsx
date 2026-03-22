import { useContext, useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import {
  LoadingPill,
  LoadingSpinner,
  ProductGridSkeleton,
} from "../Loading/StorefrontLoaders";
import { AppContext } from "../../contexts/AppContext";
import {
  fetchProductById,
  fetchProducts,
  getCachedProductsSnapshot,
  getLastProductFetchSource,
  subscribeProductUpdates,
} from "../../lib/productApi";

function ProductData() {
  const { searchTerm } = useContext(AppContext);
  const initialProducts = useMemo(() => getCachedProductsSnapshot(), []);
  const hasInitialProducts = initialProducts.length > 0;
  const [products, setProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(!hasInitialProducts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [source, setSource] = useState(() => (hasInitialProducts ? "cache" : "backend"));
  const [hasFetchedOnce, setHasFetchedOnce] = useState(hasInitialProducts);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        if (!hasInitialProducts) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setLoadError("");

        const rows = await fetchProducts({ useCacheOnError: true });
        if (!mounted) return;
        setProducts(Array.isArray(rows) ? rows : []);
        setSource(getLastProductFetchSource());
      } catch (error) {
        if (!mounted) return;
        setProducts([]);
        setLoadError(error?.message || "Unable to load products from server.");
        setSource("backend");
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsRefreshing(false);
          setHasFetchedOnce(true);
        }
      }
    };

    loadProducts();
    return () => {
      mounted = false;
    };
  }, [hasInitialProducts]);

  useEffect(() => {
    return subscribeProductUpdates(async ({ productId } = {}) => {
      if (!productId) return;
      try {
        const updated = await fetchProductById(productId);
        setProducts((prev) =>
          prev.map((item) =>
            String(item?.id || item?._id) === String(updated?.id || updated?._id)
              ? { ...item, ...updated }
              : item
          )
        );
      } catch (_) {
        // ignore refresh failures
      }
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = String(searchTerm || "").toLowerCase();
    if (!keyword) return products;

    return products.filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      const category = String(item?.category || "").toLowerCase();
      return name.includes(keyword) || category.includes(keyword);
    });
  }, [products, searchTerm]);

  const showLoadingState =
    isLoading || ((!hasFetchedOnce || isRefreshing) && products.length === 0);

  return (
    <div className="mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-xl">Top Selling Products</h1>
          {!showLoadingState &&
            products.length > 0 &&
            (source === "cache" ? (
              <p className="text-sm text-yellow-600">Showing cached products while the network catches up.</p>
            ) : (
              <p className="text-sm text-green-600">Loaded from server</p>
            ))}
        </div>
        {isRefreshing && products.length > 0 && (
          <LoadingPill label="Updating products..." />
        )}
      </div>

      {showLoadingState && (
        <div className="mt-4 space-y-4">
          <LoadingSpinner
            label="Loading products"
            caption="Please wait while products are fetched from the server."
            className="min-h-[180px] rounded-xl border bg-white"
          />
          <ProductGridSkeleton count={8} />
        </div>
      )}
      {!showLoadingState && loadError && <p className="text-red-600 text-sm">{loadError}</p>}
      {!showLoadingState && !loadError && filteredProducts.length === 0 && (
        <p className="text-sm text-slate-600">No products available.</p>
      )}

      {!showLoadingState && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductData;
