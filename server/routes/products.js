import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const isNonNegInt = (v) =>
  v !== "" && v !== null && v !== undefined && Number.isInteger(Number(v)) && Number(v) >= 0;

const validateProduct = ({ name, category, description, price, stock, deposit }) => {
  if (!name || !name.trim()) return "Nama produk wajib diisi.";
  if (!Array.isArray(category) || category.length === 0) return "Kategori wajib diisi.";
  if (!description || !description.trim()) return "Deskripsi wajib diisi.";
  if (!isNonNegInt(price)) return "Harga harus bilangan bulat >= 0.";
  if (!isNonNegInt(stock)) return "Jumlah unit harus bilangan bulat >= 0.";
  if (deposit !== undefined && !isNonNegInt(deposit)) return "Deposit harus bilangan bulat >= 0.";
  return null;
};

// Publik: etalase
router.get("/", async (req, res) => {
  const { category } = req.query;
  const { rows } = category
    ? await pool.query("SELECT * FROM products WHERE $1 = ANY(category) ORDER BY id", [category])
    : await pool.query("SELECT * FROM products ORDER BY id");
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({ message: "Produk tidak ditemukan." });
  }
  const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Produk tidak ditemukan." });
  res.json(rows[0]);
});

// Admin
router.post("/", requireAdmin, async (req, res) => {
  const error = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error });
  const { name, category, image, description, price, stock, deposit = 0 } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO products (name, category, image, description, price, stock, deposit)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name.trim(), category, image || null, description, Number(price), Number(stock), Number(deposit)]
  );
  res.status(201).json(rows[0]);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const error = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error });
  const { name, category, image, description, price, stock, deposit = 0 } = req.body;
  const { rows } = await pool.query(
    `UPDATE products
     SET name = $1, category = $2, image = COALESCE($3, image), description = $4,
         price = $5, stock = $6, deposit = $7
     WHERE id = $8 RETURNING *`,
    [name.trim(), category, image || null, description, Number(price), Number(stock), Number(deposit), req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: "Produk tidak ditemukan." });
  res.json(rows[0]);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json({ message: "Produk dihapus." });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        message:
          "Produk sudah dipakai di data penyewaan, jadi tidak bisa dihapus. Set jumlah unit ke 0 jika tidak ingin disewakan lagi.",
      });
    }
    throw err;
  }
});

export default router;
