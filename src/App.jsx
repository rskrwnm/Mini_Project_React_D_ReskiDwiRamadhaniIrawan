import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout, GuestLayout, PublicLayout } from './components/Layouts';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Admin from './pages/Admin';
import AdminOverview from './pages/AdminOverview';
import AdminUsers from './pages/AdminUsers';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Cart from './pages/Cart';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pengunjung: header biasa. User login: sidebar user. */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/productdetail/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/Contact" element={<Contact />} />
        </Route>

        {/* Hanya untuk yang belum login */}
        <Route element={<GuestLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
        </Route>

        {/* Admin: sidebar admin, diverifikasi ke server */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="products" element={<Admin />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
