import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { notifyError, notifySuccess } from '../alert';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const AdminSettings = () => {
  const [form, setForm] = useState({ wa_admin: '', late_fee_per_day: '', gap_days: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Pengaturan';
    api
      .get('/admin/settings')
      .then((res) => setForm(res.data))
      .catch((error) => notifyError(getErrorMessage(error, 'Gagal memuat pengaturan.')))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/admin/settings', form);
      setForm(data);
      notifySuccess('Pengaturan berhasil disimpan!');
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal menyimpan pengaturan.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-t-4 border-gray-600"></div>
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
          <p className="text-gray-500">Pengaturan umum RentCampy</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nomor WhatsApp Admin
            </label>
            <input
              name="wa_admin"
              type="text"
              placeholder="0812-3456-7890"
              value={form.wa_admin}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Dipakai tombol "Sewa via WhatsApp" di halaman publik. Format 08xx atau 628xx.
              {form.wa_admin && <> Tersimpan sebagai <b>{form.wa_admin}</b>.</>}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Denda Keterlambatan per Hari (Rp)
            </label>
            <input
              name="late_fee_per_day"
              type="number"
              min="0"
              value={form.late_fee_per_day}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Berlaku untuk penyewaan baru. Penyewaan yang sudah dicatat memakai nilai saat dicatat.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Hari Jeda Antar Sewa
            </label>
            <input
              name="gap_days"
              type="number"
              min="0"
              max="30"
              value={form.gap_days}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Unit yang dikembalikan baru bisa disewa lagi setelah jeda ini (untuk pembersihan dan
              pengecekan). Berlaku untuk penyewaan baru.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
