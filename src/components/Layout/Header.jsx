import React, { useContext, useMemo, useState } from "react";
import { LogOut, HelpCircle } from "lucide-react";
import MainHeader from "./MainHeader";
import HeaderTittle from "./HeaderTittle";
// import Cooperative from "../Home/Cooperative";
import { AppContext } from "../../contexts/AppContext";
import { Link } from "react-router-dom";

function Header() {
  const { handleLogout, isLogin, user } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = useMemo(() => {
    const base = [
      { label: "Home", to: "/" },
      { label: "Shop", to: "/shoppage" },
      { label: "My Orders", to: "/orderpage" },
      { label: "Cart", to: "/cart" },
      { label: "Wishlist", to: "/wishlist" },
    ];
    if (isLogin) {
      base.push({ label: "Messages", to: "/messages" });
    }
    if (user?.roles?.includes("seller")) {
      base.push({ label: "Seller Dashboard", to: "/seller" });
    }
    if (user?.roles?.includes("admin")) {
      base.push({ label: "Admin Console", to: "/admin/dashboard" });
    }
    return base;
  }, [isLogin, user?.roles]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="sticky top-0 z-50">
        {/* Top Bar */}
        <div className="hidden h-9 items-center justify-between bg-orange-700 px-6 md:flex">
          <h4 className="text-white font-bold text-sm">
            🎉 Welcome to Elite MarketPlace !
          </h4>

          <div className="flex gap-6 items-center">
            <Link to="/help" className="text-white hover:underline text-sm flex items-center gap-1">
              <HelpCircle size={14} />
              Help
            </Link>
            <Link to="/orderpage" className="text-white hover:underline text-sm">
              Track Order
            </Link>
            {isLogin ? (
              <span
                onClick={handleLogout}
                className="flex gap-1 items-center cursor-pointer hover:underline text-sm"
              >
                <LogOut className="w-4 text-white" />
                <span className="text-white">Logout</span>
              </span>
            ) : (
              <Link to="/authpage?mode=login" className="text-white hover:underline text-sm">
                Login
              </Link>
            )}
          </div>
        </div>
        <div className="bg-white shadow">
          <MainHeader
            onToggleMenu={() => setMenuOpen((prev) => !prev)}
            isMenuOpen={menuOpen}
          />
        </div>
        <HeaderTittle />
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            role="button"
            tabIndex={-1}
            onClick={closeMenu}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeMenu();
            }}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Menu</p>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
              >
                Close
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-2 py-3">
              {links.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/help"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Help
              </Link>
              {!isLogin ? (
                <>
                  <Link
                    to="/authpage?mode=login"
                    onClick={closeMenu}
                    className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/authpage?mode=register"
                    onClick={closeMenu}
                    className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
