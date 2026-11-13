import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { notifyError, notifySuccess, notifyWarning } from '../alert';
import { formatRupiah, hariIni, IDENTITY_TYPES, selisihHari, tambahHari } from '../format';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

const emptyCustomer = { name: '', phone: '', identity_type: 'KTP', identity_number: '', address: '' };

const AdminRentalForm = () => {
  const navigate = useNavigate();
  const today = hariIni();

  const [products, setProducts] = useState([]);
  const [availability, setAvailability] = useState({}); // product_id -> sisa unit
  const [checking, setChecking] = useState(false);

  // pelanggan
  const [selected, setSelected] = useState(null); // pelanggan lama yang dipilih
  const [customer, setCustomer] = useState(emptyCustomer);
  const [customerQuery, setCustomerQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // pesanan
  const [pickup, setPickup] = useState(today);
  const [ret, setRet] = useState(tambahHari(today, 1));
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Tambah Penyewaan';
    api.get('/products').then((res) => setProducts(res.data)).catch(() => {});
  }, []);

  // Cari pelanggan lama (ditunda 300 ms)
  useEffect(() => {
    if (selected || customerQuery.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const t = setTimeout(() => {
      api
        .get('/admin/customers', { params: { q: customerQuery.trim() } })
        .then((res) => setSuggestions(res.data))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [customerQuery, selected]);

  const datesValid = pickup && ret && ret >= pickup;

  // Sisa unit per alat untuk tanggal yang dipilih
  const loadAvailability = () => {
    if (!datesValid) {
      setAvailability({});
      return Promise.resolve();
    }
    setChecking(true);
    return api
      .get('/admin/availability', { params: { pickup, return: ret } })
      .then((res) => setAvailability(Object.fromEntries(res.data.map((r) => [r.product_id, r.available]))))
      .catch(() => setAvailability({}))
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    loadAvailability();
  }, [pickup, ret]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = datesValid ? Math.max(1, selisihHari(pickup, ret)) : 0;

  const totals = useMemo(() => {
    let perDay = 0;
    let deposit = 0;
    for (const it of items) {
      const p = products.find((x) => x.id === Number(it.product_id));
      const qty = Number(it.quantity) || 0;
      if (p && qty > 0) {
        perDay += p.price * qty;
        deposit += p.deposit * qty;
      }
    }
    return { perDay, rental: perDay * days, deposit };
  }, [items, products, days]);

  const updateItem = (index, patch) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
  const usedIds = items.map((i) => Number(i.product_id));

  const pickCustomer = (c) => {
    setSelected(c);
    setSuggestions([]);
    setCustomerQuery('');
  };

  const handlePickupChange = (value) => {
    setPickup(value);
    if (ret < value) setRet(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selected) {
      if (!customer.name.trim() || !customer.phone.trim() || !customer.identity_number.trim()) {
        notifyWarning('Nama penyewa, nomor WhatsApp, dan nomor identitas wajib diisi.');
        return;
      }
    }
    if (!datesValid) {
      notifyWarning('Tanggal kembali tidak boleh sebelum tanggal ambil.');
      return;
    }
    const cleaned = items
      .filter((i) => i.product_id)
      .map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }));
    if (cleaned.length === 0 || cleaned.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) {
      notifyWarning('Pilih minimal satu alat dengan jumlah unit minimal 1.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/admin/orders', {
        customer: selected ? { id: selected.id } : customer,
        pickup_date: pickup,
        return_date: ret,
        items: cleaned,
        notes,
      });
      await notifySuccess('Penyewaan berhasil dicatat!', `Pesanan #${data.id} berstatus dibooking.`);
      navigate(`/admin/rentals/${data.id}`);
    } catch (error) {
      await notifyError(getErrorMessage(error, 'Gagal mencatat penyewaan.'), 'Penyewaan ditolak');
      loadAvailability(); // stok mungkin berubah
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/admin/rentals" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Kembali ke daftar penyewaan
        </Link>
        <h1 className="mb-6 mt-2 text-3xl font-bold text-gray-800">Tambah Penyewaan</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Penyewa */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">1. Data Penyewa</h2>

              {selected ? (
                <div className="flex items-start justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">{selected.name}</p>
                    <p className="text-gray-600">WA: {selected.phone}</p>
                    <p className="text-gray-600">
                      {selected.identity_type}: {selected.identity_number}
                    </p>
                    {selected.address && <p className="text-gray-600">{selected.address}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-5">
                    <label className={labelClass}>Pelanggan langganan? Cari di sini</label>
                    <input
                      type="text"
                      placeholder="Ketik nama atau nomor WhatsApp..."
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      className={inputClass}
                    />
                    {suggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                        {suggestions.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => pickCustomer(c)}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50"
                            >
                              <span className="font-medium text-gray-800">{c.name}</span>
                              <span className="ml-2 text-gray-500">{c.phone}</span>
                              <span className="ml-2 text-xs text-gray-400">
                                {c.identity_type} {c.identity_number}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Tidak ketemu? Isi data di bawah. Pelanggan baru akan tersimpan otomatis.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Nama Penyewa</label>
                      <input
                        type="text"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Nomor WhatsApp</label>
                      <input
                        type="text"
                        placeholder="0812-3456-7890"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Jenis Identitas</label>
                      <select
                        value={customer.identity_type}
                        onChange={(e) => setCustomer({ ...customer, identity_type: e.target.value })}
                        className={inputClass}
                      >
                        {IDENTITY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Identitas</label>
                      <input
                        type="text"
                        value={customer.identity_number}
                        onChange={(e) => setCustomer({ ...customer, identity_number: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Alamat <span className="font-normal text-gray-400">(opsional)</span>
                      </label>
                      <textarea
                        rows="2"
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className={inputClass}
                      ></textarea>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Tanggal */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">2. Tanggal Sewa</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Tanggal Ambil</label>
                  <input
                    type="date"
                    min={today}
                    value={pickup}
                    onChange={(e) => handlePickupChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tanggal Kembali</label>
                  <input
                    type="date"
                    min={pickup || today}
                    value={ret}
                    onChange={(e) => setRet(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {datesValid ? (
                  <>Lama sewa: <b>{days} hari</b></>
                ) : (
                  <span className="text-red-500">Tanggal kembali tidak boleh sebelum tanggal ambil.</span>
                )}
              </p>
            </section>

            {/* Alat */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">3. Alat yang Disewa</h2>
                {checking && <span className="text-xs text-gray-400">Mengecek ketersediaan…</span>}
              </div>

              <div className="space-y-3">
                {items.map((it, index) => {
                  const sisa = availability[Number(it.product_id)];
                  const kurang = it.product_id && sisa !== undefined && Number(it.quantity) > sisa;
                  return (
                    <div key={index} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          value={it.product_id}
                          onChange={(e) => updateItem(index, { product_id: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">Pilih alat...</option>
                          {products.map((p) => {
                            const s = availability[p.id];
                            const habis = s !== undefined && s === 0;
                            return (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={(habis || usedIds.includes(p.id)) && Number(it.product_id) !== p.id}
                              >
                                {p.name} — {formatRupiah(p.price)}/hari
                                {s !== undefined ? ` (sisa ${s})` : ''}
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => updateItem(index, { quantity: e.target.value })}
                          className={inputClass + ' sm:w-28'}
                          aria-label="Jumlah unit"
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="rounded-lg bg-red-100 px-3 text-sm font-medium text-red-700 hover:bg-red-200"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      {it.product_id && sisa !== undefined && (
                        <p className={`mt-2 text-xs ${kurang ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                          {kurang
                            ? `Stok tidak cukup: diminta ${it.quantity}, tersedia ${sisa} unit pada tanggal ini.`
                            : `Tersedia ${sisa} unit pada tanggal ini.`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setItems([...items, { product_id: '', quantity: 1 }])}
                className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
              >
                + Tambah alat lain
              </button>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">4. Catatan</h2>
              <textarea
                rows="3"
                placeholder="Catatan (opsional), misalnya titik penjemputan atau permintaan khusus"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              ></textarea>
            </section>
          </div>

          {/* Ringkasan biaya */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Ringkasan Biaya</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sewa per hari</dt>
                  <dd>{formatRupiah(totals.perDay)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Lama sewa</dt>
                  <dd>{days} hari</dd>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-800">
                  <dt>Total sewa</dt>
                  <dd>{formatRupiah(totals.rental)}</dd>
                </div>
                <div className="flex justify-between rounded-lg bg-amber-50 p-2 text-amber-800">
                  <dt>Deposit (terpisah)</dt>
                  <dd className="font-semibold">{formatRupiah(totals.deposit)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-gray-400">
                Total sewa = harga per hari × jumlah hari × unit. Deposit dikembalikan saat alat kembali,
                dikurangi denda atau kerusakan bila ada.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="mt-5 w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan Penyewaan'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
};

export default AdminRentalForm;
