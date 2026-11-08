// Mengisi data dummy produk. Jalankan: npm run db:seed
// Hanya mengisi jika tabel products masih kosong.
import pool from "./db.js";

const COLORS = {
  Tenda: "#2e7d32",
  "Alat Tidur": "#1565c0",
  "Peralatan Masak": "#ef6c00",
};

// Gambar placeholder berupa SVG (data URL) agar tidak butuh file/koneksi luar.
const makeImage = (name, category) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
<rect width="400" height="300" fill="${COLORS[category]}"/>
<text x="200" y="140" font-family="Arial" font-size="26" font-weight="bold" fill="#fff" text-anchor="middle">${name}</text>
<text x="200" y="180" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle">${category}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

const products = [
  ["Tenda Dome 2 Orang", "Tenda", "Tenda dome ringan untuk 2 orang, double layer, anti air dan mudah dipasang. Cocok untuk pendakian.", 50000],
  ["Tenda Dome 4 Orang", "Tenda", "Tenda dome kapasitas 4 orang dengan ruang luas dan ventilasi baik. Cocok untuk camping keluarga.", 80000],
  ["Tenda Family 6 Orang", "Tenda", "Tenda besar untuk 6 orang dengan dua pintu dan teras. Ideal untuk camping rombongan.", 120000],
  ["Tenda Ultralight 1 Orang", "Tenda", "Tenda super ringan untuk solo hiking, berat hanya sekitar 1,5 kg dan ringkas saat dilipat.", 40000],
  ["Sleeping Bag Polar", "Alat Tidur", "Sleeping bag bahan polar yang hangat dan nyaman, cocok untuk suhu dingin di pegunungan.", 25000],
  ["Sleeping Bag Dacron", "Alat Tidur", "Sleeping bag dacron ringan dan mudah dicuci, cocok untuk camping di dataran rendah.", 20000],
  ["Matras Gulung", "Alat Tidur", "Matras gulung busa tebal sebagai alas tidur, melindungi dari dinginnya tanah.", 10000],
  ["Hammock", "Alat Tidur", "Hammock parasut kuat dan ringan, dilengkapi tali pengikat. Beban maksimal 200 kg.", 15000],
  ["Kompor Portable", "Peralatan Masak", "Kompor gas portable dengan pemantik otomatis, praktis untuk memasak di alam terbuka.", 15000],
  ["Nesting Set", "Peralatan Masak", "Satu set panci dan wajan aluminium yang bisa ditumpuk, hemat tempat di dalam tas.", 20000],
  ["Gas Kaleng", "Peralatan Masak", "Tabung gas butana untuk kompor portable, tersedia untuk sekali pakai selama camping.", 10000],
  ["Cooler Box", "Peralatan Masak", "Kotak pendingin untuk menyimpan makanan dan minuman tetap segar selama perjalanan.", 30000],
];

const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM products");
if (rows[0].n > 0) {
  console.log(`Tabel products sudah berisi ${rows[0].n} data, seed dilewati.`);
} else {
  for (const [name, category, description, price] of products) {
    await pool.query(
      `INSERT INTO products (name, category, image, description, price)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, [category], makeImage(name, category), description, price]
    );
  }
  console.log(`${products.length} produk dummy ditambahkan.`);
}
await pool.end();
