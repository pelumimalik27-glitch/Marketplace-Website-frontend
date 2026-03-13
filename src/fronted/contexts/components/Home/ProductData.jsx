import products from "../Data/Product";
import ProductCard from "./ProductCard";
import { useContext } from "react";
import { AppContext } from "../../AppContext";

function ProductData() {
  const { searchTerm } = useContext(AppContext);
 const filteredProduct = products.filter((item) => 
  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.category.toLowerCase().includes(searchTerm.toLowerCase())
);
  
  return (
    <div className="mt-12">
      <h1 className="text-black font-extrabold text-xl mb-1">Top Selling Product</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProduct.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export default ProductData