import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { requireAdmin, signToken } from "../middleware/auth.js";

const router = Router();

// Login hanya untuk admin. Pelanggan tidak punya akun.
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi." });
  }
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
});

// Dipakai frontend untuk memverifikasi sesi dari sumber yang benar (database).
router.get("/me", requireAdmin, (req, res) => {
  res.json({ user: req.user });
});

export default router;
