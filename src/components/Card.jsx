import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { formatRupiah } from "../wa";

export const CATEGORY_STYLE = {
  Tenda: "bg-green-100 text-green-700",
  Carrier: "bg-purple-100 text-purple-700",
  "Alat Tidur": "bg-blue-100 text-blue-700",
  "Peralatan Masak": "bg-orange-100 text-orange-700",
};

// Kartu etalase produk (publik). Penyewaan dicatat admin, jadi tidak ada keranjang.
const Card = ({ product, onDetail, onWhatsApp }) => {
  const { id, name, category, description, price, deposit, image } = product;

  return (
    <div
      id={id}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative overflow-hidden">
        <img
          src={image ?? "https://placehold.co/500x400"}
          alt={name}
          onClick={onDetail}
          className="h-56 w-full cursor-pointer object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1">
          {category.map((cat) => (
            <span
              key={cat}
              className={`rounded-full px-3 py-1 text-xs font-semibold shadow ${
                CATEGORY_STYLE[cat] || "bg-gray-100 text-gray-700"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-1 text-lg font-semibold text-gray-800">{name}</h2>
        <p className="mb-3 line-clamp-2 text-sm text-gray-500">{description}</p>
        <p className="text-lg font-bold text-emerald-700">
          {formatRupiah(price)}
          <span className="text-sm font-normal text-gray-400"> / hari</span>
        </p>
        <p className="mb-4 text-sm text-gray-500">
          {deposit > 0 ? `Deposit ${formatRupiah(deposit)}` : "Tanpa deposit"}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            onClick={onDetail}
            className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            Detail
          </button>
          <button
            onClick={onWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <FaWhatsapp className="h-4 w-4" />
            Sewa via WA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;
