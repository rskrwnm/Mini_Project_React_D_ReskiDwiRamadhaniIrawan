import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "ganti-secret-ini-di-env";

app.use(cors());
// Gambar produk disimpan sebagai data URL base64, jadi batas body dinaikkan.
app.use(express.json({ limit: "10mb" }));

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Login diperlukan." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
  }
};

const requireAdmin = (req, res, next) =>
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Hanya admin yang boleh." });
    }
    next();
  });

// ---------- Auth ----------
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 4) {
    return res.status(400).json({ message: "Email dan password (min. 4 karakter) wajib diisi." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user')",
      [email.trim().toLowerCase(), hash]
    );
    res.status(201).json({ message: "Registrasi berhasil." });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi." });
  }
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email atau password salah." });
    }
    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

// Dipakai frontend untuk memverifikasi sesi dan role dari sumber yang benar (database),
// bukan dari localStorage yang bisa diubah pengguna.
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(401).json({ message: "Akun tidak ditemukan." });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

// ---------- Admin ----------
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [products, users, byCategory, latest] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM products"),
      pool.query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'user'"),
      pool.query(
        `SELECT c AS category, COUNT(*)::int AS count
         FROM products, UNNEST(category) AS c
         GROUP BY c ORDER BY c`
      ),
      pool.query(
        "SELECT id, name, category, image, price FROM products ORDER BY id DESC LIMIT 5"
      ),
    ]);
    res.json({
      totalProducts: products.rows[0].n,
      totalUsers: users.rows[0].n,
      byCategory: byCategory.rows,
      latestProducts: latest.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

// ---------- Admin: kelola user ----------
const ROLES = ["user", "admin"];

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, role, created_at FROM users ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.post("/api/admin/users", requireAdmin, async (req, res) => {
  const { email, password, role = "user" } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Format email tidak valid." });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ message: "Password minimal 4 karakter." });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: "Role tidak valid." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email.trim().toLowerCase(), hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.put("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: "Role tidak valid." });
  }
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "Anda tidak bisa mengubah role akun sendiri." });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, email, role, created_at`,
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User tidak ditemukan." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "Anda tidak bisa menghapus akun sendiri." });
  }
  try {
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ message: "User tidak ditemukan." });
    res.json({ message: "User dihapus." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

// ---------- Products ----------
const validateProduct = ({ name, category, description, price }) => {
  if (!name || !name.trim()) return "Nama produk wajib diisi.";
  if (!Array.isArray(category) || category.length === 0) return "Kategori wajib diisi.";
  if (!description || !description.trim()) return "Deskripsi wajib diisi.";
  if (!Number.isInteger(Number(price)) || Number(price) < 0) return "Harga harus bilangan bulat >= 0.";
  return null;
};

app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    const { rows } = category
      ? await pool.query(
          "SELECT * FROM products WHERE $1 = ANY(category) ORDER BY id",
          [category]
        )
      : await pool.query("SELECT * FROM products ORDER BY id");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.post("/api/products", requireAdmin, async (req, res) => {
  const error = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error });
  const { name, category, image, description, price } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products (name, category, image, description, price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), category, image || null, description, Number(price)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
  const error = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error });
  const { name, category, image, description, price } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE products
       SET name = $1, category = $2, image = COALESCE($3, image), description = $4, price = $5
       WHERE id = $6 RETURNING *`,
      [name.trim(), category, image || null, description, Number(price), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json({ message: "Produk dihapus." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

app.listen(PORT, () => console.log(`API berjalan di http://localhost:${PORT}`));
