import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { notifyError } from '../alert';
import { formatRupiah, formatTanggal, STATUS } from '../format';

const PER_PAGE = 10;
const TABS = ['semua', 'dibooking', 'diambil', 'terlambat', 'dikembalikan', 'selesai', 'dibatalkan'];

const AdminRentals = () => {
  const [data, setData] = useState({ items: [], total: 0, counts: {} });
  const [status, setStatus] = useState('semua');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Penyewaan';
  }, []);

  // Tunda pencarian 400 ms setelah berhenti mengetik
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/admin/orders', {
        params: {
          status: status === 'semua' ? undefined : status,
          q: query || undefined,
          page,
          per_page: PER_PAGE,
        },
      })
      .then((res) => !cancelled && setData(res.data))
      .catch((error) => !cancelled && notifyError(getErrorMessage(error, 'Gagal memuat penyewaan.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, query, page]);

  const totalSemua = Object.values(data.counts).reduce((a, b) => a + b, 0);
  const countOf = (tab) => (tab === 'semua' ? totalSemua : data.counts[tab] || 0);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Penyewaan</h1>
            <p className="text-gray-500">Catat dan kelola semua penyewaan peralatan</p>
          </div>
          <Link
            to="/admin/rentals/new"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tambah Penyewaan
          </Link>
        </div>

        {(data.counts.terlambat || 0) > 0 && status !== 'terlambat' && (
          <button
            onClick={() => {
              setStatus('terlambat');
              setPage(1);
            }}
            className="mb-4 flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700 hover:bg-red-100"
          >
            ⚠️ <b>{data.counts.terlambat} penyewaan terlambat</b> dikembalikan. Klik untuk melihatnya.
          </button>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatus(tab);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  status === tab
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'semua' ? 'Semua' : STATUS[tab].label}
                <span className={`ml-1.5 text-xs ${status === tab ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {countOf(tab)}
                </span>
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Cari nama penyewa, nomor WA, atau #ID pesanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-md"
          />

          <div className={`overflow-x-auto transition ${loading ? 'opacity-50' : ''}`}>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Penyewa</th>
                  <th className="px-3 py-3">Alat</th>
                  <th className="px-3 py-3">Tanggal</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr
                    key={o.id}
                    className={`border-b last:border-0 hover:bg-gray-50 ${
                      o.overdue_days > 0 ? 'bg-red-50/60' : ''
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-gray-500">#{o.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-800">{o.customer_name}</p>
                      <p className="text-xs text-gray-500">{o.customer_phone}</p>
                    </td>
                    <td className="max-w-xs px-3 py-3 text-gray-600">
                      {(o.items || []).map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      {formatTanggal(o.pickup_date)} → {formatTanggal(o.return_date)}
                      <p className="text-xs text-gray-400">{o.days} hari</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-medium text-gray-800">{formatRupiah(o.rental_total)}</p>
                      <p className="text-xs text-gray-400">Deposit {formatRupiah(o.deposit_total)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={o.status} />
                      {o.overdue_days > 0 && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          ⚠️ Telat {o.overdue_days} hari
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      <Link
                        to={`/admin/rentals/${o.id}`}
                        className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
                {!loading && data.items.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-10 text-center text-gray-400">
                      Belum ada penyewaan{status !== 'semua' || query ? ' yang sesuai' : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} perPage={PER_PAGE} totalItems={data.total} onChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default AdminRentals;
