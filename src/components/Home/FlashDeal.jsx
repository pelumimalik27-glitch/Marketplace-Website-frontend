import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import FlashDealCard from "./FlashDealCard";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchProducts, getCachedProductsSnapshot } from "../../lib/productApi";

const pickFlashProducts = (list = []) =>
  [...list]
    .sort((a, b) => Number(b?.rating || 0) - Number(a?.rating || 0))
    .slice(0, 6);

function FlashDeal() {
  const navigate = useNavigate();
  const [flashProducts, setFlashProducts] = useState(() =>
    pickFlashProducts(getCachedProductsSnapshot({ limit: 24, sort: "-createdAt" }))
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadFlashProducts = async () => {
      try {
        setError("");
        const rows = await fetchProducts({ limit: 24, sort: "-createdAt" });
        if (!mounted) return;
        setFlashProducts(pickFlashProducts(Array.isArray(rows) ? rows : []));
      } catch (err) {
        if (!mounted) return;
        setFlashProducts((current) => (current.length > 0 ? current : []));
        setError(err?.message || "Failed to load flash deals");
      }
    };

    loadFlashProducts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-orange-600 rounded-md h-auto py-10 w-full mt-10 pl-2 pr-2">
      <div className="flex items-center justify-between px-4">
        <div className="flex gap-2">
          <Zap size={30} className="text-yellow-300 font-extrabold text-2xl" />
          <span>
            <h1 className="text-white font-extrabold ">Flash Deals</h1>
            <p className="text-white font-extrabold">Limited time offers</p>
          </span>
        </div>
        <button
          onClick={() => navigate("/shoppage")}
          className="bg-white flex text-orange-700 items-center text-center px-5 rounded-md h-8 mr-2 hover:shadow-md"
        >
          View All <span><ChevronRight size={18} /></span>
        </button>
      </div>
      {error && <p className="mt-4 px-4 text-sm text-orange-100">{error}</p>}
      <div className="flex flex-wrap justify-center gap-4 mt-6 px-4">
        {flashProducts.length > 0 ? (
          flashProducts.map((item) => (
            <FlashDealCard key={item.id} product={item} />
          ))
        ) : (
          <p className="text-center text-white col-span-full font-sans font-bold text-2xl">
            No Product(s) found
          </p>
        )}
      </div>
    </div>
  );
}

export default FlashDeal;
