import React from "react";
import { useNavigate } from "react-router-dom";
import { formatNaira } from "../../lib/currency";

function FlashDealCard({ product }) {
  const navigate = useNavigate();
  const image = product?.image || product?.imgUrl || "";
  const name = product?.name || "Product";
  const price = Number(product?.price || 0);
  const productId = product?.id;
  
  return (
    <div
      onClick={() => productId && navigate(`/product/${productId}`)}
      className="bg-white border rounded-xl shadow-xl hover:shadow-2xl duration-200 hover:-translate-y-1 w-full max-w-[180px] h-auto py-4 px-3 cursor-pointer"
    >
      <img 
        src={image} 
        alt={name} 
        className="w-full h-40 object-cover rounded-lg mb-3" 
      />
      <h1 className="text-sm font-semibold text-gray-900 line-clamp-2">{name}</h1>
      <p className="text-lg text-orange-700 font-bold mt-2">{formatNaira(price)}</p>
    </div>
  );
}

export default FlashDealCard;
