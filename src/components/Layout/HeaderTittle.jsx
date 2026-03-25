import React from "react";
import { House, Box, NotepadText, Flame } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/shoppage", label: "All Products", icon: Box },
  { to: "/orderpage", label: "My Orders", icon: NotepadText },
];

function HeaderTittle() {
  return (
    <div className="sticky top-0 z-10 hidden h-14 bg-gray-800 md:block">
      <div className="flex h-full items-center justify-between px-6">
        <ul className="flex items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                      isActive
                        ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                        : "text-white hover:bg-gray-700 hover:text-orange-300"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="ml-1 h-2 w-2 rounded-full bg-orange-500"
                        />
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <p className="flex items-center gap-1 font-bold text-orange-700">
          <Flame size={16} /> Flash Sales
        </p>
      </div>
    </div>
  );
}

export default HeaderTittle;
