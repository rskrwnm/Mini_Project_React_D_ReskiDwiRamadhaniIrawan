// Format & tanggal. Semua tanggal sewa berupa teks "YYYY-MM-DD" dan dihitung
// dengan aritmetika UTC murni + zona waktu Asia/Makassar, jadi tidak bergeser karena zona waktu browser.

export const formatRupiah = (value) => 'Rp ' + Number(value || 0).toLocaleString('id-ID');

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// "2026-11-08" -> "8 Nov 2026"
export const formatTanggal = (s) => {
  if (!s) return '-';
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
};

// "2026-11" -> "November 2026"
export const formatBulan = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${BULAN_PANJANG[m - 1]} ${y}`;
};

export const hariIni = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());

export const tambahHari = (s, n) =>
  new Date(Date.parse(`${s}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export const selisihHari = (dari, ke) =>
  Math.round((Date.parse(`${ke}T00:00:00Z`) - Date.parse(`${dari}T00:00:00Z`)) / 86400000);

export const tambahBulan = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};

export const STATUS = {
  dibooking: { label: 'Dibooking', cls: 'bg-blue-100 text-blue-700' },
  diambil: { label: 'Diambil', cls: 'bg-amber-100 text-amber-700' },
  terlambat: { label: 'Terlambat', cls: 'bg-red-100 text-red-700' },
  dikembalikan: { label: 'Dikembalikan', cls: 'bg-teal-100 text-teal-700' },
  selesai: { label: 'Selesai', cls: 'bg-green-100 text-green-700' },
  dibatalkan: { label: 'Dibatalkan', cls: 'bg-gray-200 text-gray-600' },
};

export const IDENTITY_TYPES = ['KTP', 'SIM', 'Kartu Pelajar', 'KTM', 'Paspor'];
