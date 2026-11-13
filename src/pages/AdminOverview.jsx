import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getStoredUser } from '../auth';
import StatusBadge from '../components/StatusBadge';
import { formatRupiah, formatTanggal } from '../format';

const Card = ({ label, value, hint, tone = 'text-gray-800', to }) => {
  const body = (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    document.title = 'Ringkasan Admin';
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Gagal memuat statistik.'));
  }, []);

  if (error) {
    return <p className="p-8 text-red-500">{error}</p>;
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-t-4 border-gray-600"></div>
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  const r = stats.rentals;
  const maxCount = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Ringkasan</h1>
            <p className="text-gray-500">Selamat datang, {user?.email}</p>
          </div>
          <Link
            to="/admin/rentals/new"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tambah Penyewaan
          </Link>
        </div>

        {r.terlambat > 0 && (
          <Link
            to="/admin/rentals"
            className="mb-6 block rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 hover:bg-red-100"
          >
            ⚠️ <b>{r.terlambat} penyewaan terlambat</b> dikembalikan. Segera hubungi penyewa.
          </Link>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <Card label="Dibooking" value={r.dibooking} hint="belum diambil" tone="text-blue-700" to="/admin/rentals" />
          <Card label="Sedang disewa" value={r.diambil} hint="sudah diambil" tone="text-amber-700" to="/admin/rentals" />
          <Card label="Terlambat" value={r.terlambat} hint="lewat tanggal kembali" tone={r.terlambat ? 'text-red-600' : 'text-gray-800'} to="/admin/rentals" />
          <Card label="Diambil hari ini" value={r.pickupToday} hint="booking jatuh tempo" />
          <Card label="Kembali hari ini" value={r.returnToday} hint="jadwal pengembalian" />
          <Card label="Pendapatan bulan ini" value={formatRupiah(r.monthRevenue)} hint="sewa + denda + kerusakan" tone="text-emerald-700" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Penyewaan Terbaru</h2>
              <Link to="/admin/rentals" className="text-sm font-medium text-emerald-600 hover:underline">
                Lihat semua →
              </Link>
            </div>
            {stats.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-gray-400">Belum ada penyewaan.</p>
            ) : (
              <ul className="divide-y">
                {stats.recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link to={`/admin/rentals/${o.id}`} className="font-medium text-gray-800 hover:text-blue-700">
                        #{o.id} · {o.customer_name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatTanggal(o.pickup_date)} → {formatTanggal(o.return_date)}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-gray-800">Produk per Kategori</h2>
            <p className="mb-4 text-xs text-gray-400">
              {stats.totalProducts} produk · {stats.totalAdmins} admin
            </p>
            {stats.byCategory.length === 0 ? (
              <p className="text-gray-400">Belum ada produk.</p>
            ) : (
              <div className="space-y-4">
                {stats.byCategory.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-700">{c.category}</span>
                      <span className="font-medium text-gray-800">{c.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100">
                      <div
                        className="h-2.5 rounded-full bg-emerald-500"
                        style={{ width: `${(c.count / maxCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
