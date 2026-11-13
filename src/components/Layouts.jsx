import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../api";
import Header from "./Header";
import DashboardLayout from "./DashboardLayout";
import { clearSession, isLoggedIn } from "../auth";

const Spinner = () => (
  <div className="flex h-screen items-center justify-center gap-3">
    <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-gray-600"></div>
    <p className="text-2xl text-gray-600">Loading...</p>
  </div>
);

// Halaman publik (etalase): header biasa untuk semua pengunjung.
export const PublicLayout = () => (
  <>
    <Header />
    <Outlet />
  </>
);

// Halaman login: admin yang sudah login langsung diarahkan ke dashboard.
export const GuestLayout = () => {
  if (isLoggedIn()) return <Navigate to="/admin" replace />;
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

// Halaman admin: sesi diverifikasi ke server, bukan dipercaya dari localStorage.
// Selama belum terverifikasi, tidak ada isi dashboard yang dirender.
export const AdminLayout = () => {
  const [status, setStatus] = useState("checking"); // checking | ok | guest

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
        setStatus("ok");
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
  return <DashboardLayout />;
};
