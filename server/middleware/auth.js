import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "ganti-secret-ini-di-env";

export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

// Memastikan token valid DAN akun admin masih ada di database
// (akun yang sudah dihapus tidak bisa memakai token lamanya).
export const requireAdmin = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Login diperlukan." });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
  }

  const { rows } = await pool.query(
    "SELECT id, email, role FROM users WHERE id = $1",
    [payload.id]
  );
  if (!rows[0]) return res.status(401).json({ message: "Akun tidak ditemukan." });
  if (rows[0].role !== "admin") {
    return res.status(403).json({ message: "Hanya admin yang boleh." });
  }
  req.user = rows[0];
  next();
};
