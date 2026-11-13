import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api, { getErrorMessage } from '../api';
import Pagination from '../components/Pagination';
import { confirmDelete, notifyError, notifySuccess } from '../alert';
import { getStoredUser } from '../auth';

const PER_PAGE = 10;

const formatDate = (value) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const AdminAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const me = getStoredUser();

  useEffect(() => {
    document.title = 'Kelola Admin';
    api
      .get('/admin/admins')
      .then((res) => setAdmins(res.data))
      .catch((error) => notifyError(getErrorMessage(error, 'Gagal memuat data admin.')))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const { value } = await Swal.fire({
      title: 'Tambah Admin',
      html: `
        <input id="sw-email" type="email" class="swal2-input" placeholder="Email">
        <input id="sw-pass" type="password" class="swal2-input" placeholder="Password (min. 4 karakter)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      preConfirm: () => {
        const email = document.getElementById('sw-email').value.trim();
        const password = document.getElementById('sw-pass').value;
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          Swal.showValidationMessage('Format email tidak valid.');
          return false;
        }
        if (password.length < 4) {
          Swal.showValidationMessage('Password minimal 4 karakter.');
          return false;
        }
        return { email, password };
      },
    });
    if (!value) return;

    try {
      const { data } = await api.post('/admin/admins', value);
      setAdmins((prev) => [...prev, data]);
      notifySuccess('Admin berhasil ditambahkan!');
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal menambahkan admin.'));
    }
  };

  const handleDelete = async (admin) => {
    const ok = await confirmDelete(
      `Akun ${admin.email} akan dihapus permanen dan tidak bisa login lagi.`,
      'Hapus admin ini?'
    );
    if (!ok) return;

    try {
      await api.delete(`/admin/admins/${admin.id}`);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      notifySuccess('Admin berhasil dihapus!');
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal menghapus admin.'));
    }
  };

  const keyword = search.trim().toLowerCase();
  const filtered = admins.filter((a) => a.email.toLowerCase().includes(keyword));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PER_PAGE;
  const visible = filtered.slice(pageStart, pageStart + PER_PAGE);

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
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kelola Admin</h1>
            <p className="text-gray-500">Akun yang bisa login ke dashboard</p>
          </div>
          <button
            onClick={handleAdd}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tambah Admin
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Daftar Admin <span className="text-base font-normal text-gray-400">({admins.length})</span>
            </h2>
            <input
              type="text"
              placeholder="Cari email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">No</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Dibuat</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((admin, index) => {
                  const isMe = admin.id === me?.id;
                  return (
                    <tr key={admin.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-3">{pageStart + index + 1}</td>
                      <td className="px-3 py-3 font-medium text-gray-800">
                        {admin.email}
                        {isMe && <span className="ml-2 text-xs font-normal text-gray-400">(Anda)</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                        {formatDate(admin.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        {isMe ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <button
                            onClick={() => handleDelete(admin)}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-3 py-10 text-center text-gray-400">
                      Tidak ada admin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage}
            perPage={PER_PAGE}
            totalItems={filtered.length}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminAdmins;
