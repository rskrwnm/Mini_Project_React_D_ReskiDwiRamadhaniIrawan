import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import settingsRoutes from "./routes/settings.js";
import adminRoutes from "./routes/admin.js";
import { syncOverdue } from "./lib/rental.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Gambar produk disimpan sebagai data URL base64, jadi batas body dinaikkan.
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api", settingsRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", (req, res) => res.status(404).json({ message: "Endpoint tidak ditemukan." }));

// Express 5 meneruskan error dari handler async ke sini.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan server." });
});

app.listen(PORT, () => console.log(`API berjalan di http://localhost:${PORT}`));

// Tandai penyewaan yang lewat tanggal kembali sebagai "terlambat" setiap 10 menit
// (juga dicek setiap kali daftar/detail penyewaan dibuka).
const jalankanSyncTerlambat = () => syncOverdue().catch((err) => console.error("syncOverdue gagal:", err.message));
jalankanSyncTerlambat();
setInterval(jalankanSyncTerlambat, 10 * 60 * 1000);
