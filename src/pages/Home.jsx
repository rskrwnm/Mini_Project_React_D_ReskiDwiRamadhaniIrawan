import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { fetchWaNumber, openWhatsApp } from '../wa';

import Card from '../components/Card';

const FEATURES = [
  { icon: '💰', title: 'Harga Terjangkau', text: 'Sewa per hari dengan harga bersahabat untuk kantong mahasiswa.' },
  { icon: '✅', title: 'Kualitas Terjamin', text: 'Semua perlengkapan dicek dan dirawat sebelum disewakan.' },
  { icon: '💬', title: 'Sewa Lewat WhatsApp', text: 'Pilih alat, klik tombol WhatsApp, dan admin kami siap membantu.' },
];

const Home = () => {
  const navigate = useNavigate();
  const productsRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [waNumber, setWaNumber] = useState('');

  useEffect(() => {
    document.title = 'RentCampy - Sewa Perlengkapan Camping';

    api
      .get('/products')
      .then((res) => setProducts(res.data))
      .catch((error) => console.error('Error fetching data:', error))
      .finally(() => setLoading(false));

    fetchWaNumber().then(setWaNumber);
  }, []);

  const keyword = search.trim().toLowerCase();
  const visibleProducts = keyword
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.description?.toLowerCase().includes(keyword) ||
          p.category.some((c) => c.toLowerCase().includes(keyword))
      )
    : products;

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white">
        <div className="container mx-auto flex flex-col items-center gap-8 px-6 py-16 md:flex-row md:py-24">
          <div className="md:w-1/2">
            <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium">
              ⛺ Sewa Perlengkapan Camping
            </span>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-6xl">
              Selamat Datang di <span className="text-amber-300">RentCampy</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-emerald-50">
              Temukan perlengkapan camping berkualitas dengan harga terjangkau.
              Petualanganmu dimulai dari sini.
            </p>
            <button
              onClick={() => productsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full bg-amber-400 px-7 py-3 font-semibold text-gray-900 shadow-lg transition hover:bg-amber-300"
            >
              Lihat Produk
            </button>
          </div>
          <div className="flex justify-center md:w-1/2">
            <img
              src="welcome-image.png"
              alt="Welcome"
              className="w-full max-w-md drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section className="container mx-auto -mt-10 px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-1 text-lg font-semibold text-gray-800">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Produk */}
      <section ref={productsRef} className="container mx-auto scroll-mt-4 px-6 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800">Produk Kami</h2>
          <p className="mt-1 text-gray-500">Pilih perlengkapan sesuai kebutuhan campingmu</p>
        </div>

        <div className="mx-auto mb-8 max-w-xl">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, misalnya tenda atau kompor..."
              className="w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-12 text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl leading-none text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-t-4 border-emerald-600"></div>
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        ) : visibleProducts.length === 0 ? (
          <p className="py-20 text-center text-gray-400">
            {keyword ? `Produk "${search.trim()}" tidak ditemukan.` : 'Belum ada produk.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <Card
                key={product.id}
                product={product}
                onDetail={() => navigate(`/productdetail/${product.id}`)}
                onWhatsApp={() => openWhatsApp(waNumber, product)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="bg-gray-900 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} RentCampy. Sewa perlengkapan camping mudah dan murah.
      </footer>
    </div>
  );
};

export default Home;
