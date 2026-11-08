import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
  ChartPieIcon,
  CubeIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  ShoppingCartIcon,
  UsersIcon,
  XIcon,
} from "@heroicons/react/outline";
import { clearSession, getStoredUser } from "../auth";

const ADMIN_MENU = [
  { to: "/admin", label: "Ringkasan", icon: ChartPieIcon, end: true },
  { to: "/admin/products", label: "Kelola Produk", icon: CubeIcon },
  { to: "/admin/users", label: "Kelola User", icon: UsersIcon },
];

const USER_MENU = [
  { to: "/", label: "Katalog", icon: HomeIcon, end: true },
  { to: "/cart", label: "Keranjang", icon: ShoppingCartIcon, badge: true },
];

// Layout sidebar untuk admin dan user yang sudah login.
const DashboardLayout = ({ role }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const cartCount = useSelector((state) => state.cart.items.length);

  const isAdmin = role === "admin";
  const menu = isAdmin ? ADMIN_MENU : USER_MENU;
  const user = getStoredUser();

  const handleLogout = () => {
    Swal.fire({
      text: "Are you sure you want to log out?",
      title: "Log Out",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((response) => {
      if (response.isConfirmed) {
        clearSession();
        navigate("/login");
      }
    });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-emerald-600 text-white shadow"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

  const sidebar = (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-5">
        <img src="/Logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <div>
          <p className="text-lg font-bold leading-tight">RentCampy</p>
          <p className="text-xs text-gray-400">{isAdmin ? "Panel Admin" : "Panel User"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Menu
        </p>
        {menu.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1">{label}</span>
            {badge && cartCount > 0 && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-gray-900">
                {cartCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="mb-3 px-1">
          <p className="truncate text-sm font-medium">{user?.email}</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
              isAdmin ? "bg-amber-400 text-gray-900" : "bg-emerald-500/20 text-emerald-300"
            }`}
          >
            {isAdmin ? "Admin" : "User"}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
        >
          <LogoutIcon className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:sticky md:top-0 md:block md:h-screen md:w-64 md:shrink-0">
        {sidebar}
      </aside>

      {/* Top bar mobile */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white md:hidden">
        <p className="text-lg font-bold">RentCampy</p>
        <button onClick={() => setOpen(true)} aria-label="Buka menu">
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 z-10 text-gray-300"
            >
              <XIcon className="h-6 w-6" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
