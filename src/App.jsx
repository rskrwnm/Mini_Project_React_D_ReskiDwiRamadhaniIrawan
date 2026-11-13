import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, GuestLayout, PublicLayout } from './components/Layouts';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminOverview from './pages/AdminOverview';
import Admin from './pages/Admin';
import AdminAdmins from './pages/AdminAdmins';
import AdminSettings from './pages/AdminSettings';
import AdminRentals from './pages/AdminRentals';
import AdminRentalForm from './pages/AdminRentalForm';
import AdminRentalDetail from './pages/AdminRentalDetail';
import AdminCalendar from './pages/AdminCalendar';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Etalase publik, tanpa login */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/productdetail/:id" element={<ProductDetails />} />
          <Route path="/Contact" element={<Contact />} />
        </Route>

        {/* Login khusus admin */}
        <Route element={<GuestLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Dashboard admin: sesi diverifikasi ke server */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="rentals" element={<AdminRentals />} />
          <Route path="rentals/new" element={<AdminRentalForm />} />
          <Route path="rentals/:id" element={<AdminRentalDetail />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="products" element={<Admin />} />
          <Route path="admins" element={<AdminAdmins />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Halaman lama (register, cart, dll) dan alamat tidak dikenal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
