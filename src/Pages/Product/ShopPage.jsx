import React, { useContext, useEffect, useMemo, useState } from "react";
import FilterPanel from "../../components/Products/FilterPanel";
import SortBar from "../../components/Products/SortBar";
import ProductCard from "../../components/Home/ProductCard";
import { AppContext } from "../../contexts/AppContext";
import { fetchProductById, fetchProducts, getCachedProductsSnapshot, subscribeProductUpdates } from "../../lib/productApi";

const MAX_PRICE = 1000000;


function ShopPage() {
  const initialProducts = useMemo(() => getCachedProductsSnapshot({ sort: "-createdAt" }), []);
  const hasInitialProducts = initialProducts.length > 0;
  const [products, setProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(!hasInitialProducts);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    category: "All",
    price: MAX_PRICE,
    freeShipping: false,
    inStock: false,
    rating: 0,
    search: "",
    sort: "relevant",
  });
  const { addToCart } = useContext(AppContext);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        if (!hasInitialProducts) {
          setIsLoading(true);
        }
        setError("");
        const rows = await fetchProducts({ sort: "-createdAt" });
        if (!mounted) return;
        setProducts(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!mounted) return;
        setProducts([]);
        setError(err?.message || "Failed to load products");
      } finally {
        if (mounted) setIsLoading(false);
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

  const isProductInStock = (product) => {
    const stockQty = Number(product?.inventory?.quantity ?? 0);
    const rawInStock =
      typeof product?.inStock === "boolean" ? product.inStock : stockQty > 0;
    return rawInStock && stockQty > 0;
  };

  const filteredProduct = useMemo(
    () =>
      products
        .filter((p) => filter.category === "All" || p.category === filter.category)
        .filter((p) => Number(p.price || 0) <= Number(filter.price || 0))
        .filter((p) => !filter.freeShipping || p.freeShipping)
        .filter((p) => !filter.inStock || isProductInStock(p))
        .filter((p) => Number(p.rating || 0) >= Number(filter.rating || 0))
        .filter((p) =>
          String(p.name || "")
            .toLowerCase()
            .includes(String(filter.search || "").toLowerCase())
        )
        .sort((a, b) => {
          if (filter.sort === "low") return Number(a.price || 0) - Number(b.price || 0);
          if (filter.sort === "high") return Number(b.price || 0) - Number(a.price || 0);
          return 0;
        }),
    [products, filter]
  );

  return (
    <div className="flex flex-col gap-6 mt-6 lg:flex-row">
      <FilterPanel filter={filter} setFilter={setFilter} />
      <div className="flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SortBar filter={filter} setFilter={setFilter} />
        </div>
        {isLoading && <p className="mt-4 text-sm text-gray-500">Loading products...</p>}
        {error && !isLoading && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {!isLoading && !error && filteredProduct.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">No products match your filters.</p>
        )}
        <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProduct.map((p) => (
            <ProductCard key={p.id} product={p} addToCart={addToCart} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShopPage;
