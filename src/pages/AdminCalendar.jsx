import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import StatusBadge from '../components/StatusBadge';
import { notifyError } from '../alert';
import { formatBulan, formatTanggal, hariIni, tambahBulan } from '../format';

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const cellStyle = (stock, day) => {
  if (stock === 0) return 'bg-gray-100 text-gray-400';
  if (day.available === 0) return 'bg-red-100 text-red-700 border-red-200';
  if (day.used > 0) return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
};

const AdminCalendar = () => {
  const today = hariIni();
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [month, setMonth] = useState(today.slice(0, 7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    document.title = 'Kalender Ketersediaan';
    api
      .get('/products')
      .then((res) => {
        setProducts(res.data);
        if (res.data[0]) setProductId(String(res.data[0].id));
      })
      .catch((error) => notifyError(getErrorMessage(error, 'Gagal memuat produk.')));
  }, []);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    setLoading(true);
    api
      .get(`/admin/products/${productId}/calendar`, { params: { month } })
      .then((res) => !cancelled && setData(res.data))
      .catch((error) => !cancelled && notifyError(getErrorMessage(error, 'Gagal memuat kalender.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId, month]);

  const changeMonth = (n) => {
    setMonth((m) => tambahBulan(m, n));
    setSelectedDay(null);
  };

  const lead = data ? (new Date(`${month}-01T00:00:00Z`).getUTCDay() + 6) % 7 : 0;

  const bookings = (data?.bookings || []).filter((b) => {
    if (!selectedDay) return true;
    return b.pickup_date <= selectedDay && (!b.blocked_until || selectedDay <= b.blocked_until);
  });

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Kalender Ketersediaan</h1>
          <p className="text-gray-500">Sisa unit per hari untuk setiap alat</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setSelectedDay(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock} unit)
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
                aria-label="Bulan sebelumnya"
              >
                ‹
              </button>
              <span className="min-w-[10rem] text-center font-semibold text-gray-800">{formatBulan(month)}</span>
              <button
                onClick={() => changeMonth(1)}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
                aria-label="Bulan berikutnya"
              >
                ›
              </button>
              <button
                onClick={() => {
                  setMonth(today.slice(0, 7));
                  setSelectedDay(null);
                }}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
              >
                Hari ini
              </button>
            </div>
          </div>

          {data && (
            <div className={loading ? 'opacity-50 transition' : 'transition'}>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase text-gray-400">
                {HARI.map((h) => (
                  <div key={h} className="py-1">{h}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1.5">
                {Array.from({ length: lead }, (_, i) => (
                  <div key={`b${i}`} />
                ))}
                {data.days.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDay(selectedDay === d.date ? null : d.date)}
                    className={`rounded-lg border p-1.5 text-left transition sm:p-2 ${cellStyle(data.product.stock, d)} ${
                      d.date === today ? 'ring-2 ring-blue-500' : ''
                    } ${selectedDay === d.date ? 'outline outline-2 outline-offset-1 outline-emerald-600' : ''}`}
                  >
                    <div className="text-sm font-semibold">{Number(d.date.slice(8))}</div>
                    <div className="text-[11px] leading-tight sm:text-xs">
                      {data.product.stock === 0 ? '—' : `${d.available}/${data.product.stock}`}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                <span><i className="mr-1 inline-block h-3 w-3 rounded bg-emerald-100 align-middle"></i>Semua unit tersedia</span>
                <span><i className="mr-1 inline-block h-3 w-3 rounded bg-amber-100 align-middle"></i>Sebagian terpakai</span>
                <span><i className="mr-1 inline-block h-3 w-3 rounded bg-red-100 align-middle"></i>Penuh</span>
                <span>Angka: sisa/total unit</span>
              </div>
            </div>
          )}
        </div>

        {data && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Penyewaan {selectedDay ? `pada ${formatTanggal(selectedDay)}` : `bulan ${formatBulan(month)}`}
              </h2>
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="text-sm font-medium text-emerald-700 hover:underline">
                  Tampilkan semua
                </button>
              )}
            </div>
            {bookings.length === 0 ? (
              <p className="py-6 text-center text-gray-400">Tidak ada penyewaan.</p>
            ) : (
              <ul className="divide-y">
                {bookings.map((b) => (
                  <li key={b.order_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div>
                      <Link to={`/admin/rentals/${b.order_id}`} className="font-semibold text-blue-700 hover:underline">
                        #{b.order_id}
                      </Link>{' '}
                      <span className="font-medium text-gray-800">{b.customer_name}</span>
                      <span className="text-gray-500"> · {b.quantity} unit</span>
                      <p className="text-xs text-gray-500">
                        {formatTanggal(b.pickup_date)} → {formatTanggal(b.return_date)}
                        {b.blocked_until
                          ? ` (unit ditahan sampai ${formatTanggal(b.blocked_until)})`
                          : ' (unit ditahan sampai dikembalikan)'}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCalendar;
