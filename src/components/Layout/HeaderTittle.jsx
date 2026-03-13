import React from 'react'
import { House } from 'lucide-react';
import { Box } from "lucide-react";
import { NotepadText } from 'lucide-react';
import { Flame } from "lucide-react";
import { Link } from 'react-router-dom';



function HeaderTittle() {
  return (
    <div className="hidden h-14 bg-gray-800 sticky top-0 z-10 md:block">
      <div className="flex justify-between items-center h-full px-6">
        <ul className="flex items-center gap-10">
        <Link to= "/">
         <li className="text-orange-700 font-bold flex items-center gap-1">
            <House size={16} /> Home
          </li>
        </Link>

       <Link to= "/shoppage">
          <li className="flex text-white font-bold hover:text-orange-700 items-center gap-1">
            <Box size={16} /> All Products
          </li>
       </Link>

        <Link to="/orderpage">
          <li className="flex text-white font-bold hover:text-orange-700 items-center gap-1">
            <NotepadText size={16} /> My Orders
          </li>
        </Link>
        </ul>

        <p className="flex items-center text-orange-700 font-bold gap-1">
          <Flame size={16} /> Flash Sales
        </p>
      </div>
    </div>
  );
}
export default HeaderTittle
