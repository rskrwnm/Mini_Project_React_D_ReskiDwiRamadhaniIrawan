import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getStoredUser } from '../auth';

const CATEGORY_STYLE = {
  Tenda: 'bg-green-100 text-green-700',
  'Alat Tidur': 'bg-blue-100 text-blue-700',
  'Peralatan Masak': 'bg-orange-100 text-orange-700',
};

const formatRupiah = (value) => 'Rp ' + Number(value || 0).toLocaleString('id-ID');

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

  const cards = [
    { label: 'Total Produk', value: stats.totalProducts },
    { label: 'Total User', value: stats.totalUsers },
    ...stats.byCategory.map((c) => ({ label: `Kategori ${c.category}`, value: c.count })),
  ];

  const maxCount = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Ringkasan</h1>
          <p className="text-gray-500">Selamat datang, {user?.email}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Produk per Kategori</h2>
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

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Produk Terbaru</h2>
              <Link
                to="/admin/products"
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                Kelola produk →
              </Link>
            </div>
            {stats.latestProducts.length === 0 ? (
              <p className="text-gray-400">Belum ada produk.</p>
            ) : (
              <ul className="divide-y">
                {stats.latestProducts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    {p.image && (
                      <img src={p.image} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-800">{p.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          CATEGORY_STYLE[p.category[0]] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.category[0]}
                      </span>
                    </div>
                    <p className="whitespace-nowrap text-sm font-medium text-gray-700">
                      {formatRupiah(p.price)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
