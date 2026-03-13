import { useContext, useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { AppContext } from "../../../src/contexts/AppContext";
import {
  fetchProducts,
  getCachedProductsSnapshot,
  getLastProductFetchSource,
} from "../../lib/productApi";

function ProductData() {
  const { searchTerm } = useContext(AppContext);
  const initialProducts = useMemo(() => getCachedProductsSnapshot(), []);
  const hasInitialProducts = initialProducts.length > 0;
  const [products, setProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(!hasInitialProducts);
  const [loadError, setLoadError] = useState("");
  const [source, setSource] = useState(() => (hasInitialProducts ? "cache" : "backend"));

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        if (!hasInitialProducts) {
          setIsLoading(true);
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
        if (mounted) setIsLoading(false);
      }
    };

    loadProducts();
    return () => {
      mounted = false;
    };
  }, [hasInitialProducts]);

  const filteredProducts = useMemo(() => {
    const keyword = String(searchTerm || "").toLowerCase();
    if (!keyword) return products;

    return products.filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      const category = String(item?.category || "").toLowerCase();
      return name.includes(keyword) || category.includes(keyword);
    });
  }, [products, searchTerm]);

  return (
    <div className="mt-12">
      <h1 className="font-bold text-xl">Top Selling Products</h1>
      {source === "cache" ? (
        <p className="text-yellow-600 text-sm">Showing cached products (offline mode)</p>
      ) : (
        <p className="text-green-600 text-sm">Loaded from server</p>
      )}

      {isLoading && <p>Loading...</p>}
      {!isLoading && loadError && <p className="text-red-600 text-sm">{loadError}</p>}
      {!isLoading && !loadError && filteredProducts.length === 0 && (
        <p className="text-sm text-slate-600">No products available.</p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductData;
