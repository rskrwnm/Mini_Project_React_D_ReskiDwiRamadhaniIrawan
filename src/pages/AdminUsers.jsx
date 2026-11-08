import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api, { getErrorMessage } from '../api';
import Pagination from '../components/Pagination';
import { confirmDelete, notifyError, notifySuccess } from '../alert';
import { getStoredUser } from '../auth';

const PER_PAGE = 10;

const ROLE_STYLE = {
  admin: 'bg-amber-100 text-amber-700',
  user: 'bg-emerald-100 text-emerald-700',
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const me = getStoredUser();

  useEffect(() => {
    document.title = 'Kelola User';
    api
      .get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch((error) => notifyError(getErrorMessage(error, 'Gagal memuat data user.')))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const { value } = await Swal.fire({
      title: 'Tambah User',
      html: `
        <input id="sw-email" type="email" class="swal2-input" placeholder="Email">
        <input id="sw-pass" type="password" class="swal2-input" placeholder="Password (min. 4 karakter)">
        <select id="sw-role" class="swal2-select">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      preConfirm: () => {
        const email = document.getElementById('sw-email').value.trim();
        const password = document.getElementById('sw-pass').value;
        const role = document.getElementById('sw-role').value;
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          Swal.showValidationMessage('Format email tidak valid.');
          return false;
        }
        if (password.length < 4) {
          Swal.showValidationMessage('Password minimal 4 karakter.');
          return false;
        }
        return { email, password, role };
      },
    });
    if (!value) return;

    try {
      const { data } = await api.post('/admin/users', value);
      setUsers((prev) => [...prev, data]);
      notifySuccess('User berhasil ditambahkan!');
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal menambahkan user.'));
    }
  };

  const handleChangeRole = async (user) => {
    const { value: role, isConfirmed } = await Swal.fire({
      title: 'Ubah Role',
      text: user.email,
      input: 'select',
      inputOptions: { user: 'User', admin: 'Admin' },
      inputValue: user.role,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    });
    if (!isConfirmed || role === user.role) return;

    try {
      const { data } = await api.put(`/admin/users/${user.id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      notifySuccess('Role berhasil diubah!');
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal mengubah role.'));
    }
  };

  const handleDelete = async (user) => {
    const ok = await confirmDelete(
      `Akun ${user.email} akan dihapus permanen.`,
      'Hapus user ini?'
    );
    if (!ok) return;

    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      notifySuccess('User berhasil dihapus!');
    } catch (error) {
      notifyError(getErrorMessage(error, 'Gagal menghapus user.'));
    }
  };

  const keyword = search.trim().toLowerCase();
  const filtered = users.filter((u) => u.email.toLowerCase().includes(keyword));

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
            <h1 className="text-3xl font-bold text-gray-800">Kelola User</h1>
            <p className="text-gray-500">Lihat, tambah, ubah role, dan hapus akun</p>
          </div>
          <button
            onClick={handleAdd}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tambah User
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Daftar Akun <span className="text-base font-normal text-gray-400">({users.length})</span>
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
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Terdaftar</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user, index) => {
                  const isMe = user.id === me?.id;
                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-3">{pageStart + index + 1}</td>
                      <td className="px-3 py-3 font-medium text-gray-800">
                        {user.email}
                        {isMe && <span className="ml-2 text-xs font-normal text-gray-400">(Anda)</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLE[user.role]}`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        {isMe ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleChangeRole(user)}
                              className="mr-2 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
                            >
                              Ubah Role
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-10 text-center text-gray-400">
                      Tidak ada user.
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

export default AdminUsers;
