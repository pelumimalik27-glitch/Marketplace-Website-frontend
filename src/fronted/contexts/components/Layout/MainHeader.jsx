import React, { useContext } from 'react'
import { Search, User, Heart, ShoppingCart } from "lucide-react";
import Logo from './Logo';
import { AppContext } from '../../AppContext';
import { Link } from 'react-router-dom';
import Cooperative from "../Home/Cooperative";

function MainHeader() {
  const { username, cart, searchTerm, handleSearch, searchRef,isLogin } = useContext(AppContext);
  
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const  showUserName = ()=>{
     if (!isLogin) {
      navigate("/authpage", {
        state: { 
          redirectTo: `/product/${product.id}`, 
          message: "Please login to add items to cart" 
        }
      });
      return;
    }
  }

  return (
    <div className='flex gap-3 items-center bg-white p-2'>
      <Logo />
      
      <div className='flex-1 flex items-center'>
        <div className='relative w-full max-w-2xl'>
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            ref={searchRef}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
            type="text"
            placeholder='Search for products, brands and categories...'
          />
        </div>
        <Link to='/shoppage'>
          <button className='bg-orange-700 text-white px-6 py-2 rounded-r-lg hover:bg-orange-800 transition'>
            SEARCH
          </button>
        </Link>
      </div>
      {/* <div>
         <Cooperative/>
      </div> */}
      
      <div className='flex items-center gap-6'>
        <div className='flex items-center gap-2 cursor-pointer hover:text-orange-600'>
          <User size={24} />
          <div className='flex flex-col'>
            <p className='text-gray-500 text-sm'>Hello,</p>
            <suserpan onChange={()=> showUserName(username)} className='text-black font-medium'>  {'User' || username}</suserpan>
          </div>
        </div>
        
        <Link to="/wishlist">
          <Heart className="cursor-pointer hover:text-orange-600" />
        </Link>
        
        <Link to="/cart" className="relative">
          <ShoppingCart className="text-orange-700 cursor-pointer hover:text-orange-800" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

export default MainHeader;