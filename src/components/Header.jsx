import React from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import cartIcon from "../assets/cart-white.svg";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      text: 'Are you sure you want to log out?',
      title: 'Log Out',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((response) => {
      if (response.isConfirmed) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        navigate('/login');
      }
    });
  };

  return (
    <div className="bg-black text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <img src="Logo.png" alt="Logo" className="w-20 h-15 mr-4" />
        <a href="#" className="text-xl font-bold">
          RentCampy
        </a>
      </div>
      <div className="flex space-x-4">
        <a href="/" className="text-lg hover:text-blue-500 transition duration-300">
          Home
        </a>
        <a href="/chat" className="text-lg hover:text-blue-500 transition duration-300">
          ChatBot
        </a>
        <a href="/Contact" className="text-lg hover:text-blue-500 transition duration-300">
          Contact
        </a>
      </div>
      
      <div className="flex items-center gap-x-4">
        <div className="flex gap-x-4">
          <button onClick={() => navigate("/cart")}>
            <img
              src={cartIcon}
              alt="Cart Icon"
              width={30}
            />
          </button>
        </div>
        {localStorage.getItem('isLoggedIn') ? (
          <div>
            <button onClick={handleLogout} className="bg-[#008170] w-20 h-10 rounded hover:bg-[#008170]">
              Log Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-x-4">
            <button onClick={() => navigate('/login')} className="hover:text-[#008170]">
              Log In
            </button>
            <button onClick={() => navigate('/Register')} className="bg-[#008170] w-20 h-10 rounded hover:bg-[# E6E6FA]">
              Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
