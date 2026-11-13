import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api';
import imageCompression from 'browser-image-compression';
import Pagination from '../components/Pagination';
import { confirmDelete, notifyError, notifySuccess, notifyWarning } from '../alert';

const CATEGORIES = ['Tenda', 'Carrier', 'Alat Tidur', 'Peralatan Masak'];

const CATEGORY_STYLE = {
  Tenda: 'bg-green-100 text-green-700',
  Carrier: 'bg-purple-100 text-purple-700',
  'Alat Tidur': 'bg-blue-100 text-blue-700',
  'Peralatan Masak': 'bg-orange-100 text-orange-700',
};

const formatRupiah = (value) =>
  'Rp ' + Number(value || 0).toLocaleString('id-ID');

const PER_PAGE = 10;

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const Admin = () => {
  const [name, setProductName] = useState('');
  const [category, setProductCategory] = useState('');
  const [image, setProductImage] = useState(null);
  const [price, setProductPrice] = useState('');
  const [stock, setStock] = useState('');
  const [deposit, setDeposit] = useState('');
  const [description, setdescription] = useState('');
  const [productData, setProductData] = useState([]);
  const [imageError, setImageError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/products');
        setProductData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setEditingProduct(null);
    setProductName('');
    setProductCategory('');
    setProductImage(null);
    setProductPrice('');
    setStock('');
    setDeposit('');
    setdescription('');
    setImageError('');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('The selected file is not an image.');
      return;
    }
    setImageError('');

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.05,
        useWebWorker: true,
      });
      setProductImage(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  };

  const handleEdit = (productId) => {
    const productToEdit = productData.find((p) => p.id === productId);
    setEditingProduct(productToEdit);
    setProductName(productToEdit.name);
    setProductCategory(productToEdit.category[0]);
    setProductImage(null);
    setProductPrice(productToEdit.price);
    setStock(productToEdit.stock);
    setDeposit(productToEdit.deposit);
    setdescription(productToEdit.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const readAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !category || price === '' || stock === '' || !description.trim()) {
      notifyWarning('Semua kolom wajib diisi sebelum menyimpan produk.');
      return;
    }
    if (!image && !editingProduct) {
      notifyWarning('Silakan pilih gambar untuk produk.');
      return;
    }

    try {
      const payload = {
        name,
        category: [category],
        description,
        price,
        stock,
        deposit: deposit === '' ? 0 : deposit,
      };
      // Saat edit tanpa gambar baru, gambar lama dipertahankan oleh server.
      if (image) payload.image = await readAsDataURL(image);

      if (editingProduct) {
        const response = await api.put(`/products/${editingProduct.id}`, payload);
        setProductData((prev) =>
          prev.map((p) => (p.id === response.data.id ? response.data : p))
        );
        notifySuccess('Produk berhasil diperbarui!');
      } else {
        const response = await api.post('/products', payload);
        setProductData((prev) => [...prev, response.data]);
        notifySuccess('Produk berhasil ditambahkan!');
      }

      resetForm();
      e.target.reset();
    } catch (error) {
      console.error('Error adding/updating product:', error);
      notifyError(getErrorMessage(error, 'Gagal menyimpan produk. Coba lagi nanti.'));
    }
  };

  const handleDelete = async (product) => {
    const ok = await confirmDelete(
      `Produk "${product.name}" akan dihapus permanen.`,
      'Hapus produk ini?'
    );
    if (!ok) return;

    try {
      await api.delete(`/products/${product.id}`);
      setProductData((prev) => prev.filter((p) => p.id !== product.id));
      if (editingProduct?.id === product.id) resetForm();
      notifySuccess('Produk berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting product:', error);
      notifyError(getErrorMessage(error, 'Gagal menghapus produk. Coba lagi nanti.'));
    }
  };

  const filteredProducts = productData.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Jika halaman saat ini kosong (misalnya setelah hapus), mundur ke halaman terakhir.
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PER_PAGE;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + PER_PAGE);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-gray-600"></div>
        <p className="text-2xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Kelola Produk</h1>
          <p className="text-gray-500">Tambah, ubah, dan hapus produk RentCampy</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingProduct ? `Edit Produk: ${editingProduct.name}` : 'Tambah Produk Baru'}
            </h2>
            {editingProduct && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Batal edit
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setProductName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Category</label>
              <select
                value={category}
                onChange={(e) => setProductCategory(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Price (Rp)</label>
              <input
                type="number"
                min="0"
                placeholder="50000"
                value={price}
                onChange={(e) => setProductPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah Unit (Stok)</label>
              <input
                type="number"
                min="0"
                placeholder="3"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Deposit per Unit (Rp)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Image Of Product
                {editingProduct && (
                  <span className="font-normal text-gray-400"> (kosongkan jika tidak diganti)</span>
                )}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full rounded-lg border border-gray-300 bg-white text-sm file:mr-3 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-sm"
              />
              {imageError && <p className="mt-1 text-sm text-red-500">{imageError}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setdescription(e.target.value)}
                className={inputClass}
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </form>

        {/* Tabel */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-800">List Product</h2>
            <input
              type="text"
              placeholder="Cari nama produk..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={inputClass + ' sm:max-w-xs'}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">No</th>
                  <th className="px-3 py-3">Image</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3 text-center">Stok</th>
                  <th className="px-3 py-3">Deposit</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product, index) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-3">{pageStart + index + 1}</td>
                    <td className="px-3 py-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-800">{product.name}</td>
                    <td className="px-3 py-3">
                      {product.category.map((cat) => (
                        <span
                          key={cat}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            CATEGORY_STYLE[cat] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {cat}
                        </span>
                      ))}
                    </td>
                    <td className="max-w-xs px-3 py-3 text-gray-600">
                      <p className="line-clamp-2">{product.description}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.stock > 0 ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.stock} unit
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      {product.deposit > 0 ? formatRupiah(product.deposit) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      <button
                        onClick={() => handleEdit(product.id)}
                        className="mr-2 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-3 py-10 text-center text-gray-400">
                      Tidak ada produk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage}
            perPage={PER_PAGE}
            totalItems={filteredProducts.length}
            onChange={setPage}
          />
        </div>
      </div>

    </div>
  );
};

export default Admin;
