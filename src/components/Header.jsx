import React from 'react';
import { Link, NavLink } from 'react-router-dom';

// Header halaman publik. Pelanggan tidak punya akun; hanya admin yang login.
const Header = () => {
  const linkClass = ({ isActive }) =>
    `text-lg transition duration-300 hover:text-emerald-400 ${isActive ? 'text-emerald-400' : ''}`;

  return (
    <div className="bg-black text-white p-4 flex justify-between items-center">
      <Link to="/" className="flex items-center">
        <img src="/Logo.png" alt="Logo" className="w-20 h-15 mr-4" />
        <span className="text-xl font-bold">RentCampy</span>
      </Link>

      <div className="flex space-x-6">
        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/Contact" className={linkClass}>
          Contact
        </NavLink>
      </div>

      <Link
        to="/login"
        className="rounded border border-white/40 px-4 py-2 text-sm transition hover:bg-white hover:text-black"
      >
        Login Admin
      </Link>
    </div>
  );
};

export default Header;
