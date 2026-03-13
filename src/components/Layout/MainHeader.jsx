import React, { useContext } from "react";
import { Search, User, Heart, ShoppingCart, MessageSquare, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { AppContext } from "../../contexts/AppContext";

function MainHeader({ onToggleMenu, isMenuOpen }) {
  const { cart, searchTerm, handleSearch, searchRef, user, isLogin, unreadMessages } =
    useContext(AppContext);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const displayName =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "User";
 

  const handleToggle = () => {
    if (typeof onToggleMenu === "function") {
      onToggleMenu();
    }
  };

  return (
    <div className="bg-white p-3 sm:p-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center justify-between lg:justify-start lg:gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggle}
              aria-label="Toggle menu"
              aria-expanded={Boolean(isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Logo />
          </div>
          <div className="flex items-center gap-4 lg:hidden">
            {isLogin && (
              <Link to="/messages" className="relative">
                <MessageSquare className="cursor-pointer hover:text-orange-600" size={20} />
                {unreadMessages > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-xs text-white">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            )}
            <Link to="/wishlist">
              <Heart className="cursor-pointer hover:text-orange-600" size={20} />
            </Link>
            <Link to="/cart" className="relative">
              <ShoppingCart className="cursor-pointer text-orange-700 hover:text-orange-800" size={20} />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-1 items-center">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              ref={searchRef}
              className="w-full rounded-l-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:pl-10 sm:pr-4"
              type="text"
              placeholder="Search products, brands and categories..."
            />
          </div>
          <Link to="/shoppage">
            <button className="rounded-r-lg bg-orange-700 px-3 py-2 text-xs text-white transition hover:bg-orange-800 sm:px-6 sm:text-sm">
              SEARCH
            </button>
          </Link>
        </div>

        <div className="hidden items-center gap-6 lg:flex">
          {isLogin ? (
            <div className="flex items-center gap-2 cursor-default">
              <User size={24} />
              <div className="flex flex-col">
                <p className="text-sm text-gray-500">Hello,</p>
                <span className="font-medium text-black">{displayName}</span>
              </div>
            </div>
          ) : (
            <Link to="/authpage?mode=login" className="flex items-center gap-2 hover:text-orange-600">
              <User size={24} />
              <div className="flex flex-col">
                <p className="text-sm text-gray-500">Hello,</p>
                <span className="font-medium text-black">Sign In</span>
              </div>
            </Link>
          )}

          {isLogin && (
            <Link to="/messages" className="relative">
              <MessageSquare className="cursor-pointer hover:text-orange-600" />
              {unreadMessages > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-xs text-white">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </Link>
          )}

          <Link to="/wishlist">
            <Heart className="cursor-pointer hover:text-orange-600" />
          </Link>

          <Link to="/cart" className="relative">
            <ShoppingCart className="cursor-pointer text-orange-700 hover:text-orange-800" />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MainHeader;
