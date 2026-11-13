// Menjalankan migrasi lalu memastikan akun admin awal ada. Aman dijalankan berulang: npm run db:init
import bcrypt from "bcryptjs";
import pool from "./db.js";
import { migrate } from "./migrate.js";

await migrate();

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
