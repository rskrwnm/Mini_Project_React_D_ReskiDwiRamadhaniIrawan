// Membuat tabel dan akun admin awal. Jalankan sekali: npm run db:init
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import pool from "./db.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

const sql = fs.readFileSync(path.join(dir, "schema.sql"), "utf8");
await pool.query(sql);

const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const hash = await bcrypt.hash(adminPassword, 10);

await pool.query(
  `INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')
   ON CONFLICT (email) DO NOTHING`,
  [adminEmail, hash]
);

console.log(`Database siap. Admin: ${adminEmail}`);
await pool.end();
