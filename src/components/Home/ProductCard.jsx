import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import { useContext } from "react";
import { formatNaira } from "../../lib/currency";

export default function ProductCard({ product }) {
  const { addToCart, isLogin } = useContext(AppContext);
  const navigate = useNavigate();
  const stockQty = Number(product?.inventory?.quantity ?? 0);
  const rawInStock =
    typeof product?.inStock === "boolean" ? product.inStock : stockQty > 0;
  const isInStock = rawInStock && stockQty > 0;

  const handleProductClick = () => {
    if (!isLogin) {
      navigate("/authpage?mode=login", {
        state: { 
          redirectTo: `/product/${product.id}`, // Fixed: redirectTo not redirectaTo
          mode: "login",
          message: "Please login to view product details" 
        }
      });
      return;
    }
    navigate(`/product/${product.id}`); // Only navigate to product if logged in
  };

  const handleAddToCart = () => {
    if (!isInStock) return;
    if (!isLogin) {
      navigate("/authpage?mode=login", {
        state: { 
          redirectTo: `/product/${product.id}`, // Fixed: redirectTo not redirectaTo
          mode: "login",
          message: "Please login to add items to cart" 
        }
      });
      return;
    }
    addToCart(product, 1, product.sellerId || "unknown-seller");
  };

  return (
    <div
      onClick={handleProductClick}
      className="bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden mt-5 cursor-pointer"
    >
      <div className="relative">
        <img src={product.image} className="w-full h-56 object-cover" />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1 text-orange-500 text-sm">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < product.rating ? "#f97316" : "none"} />
          ))}
          <span className="text-gray-400">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-orange-600 text-xl font-bold">{formatNaira(product.price)}</span>
          {product.freeShipping && (
            <span className="border px-2 py-1 rounded-full text-xs">Free Shipping</span>
          )}
        </div>
        <p className={`text-sm ${isInStock ? "text-emerald-600" : "text-red-600"}`}>
          {isInStock ? `In stock (${stockQty})` : "Out of stock"}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          disabled={!isInStock}
          className={`w-full mt-3 py-2 rounded-full text-white ${
            isInStock
              ? "bg-orange-600 hover:bg-orange-700"
              : "cursor-not-allowed bg-gray-300"
          }`}
        >
          {isInStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
