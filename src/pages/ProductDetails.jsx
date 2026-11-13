import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import api from "../api";
import { CATEGORY_STYLE } from "../components/Card";
import { fetchWaNumber, formatRupiah, openWhatsApp } from "../wa";

// Data produk diambil dari server berdasarkan id di URL,
// jadi halaman tetap berfungsi saat di-refresh atau dibuka lewat link langsung.
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | notfound | error
  const [waNumber, setWaNumber] = useState("");

  useEffect(() => {
    setStatus("loading");
    api
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        document.title = `${res.data.name} - RentCampy`;
        setStatus("ok");
      })
      .catch((error) => setStatus(error?.response?.status === 404 ? "notfound" : "error"));
    fetchWaNumber().then(setWaNumber);
  }, [id]);

  if (status === "loading") {
    return (
      <div className="flex h-96 items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-t-4 border-emerald-600"></div>
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (status !== "ok") {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="mb-4 text-2xl text-gray-700">
          {status === "notfound" ? "Produk tidak ditemukan" : "Gagal memuat produk"}
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700"
        >
          Kembali ke katalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Kembali ke katalog
        </button>

        <div className="grid gap-8 overflow-hidden rounded-2xl bg-white p-6 shadow-md md:grid-cols-2">
          <img
            src={product.image ?? "https://placehold.co/600x500"}
            alt={product.name}
            className="h-80 w-full rounded-xl object-cover md:h-full"
          />

          <div className="flex flex-col">
            <div className="mb-3 flex flex-wrap gap-2">
              {product.category.map((cat) => (
                <span
                  key={cat}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    CATEGORY_STYLE[cat] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {cat}
                </span>
              ))}
            </div>

            <h1 className="mb-3 text-3xl font-bold text-gray-800">{product.name}</h1>
            <p className="mb-6 whitespace-pre-line text-gray-600">{product.description}</p>

            <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-sm text-gray-500">Harga sewa</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatRupiah(product.price)}
                  <span className="text-sm font-normal text-gray-400"> / hari</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deposit</p>
                <p className="text-2xl font-bold text-gray-800">
                  {product.deposit > 0 ? formatRupiah(product.deposit) : "Tanpa deposit"}
                </p>
              </div>
            </div>

            <button
              onClick={() => openWhatsApp(waNumber, product)}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              <FaWhatsapp className="h-5 w-5" />
              Sewa via WhatsApp
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              Ketersediaan dan pemesanan dikonfirmasi oleh admin lewat WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
