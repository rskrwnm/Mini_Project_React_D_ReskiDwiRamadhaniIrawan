import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../api";
import Header from "./Header";
import DashboardLayout from "./DashboardLayout";
import { clearSession, isAdminUser, isLoggedIn } from "../auth";

const Spinner = () => (
  <div className="flex h-screen items-center justify-center gap-3">
    <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-gray-600"></div>
    <p className="text-2xl text-gray-600">Loading...</p>
  </div>
);

// Halaman publik (Home, Contact, Detail, Cart):
// pengunjung -> Header biasa, user -> sidebar user, admin -> dialihkan ke /admin.
export const PublicLayout = () => {
  if (isAdminUser()) return <Navigate to="/admin" replace />;
  if (isLoggedIn()) return <DashboardLayout role="user" />;
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

// Login & Register: yang sudah login tidak perlu melihatnya lagi.
export const GuestLayout = () => {
  if (isLoggedIn()) return <Navigate to={isAdminUser() ? "/admin" : "/"} replace />;
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

// Halaman admin: role diverifikasi ke server, bukan dipercaya dari localStorage.
// Selama belum terverifikasi, tidak ada isi dashboard yang dirender.
export const AdminLayout = () => {
  const [status, setStatus] = useState("checking"); // checking | ok | user | guest

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!localStorage.getItem("token")) {
        clearSession();
        setStatus("guest");
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        if (cancelled) return;
        localStorage.setItem("user", JSON.stringify(data.user));
        setStatus(data.user.role === "admin" ? "ok" : "user");
      } catch {
        if (cancelled) return;
        clearSession();
        setStatus("guest");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") return <Spinner />;
  if (status === "guest") return <Navigate to="/login" replace />;
  if (status === "user") return <Navigate to="/" replace />;
  return <DashboardLayout role="admin" />;
};
