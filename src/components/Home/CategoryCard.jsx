import React from 'react'
import { Box } from "lucide-react";


   function CategoryCard({ product }) {
  const { name, Qty } = product; 

  return (
    <div className="bg-slate-100 border hover:border-orange-500 cursor-pointer p-4 md:h-32 rounded-lg flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center mb-2">
        <Box size={18} />
      </div>
      <h1 className="text-black font-bold">{name}</h1>
      <p className="text-gray-500 text-sm">{Qty}</p> 
    </div>
  );
}
export default  CategoryCard
