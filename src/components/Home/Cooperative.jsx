import React, { useContext } from "react";
import { ShoppingCart, Warehouse, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";

function Cooperative() {
  const { user } = useContext(AppContext);
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  if (!user) return null; // hide if not logged in

  return (
    <div className="bg-white rounded-xl border ml-1 shadow-sm shrink">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Account Access
      </h2>

      <ul className="flex flex-wrap ">
        {/* Buyer */}
        {roles.includes("buyer") && (
          <Link to="/orderpage">
            <li className="flex items-center gap-3 px-5 py-3 border rounded-lg hover:bg-gray-50 transition">
              <ShoppingCart size={20} className="text-orange-600" />
              <div>
                <p className="font-medium">My Orders</p>
                <span className="text-sm text-gray-500">
                  Track and manage purchases
                </span>
              </div>
            </li>
          </Link>
        )}

        {/* Seller */}
        {roles.includes("seller") && (
          <Link to="/seller">
            <li className="flex items-center gap-3 px-5 py-3 border rounded-lg hover:bg-gray-50 transition">
              <Warehouse size={20} className="text-black" />
              <div>
                <p className="font-medium">Seller Center</p>
                <span className="text-sm text-gray-500">
                  Manage products & orders
                </span>
              </div>
            </li>
          </Link>
        )}

        {/* Admin */}
        {roles.includes("admin") && (
          <Link to="/admin/dashboard">
            <li className="flex items-center gap-3 px-5 py-3 border rounded-lg hover:bg-gray-50 transition">
              <Shield size={20} className="text-gray-800" />
              <div>
                <p className="font-medium">Admin Console</p>
                <span className="text-sm text-gray-500">
                  Platform control & analytics
                </span>
              </div>
            </li>
          </Link>
        )}
      </ul>
    </div>
  );
}

export default Cooperative;
