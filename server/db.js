import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Kolom DATE dikembalikan sebagai teks "YYYY-MM-DD" (bukan objek Date JS),
// supaya tanggal sewa tidak bergeser akibat konversi zona waktu.
pg.types.setTypeParser(1082, (value) => value);

const pool = new pg.Pool({
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || "rentcampy",
});

export default pool;
