// ...existing code...
import React, { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  MessageSquare,
  DollarSign,
  Users,
  LogOut,
  Store,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { AppContext } from "../../contexts/AppContext";
import { fetchMySellerProfile } from "../../lib/sellerApi";

function SellerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleLogout, user } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sellerProfile, setSellerProfile] = useState(null);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const original = document.body.style.overflow;
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original || "";
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const profile = await fetchMySellerProfile(user?.userId);
        if (active) setSellerProfile(profile);
      } catch (_) {
        if (active) setSellerProfile(null);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [user?.userId]);

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const nextProfile = event?.detail || null;
      if (nextProfile && nextProfile._id) {
        setSellerProfile(nextProfile);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("seller-profile-updated", handleProfileUpdate);
      return () => window.removeEventListener("seller-profile-updated", handleProfileUpdate);
    }
    return undefined;
  }, []);

  function handleSellerLogout() {
    handleLogout();
    navigate("/");
  }

  const navItems = [
    { path: "/seller", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/seller/products", icon: Package, label: "Products" },
    { path: "/seller/orders", icon: ShoppingBag, label: "Orders" },
    { path: "/seller/messages", icon: MessageSquare, label: "Messages" },
    { path: "/seller/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/seller/customers", icon: Users, label: "Customers" },
    { path: "/seller/payouts", icon: DollarSign, label: "Wallet" },
    { path: "/seller/settings", icon: Settings, label: "Settings" },
    { icon: LogOut, label: "Logout", action: handleSellerLogout },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-orange-500 via-orange-50/40 to-white">
      <header className="flex-none border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 py-3 md:px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            {sellerProfile?.storeLogo ? (
              <img
                src={sellerProfile.storeLogo}
                alt={sellerProfile.storeName || "Store logo"}
                className="h-9 w-9 rounded-lg object-cover ring-1 ring-orange-200"
              />
            ) : (
              <div className="rounded-lg bg-orange-100 p-2">
                <Store size={18} className="text-orange-700" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">Seller Workspace</p>
              <p className="text-xs text-slate-500">
                {sellerProfile?.storeName || user?.name || "Seller"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <ArrowLeft size={16} />
              Store
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-slate-900 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <p className="text-sm font-semibold">Seller Menu</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md border border-slate-700 p-1 text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-2 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.path ? isActive(item.path) : false;
                if (item.path) {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                        active ? "bg-orange-500 text-white" : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      item.action?.();
                    }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-red-300 hover:bg-slate-800 hover:text-red-200"
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <aside
          aria-label="Seller navigation"
          className="hidden md:flex flex-none w-72 flex-col bg-slate-900 p-3 text-slate-100 shadow-lg"
        >
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Navigation</p>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2" role="navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.path ? isActive(item.path) : false;
              if (item.path) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                      active
                        ? "bg-orange-500 text-white shadow"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              }
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.action?.()}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-red-300 transition-colors hover:bg-slate-800 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-400">Account</p>
            <div className="mt-2 flex items-center gap-3">
              {sellerProfile?.storeLogo ? (
                <img
                  src={sellerProfile.storeLogo}
                  alt={sellerProfile.storeName || "Store logo"}
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-600"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-700" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {sellerProfile?.storeName || user?.name || "Seller"}
                </div>
                <div className="text-xs text-slate-400 truncate">{user?.email || ""}</div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default SellerLayout;
