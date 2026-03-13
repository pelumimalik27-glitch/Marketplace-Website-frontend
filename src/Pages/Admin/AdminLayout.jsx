import React, { useContext, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import { Menu, X } from "lucide-react";

function AdminLayout() {
  const { user, handleLogout } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      <div className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Admin Console</p>
            <p className="text-xs text-slate-500">{user?.name || "Admin"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Store
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 max-w-[85vw] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Admin Menu</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md border border-slate-200 p-1 text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-2 py-3">
              <Link
                to="/admin/dashboard"
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  location.pathname === "/admin/dashboard"
                    ? "bg-orange-50 text-orange-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-5 md:px-6">
        <aside className="hidden w-52 rounded-xl border bg-white p-2 md:block">
          <Link
            to="/admin/dashboard"
            className={`block rounded-lg px-3 py-2 text-sm ${
              location.pathname === "/admin/dashboard"
                ? "bg-orange-50 text-orange-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Dashboard
          </Link>
        </aside>
        <main className="min-w-0 flex-1 rounded-xl border bg-white p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
