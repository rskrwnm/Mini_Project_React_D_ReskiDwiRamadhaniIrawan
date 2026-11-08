import React from "react";

// Navigasi halaman untuk tabel. Tidak tampil jika data muat dalam satu halaman.
const Pagination = ({ page, perPage, totalItems, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  if (totalItems === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);

  const btn =
    "min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
      <p className="text-sm text-gray-500">
        Menampilkan {from}–{to} dari {totalItems} data
      </p>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <button
            className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
          >
            ‹ Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`${btn} ${
                n === page
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            disabled={page === totalPages}
            onClick={() => onChange(page + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
