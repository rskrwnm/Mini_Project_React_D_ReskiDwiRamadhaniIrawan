import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api, { getErrorMessage } from '../api';
import StatusBadge from '../components/StatusBadge';
import { notifyError, notifySuccess } from '../alert';
import { formatRupiah, formatTanggal, hariIni, selisihHari } from '../format';

const Row = ({ label, children, strong, className = '' }) => (
  <div className={`flex justify-between gap-4 py-1.5 text-sm ${strong ? 'font-semibold text-gray-800' : ''} ${className}`}>
    <dt className={strong ? '' : 'text-gray-500'}>{label}</dt>
    <dd className="text-right">{children}</dd>
  </div>
);

const AdminRentalDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | notfound | error

  const load = () =>
    api
      .get(`/admin/orders/${id}`)
      .then((res) => {
        setOrder(res.data);
        setStatus('ok');
        document.title = `Penyewaan #${res.data.id}`;
      })
      .catch((error) => setStatus(error?.response?.status === 404 ? 'notfound' : 'error'));

  useEffect(() => {
    setStatus('loading');
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (next, { title, text, confirmText, danger }) => {
    const result = await Swal.fire({
      icon: danger ? 'warning' : 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Batal',
      confirmButtonColor: danger ? '#dc2626' : '#059669',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const { data } = await api.put(`/admin/orders/${order.id}/status`, { status: next });
      setOrder(data);
      notifySuccess('Status berhasil diubah!', `Sekarang: ${next}`);
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal mengubah status.'));
      load();
    }
  };

  const handleReturn = async () => {
    const today = hariIni();
    const preview = (returned, damageFee) => {
      const lateDays = Math.max(0, selisihHari(order.return_date, returned));
      const lateFee = lateDays * order.late_fee_per_day;
      const fees = lateFee + damageFee;
      return {
        lateDays,
        lateFee,
        refund: Math.max(0, order.deposit_total - fees),
        due: Math.max(0, fees - order.deposit_total),
      };
    };

    const { value } = await Swal.fire({
      title: 'Catat Pengembalian',
      width: 520,
      html: `
        <div style="text-align:left;font-size:14px">
          <label style="font-weight:600">Tanggal dikembalikan</label>
          <input id="rt-date" type="date" class="swal2-input" style="margin:4px 0 12px;width:100%"
                 min="${order.pickup_date}" max="${today}" value="${today}">
          <label style="font-weight:600">Catatan kerusakan <span style="font-weight:400;color:#888">(opsional)</span></label>
          <textarea id="rt-note" class="swal2-textarea" style="margin:4px 0 12px;width:100%" rows="2"
                    placeholder="Contoh: pegangan patah"></textarea>
          <label style="font-weight:600">Biaya kerusakan (Rp)</label>
          <input id="rt-fee" type="number" min="0" class="swal2-input" style="margin:4px 0 12px;width:100%" value="0">
          <div id="rt-preview" style="background:#f3f4f6;border-radius:8px;padding:10px 12px;line-height:1.7"></div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Pengembalian',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      reverseButtons: true,
      didOpen: () => {
        const dateEl = document.getElementById('rt-date');
        const feeEl = document.getElementById('rt-fee');
        const out = document.getElementById('rt-preview');
        const render = () => {
          const p = preview(dateEl.value || today, Number(feeEl.value) || 0);
          out.innerHTML = `
            Terlambat: <b>${p.lateDays} hari</b> × ${formatRupiah(order.late_fee_per_day)} = <b>${formatRupiah(p.lateFee)}</b><br>
            Deposit ${formatRupiah(order.deposit_total)} → dikembalikan: <b style="color:#047857">${formatRupiah(p.refund)}</b>
            ${p.due > 0 ? `<br><span style="color:#b91c1c">Kekurangan bayar: <b>${formatRupiah(p.due)}</b></span>` : ''}`;
        };
        dateEl.addEventListener('input', render);
        feeEl.addEventListener('input', render);
        render();
      },
      preConfirm: () => {
        const returned_date = document.getElementById('rt-date').value;
        const damage_note = document.getElementById('rt-note').value.trim();
        const damage_fee = Number(document.getElementById('rt-fee').value) || 0;
        if (!returned_date) {
          Swal.showValidationMessage('Tanggal pengembalian wajib diisi.');
          return false;
        }
        if (damage_fee < 0 || !Number.isInteger(damage_fee)) {
          Swal.showValidationMessage('Biaya kerusakan harus bilangan bulat >= 0.');
          return false;
        }
        if (damage_fee > 0 && !damage_note) {
          Swal.showValidationMessage('Isi catatan kerusakan jika ada biaya kerusakan.');
          return false;
        }
        return { returned_date, damage_note, damage_fee };
      },
    });
    if (!value) return;

    try {
      const { data } = await api.post(`/admin/orders/${order.id}/return`, value);
      setOrder(data);
      notifySuccess(
        'Pengembalian dicatat!',
        data.amount_due > 0
          ? `Kekurangan bayar ${formatRupiah(data.amount_due)}`
          : `Deposit dikembalikan ${formatRupiah(data.deposit_refund)}`
      );
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal mencatat pengembalian.'));
      load();
    }
  };

  const handleNotes = async () => {
    const { value, isConfirmed } = await Swal.fire({
      title: 'Edit Catatan',
      input: 'textarea',
      inputValue: order.notes || '',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    });
    if (!isConfirmed) return;
    try {
      const { data } = await api.put(`/admin/orders/${order.id}/notes`, { notes: value });
      setOrder(data);
      notifySuccess('Catatan disimpan!');
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal menyimpan catatan.'));
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-t-4 border-gray-600"></div>
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }
  if (status !== 'ok') {
    return (
      <div className="px-4 py-16 text-center">
        <p className="mb-4 text-xl text-gray-700">
          {status === 'notfound' ? 'Penyewaan tidak ditemukan.' : 'Gagal memuat penyewaan.'}
        </p>
        <Link to="/admin/rentals" className="text-emerald-700 hover:underline">← Kembali ke daftar</Link>
      </div>
    );
  }

  const o = order;
  const returned = ['dikembalikan', 'selesai'].includes(o.status);
  const waLink = `https://wa.me/${o.customer_phone}`;

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/admin/rentals" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Kembali ke daftar penyewaan
        </Link>

        <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">Penyewaan #{o.id}</h1>
          <StatusBadge status={o.status} className="text-sm" />
        </div>

        {o.overdue_days > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ⚠️ Terlambat <b>{o.overdue_days} hari</b> dari tanggal kembali. Estimasi denda sampai hari ini:{' '}
            <b>{formatRupiah(o.estimated_late_fee)}</b>. Unit masih ditahan dan belum bisa disewa orang lain.
          </div>
        )}

        {/* Tombol aksi */}
        <div className="mb-6 flex flex-wrap gap-3">
          {o.status === 'dibooking' && (
            <>
              <button
                onClick={() =>
                  changeStatus('diambil', {
                    title: 'Tandai sudah diambil?',
                    text: 'Penyewa sudah mengambil alat.',
                    confirmText: 'Ya, sudah diambil',
                  })
                }
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Tandai Diambil
              </button>
              <button
                onClick={() =>
                  changeStatus('dibatalkan', {
                    title: 'Batalkan penyewaan ini?',
                    text: 'Unit akan dilepas dan bisa disewa orang lain.',
                    confirmText: 'Ya, batalkan',
                    danger: true,
                  })
                }
                className="rounded-lg bg-red-100 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-200"
              >
                Batalkan
              </button>
            </>
          )}
          {['diambil', 'terlambat'].includes(o.status) && (
            <button
              onClick={handleReturn}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Catat Pengembalian
            </button>
          )}
          {o.status === 'dikembalikan' && (
            <button
              onClick={() =>
                changeStatus('selesai', {
                  title: 'Tandai selesai?',
                  text: 'Gunakan setelah deposit dikembalikan dan semua tagihan beres.',
                  confirmText: 'Ya, selesai',
                })
              }
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Tandai Selesai
            </button>
          )}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Chat WhatsApp Penyewa
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Penyewa</h2>
            <dl>
              <Row label="Nama">{o.customer_name}</Row>
              <Row label="WhatsApp">{o.customer_phone}</Row>
              <Row label={o.identity_type}>{o.identity_number}</Row>
              <Row label="Alamat">{o.customer_address || '-'}</Row>
            </dl>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Jadwal</h2>
            <dl>
              <Row label="Tanggal ambil">{formatTanggal(o.pickup_date)}</Row>
              <Row label="Tanggal kembali (rencana)">{formatTanggal(o.return_date)}</Row>
              <Row label="Lama sewa">{o.days} hari</Row>
              <Row label="Hari jeda">{o.gap_days} hari</Row>
              <Row label="Denda terlambat">{formatRupiah(o.late_fee_per_day)} / hari</Row>
              {o.returned_date && <Row label="Dikembalikan">{formatTanggal(o.returned_date)}</Row>}
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Alat yang Disewa</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Alat</th>
                  <th className="px-3 py-2 text-center">Unit</th>
                  <th className="px-3 py-2">Harga / hari</th>
                  <th className="px-3 py-2">Deposit / unit</th>
                  <th className="px-3 py-2 text-right">Subtotal sewa</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.product_id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-800">{i.name}</td>
                    <td className="px-3 py-2 text-center">{i.quantity}</td>
                    <td className="px-3 py-2">{formatRupiah(i.price_per_day)}</td>
                    <td className="px-3 py-2">{formatRupiah(i.deposit)}</td>
                    <td className="px-3 py-2 text-right">{formatRupiah(i.price_per_day * i.quantity * o.days)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto mt-4 max-w-sm">
            <Row label="Total sewa" strong>{formatRupiah(o.rental_total)}</Row>
            <Row label="Deposit" className="rounded-lg bg-amber-50 px-2 text-amber-800">
              <b>{formatRupiah(o.deposit_total)}</b>
            </Row>
            {returned && (
              <div className="mt-3 border-t pt-3">
                <Row label={`Denda terlambat (${o.late_days} hari)`}>{formatRupiah(o.late_fee)}</Row>
                <Row label="Biaya kerusakan">{formatRupiah(o.damage_fee)}</Row>
                <Row label="Deposit dikembalikan" strong className="text-emerald-700">
                  {formatRupiah(o.deposit_refund)}
                </Row>
                {o.amount_due > 0 && (
                  <Row label="Kekurangan bayar" strong className="text-red-600">
                    {formatRupiah(o.amount_due)}
                  </Row>
                )}
                {o.damage_note && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                    Catatan kerusakan: {o.damage_note}
                  </p>
                )}
              </div>
            )}
          </dl>
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Catatan</h2>
            <button onClick={handleNotes} className="text-sm font-medium text-emerald-700 hover:underline">
              Edit
            </button>
          </div>
          <p className="whitespace-pre-line text-sm text-gray-600">{o.notes || 'Tidak ada catatan.'}</p>
        </section>
      </div>
    </div>
  );
};

export default AdminRentalDetail;
