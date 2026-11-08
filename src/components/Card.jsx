import React from "react";

const CATEGORY_STYLE = {
  Tenda: "bg-green-100 text-green-700",
  "Alat Tidur": "bg-blue-100 text-blue-700",
  "Peralatan Masak": "bg-orange-100 text-orange-700",
};

const Card = ({
  id,
  name,
  category,
  price,
  image,
  handleNavigateDetails,
  handleAddtoCart,
  showCartButton,
}) => {
  return (
    <div
      id={id}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative overflow-hidden">
        <img
          src={image ?? "https://placehold.co/500x400"}
          alt={name}
          onClick={handleNavigateDetails}
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
        <p className="mb-4 text-lg font-bold text-emerald-700">
          Rp {Number(price).toLocaleString("id-ID")}
          <span className="text-sm font-normal text-gray-400"> / hari</span>
        </p>

        {showCartButton && (
          <div className="mt-auto grid grid-cols-2 gap-2">
            <button
              onClick={handleNavigateDetails}
              className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              Detail
            </button>
            <button
              onClick={handleAddtoCart}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              + Keranjang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
