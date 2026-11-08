import "dotenv/config";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pool from "./db.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password.length < 12) {
  throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env.");
}

try {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const schema = await fs.readFile(path.join(currentDirectory, "schema.sql"), "utf8");
  await pool.query(schema);

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [email, passwordHash]
  );
  console.log(`Admin account ${email} is ready.`);
} finally {
  await pool.end();
}
