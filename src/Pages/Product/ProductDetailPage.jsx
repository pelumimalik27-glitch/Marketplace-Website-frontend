import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Truck, Shield, ChevronLeft, Heart } from "lucide-react";
import { AppContext } from "../../contexts/AppContext";
import { fetchProductById, fetchProducts, subscribeProductUpdates } from "../../lib/productApi";
import { formatNaira } from "../../lib/currency";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity, isLogin } = useContext(AppContext);
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!isLogin) {
      navigate("/authpage?mode=login", {
        state: {
          redirectTo: `/product/${id}`,
          mode: "login",
          message: "Please login to view product details",
        },
      });
    }
  }, [isLogin, id, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadProductData = async () => {
      if (!isLogin || !id) return;

      try {
        setIsLoading(true);
        setError("");

        const [productData, listData] = await Promise.all([
          fetchProductById(id),
          fetchProducts({ limit: 200, sort: "-createdAt" }),
        ]);

        if (!isMounted) return;
        setProduct(productData);
        setAllProducts(listData);
      } catch (err) {
        if (isMounted) setError(err.message || "Unable to load product");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProductData();
    return () => {
      isMounted = false;
    };
  }, [id, isLogin]);

  useEffect(() => {
    if (!product?.id) return undefined;
    return subscribeProductUpdates(async ({ productId } = {}) => {
      if (!productId || String(productId) !== String(product.id)) return;
      try {
        const fresh = await fetchProductById(product.id);
        setProduct(fresh);
      } catch (_) {
        // ignore refresh failures
      }
    });
  }, [product?.id]);

  if (!isLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Failed to load product</h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button onClick={() => navigate("/shoppage")} className="mt-4 rounded-lg bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">
          Continue Shopping
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Product not found</h2>
        <button onClick={() => navigate("/shoppage")} className="mt-4 rounded-lg bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">
          Continue Shopping
        </button>
      </div>
    );
  }

  const cartItem = cart.find((item) => item.id === product.id && item.sellerId === (product.sellerId || "unknown-seller"));
  const cartQuantity = cartItem ? cartItem.qty : 0;
  const productImages = product.images?.length ? product.images : [product.image];
  const displayedImage = productImages[selectedImage] || product.image;
  const sellerDisplayName = String(product.sellerName || product.seller || "").trim();
  const sellerRating = Number(product.rating || 0);
  const sellerReviews = Number(product.reviews || 0);
  const stockQty = Number(product?.inventory?.quantity ?? 0);
  const rawInStock =
    typeof product?.inStock === "boolean" ? product.inStock : stockQty > 0;
  const isInStock = rawInStock && stockQty > 0;
  const hasReachedStockLimit = cartItem && stockQty > 0 && cartItem.qty >= stockQty;

  const similarProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 sm:text-base">
        <ChevronLeft size={20} />
        Back to Products
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-3 shadow-lg sm:p-4">
            <img src={displayedImage} alt={product.name} className="h-64 w-full rounded-lg object-contain sm:h-96" />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {productImages.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                  selectedImage === idx ? "border-orange-500" : "border-gray-300"
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name || "Product"} image ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-sm text-gray-500">{product.category}</span>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(product.rating) ? "fill-orange-500 text-orange-500" : "text-gray-300"}
                  />
                ))}
                <span className="ml-2 text-gray-600">({product.reviews} reviews)</span>
              </div>
              <span className={`font-semibold ${isInStock ? "text-green-600" : "text-red-600"}`}>
                {isInStock ? `In Stock (${stockQty})` : "Out of Stock"}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-bold text-orange-600 sm:text-4xl">{formatNaira(product.price)}</span>
              {product.originalPrice && <span className="ml-2 text-xl text-gray-500 line-through">{formatNaira(product.originalPrice)}</span>}
            </div>

            <div className="mt-6 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <Truck size={18} />
                <span>{product.freeShipping ? "Free Shipping" : `Shipping: ${formatNaira(9.99)}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={18} />
                <span>30-Day Return Policy</span>
              </div>
            </div>

            {cartQuantity > 0 && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="font-medium text-blue-700">Already in cart: {cartQuantity} item{cartQuantity > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Sold by: {sellerDisplayName || "Seller details unavailable"}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.floor(sellerRating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {sellerReviews > 0
                      ? `${sellerRating.toFixed(1)} (${sellerReviews} reviews)`
                      : "No reviews yet"}
                  </span>
                </div>
              </div>
              <button className="font-medium text-orange-600 hover:text-orange-700">Visit Store</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center rounded-lg border">
                <button
                  onClick={() => {
                    if (cartItem) updateQuantity(product.id, cartItem.qty - 1);
                  }}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={!cartItem}
                >
                  -
                </button>
                <span className="border-x px-4 py-2">{cartItem ? cartItem.qty : 0}</span>
                <button
                  onClick={() => {
                    if (!isInStock) return;
                    if (cartItem) updateQuantity(product.id, cartItem.qty + 1);
                    else addToCart(product, 1, product.sellerId || "unknown-seller");
                  }}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={!isInStock || hasReachedStockLimit}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                onClick={() => {
                  if (!isInStock) return;
                  addToCart(product, 1, product.sellerId || "unknown-seller");
                }}
                disabled={!isInStock}
                className={`flex-1 rounded-lg py-3 font-medium text-white ${
                  isInStock
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "cursor-not-allowed bg-gray-300"
                }`}
              >
                {isInStock
                  ? cartQuantity > 0
                    ? "Add More to Cart"
                    : "Add to Cart"
                  : "Out of Stock"}
              </button>
              <button className="rounded-lg border-2 border-orange-600 p-3 text-orange-600 hover:bg-orange-50">
                <Heart size={24} />
              </button>
            </div>

            <button
              onClick={async () => {
                if (!isInStock) return;
                if (cartQuantity === 0) {
                  await addToCart(product, 1, product.sellerId || "unknown-seller");
                }
                navigate("/cart");
              }}
              disabled={!isInStock}
              className={`w-full rounded-lg py-3 font-medium text-white ${
                isInStock ? "bg-black hover:bg-gray-800" : "cursor-not-allowed bg-gray-300"
              }`}
            >
              Buy Now
            </button>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-xl font-bold">Description</h3>
            <p className="text-gray-600">
              {product.description || "No description available. This is a high-quality product from a trusted seller."}
            </p>
          </div>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className="mt-14 sm:mt-16">
          <h2 className="mb-6 text-xl font-bold sm:text-2xl">Similar Products</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {similarProducts.map((p) => (
              <div key={p.id} className="rounded-xl bg-white p-4 shadow transition hover:shadow-xl">
                <img src={p.image} alt={p.name} className="h-44 w-full rounded-lg object-cover" />
                <h3 className="mt-3 font-semibold">{p.name}</h3>
                <p className="font-bold text-orange-600">{formatNaira(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;
