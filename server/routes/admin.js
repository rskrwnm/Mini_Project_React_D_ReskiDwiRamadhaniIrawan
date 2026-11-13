import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import rentalRoutes from "./rentals.js";
import { syncOverdue, today } from "../lib/rental.js";

const router = Router();
router.use(requireAdmin);
router.use(rentalRoutes);

router.get("/stats", async (req, res) => {
  await syncOverdue();
  const todayStr = await today();
  const [products, admins, byCategory, latest, rentals, flow, revenue, recent] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS n FROM products"),
    pool.query("SELECT COUNT(*)::int AS n FROM users"),
    pool.query(
      `SELECT c AS category, COUNT(*)::int AS count
       FROM products, UNNEST(category) AS c
       GROUP BY c ORDER BY c`
    ),
    pool.query("SELECT id, name, category, image, price FROM products ORDER BY id DESC LIMIT 5"),
    pool.query("SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status"),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'dibooking' AND pickup_date = $1::date)::int AS pickup_today,
         COUNT(*) FILTER (WHERE status IN ('diambil', 'terlambat') AND return_date = $1::date)::int AS return_today
       FROM orders`,
      [todayStr]
    ),
    pool.query(
      `SELECT COALESCE(SUM(rental_total + late_fee + damage_fee), 0)::int AS total
       FROM orders
       WHERE status <> 'dibatalkan' AND date_trunc('month', pickup_date) = date_trunc('month', $1::date)`,
      [todayStr]
    ),
    pool.query(
      `SELECT o.id, o.status, o.pickup_date, o.return_date, c.name AS customer_name
       FROM orders o JOIN customers c ON c.id = o.customer_id
       ORDER BY (o.status = 'terlambat') DESC, o.id DESC LIMIT 5`
    ),
  ]);
  const byStatus = Object.fromEntries(rentals.rows.map((r) => [r.status, r.n]));
  res.json({
    totalProducts: products.rows[0].n,
    totalAdmins: admins.rows[0].n,
    byCategory: byCategory.rows,
    latestProducts: latest.rows,
    rentals: {
      dibooking: byStatus.dibooking || 0,
      diambil: byStatus.diambil || 0,
      terlambat: byStatus.terlambat || 0,
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      pickupToday: flow.rows[0].pickup_today,
      returnToday: flow.rows[0].return_today,
      monthRevenue: revenue.rows[0].total,
    },
    recentOrders: recent.rows,
  });
});

// ---------- Kelola admin ----------
router.get("/admins", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, email, role, created_at FROM users ORDER BY id"
  );
  res.json(rows);
});

router.post("/admins", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Format email tidak valid." });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ message: "Password minimal 4 karakter." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')
       RETURNING id, email, role, created_at`,
      [email.trim().toLowerCase(), hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Email sudah terdaftar." });
    throw err;
  }
});

router.delete("/admins/:id", async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "Anda tidak bisa menghapus akun sendiri." });
  }
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: "Admin tidak ditemukan." });
  res.json({ message: "Admin dihapus." });
});

export default router;
