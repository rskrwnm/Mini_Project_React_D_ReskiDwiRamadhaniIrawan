// Menjalankan migrasi di server/migrations/*.sql yang belum pernah dijalankan.
// Jalankan: npm run db:migrate
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

export const migrate = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  const done = new Set(
    (await pool.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name)
  );
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const applied = [];

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      applied.push(file);
      console.log(`Migrasi dijalankan: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Migrasi GAGAL: ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }

  if (applied.length === 0) console.log("Database sudah up to date.");
  return applied;
};

// Dijalankan langsung dari CLI
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    await migrate();
  } finally {
    await pool.end();
  }
}
