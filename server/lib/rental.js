import pool from "../db.js";

export const ZONA_WAKTU = "Asia/Makassar";

// Status yang masih memakai stok. "terlambat" terus memakai stok sampai dikembalikan.
export const STATUS_PAKAI_STOK = ["dibooking", "diambil", "terlambat"];

export const MAKS_HARI_SEWA = 90;

// Tanggal hari ini menurut zona waktu Asia/Makassar (teks "YYYY-MM-DD").
export const today = async (db = pool) => {
  const { rows } = await db.query(
    `SELECT (NOW() AT TIME ZONE '${ZONA_WAKTU}')::date::text AS d`
  );
  return rows[0].d;
};

// Pesanan berstatus "diambil" yang tanggal kembalinya sudah lewat otomatis menjadi "terlambat".
export const syncOverdue = async (db = pool) => {
  await db.query(
    `UPDATE orders SET status = 'terlambat', updated_at = NOW()
     WHERE status = 'diambil' AND return_date < (NOW() AT TIME ZONE '${ZONA_WAKTU}')::date`
  );
};

// Pemakaian unit per produk per hari pada rentang [from, to].
// Sebuah pesanan memakai stok dari tanggal ambil sampai (tanggal kembali + hari jeda).
// Pesanan "terlambat" memakai stok tanpa batas akhir sampai dikembalikan.
// Hasil: { [productId]: { maks: number, perHari: { "YYYY-MM-DD": number } } }
export const pemakaian = async (db, productIds, from, to, excludeOrderId = null) => {
  const { rows } = await db.query(
    `WITH days AS (
       SELECT ($1::date + i) AS day FROM generate_series(0, $2::date - $1::date) AS i
     )
     SELECT oi.product_id, days.day::text AS day, SUM(oi.quantity)::int AS used
     FROM days
     JOIN orders o
       ON o.status IN ('dibooking', 'diambil', 'terlambat')
      AND days.day BETWEEN o.pickup_date
          AND (CASE WHEN o.status = 'terlambat' THEN 'infinity'::date
                    ELSE o.return_date + o.gap_days END)
      AND ($4::int IS NULL OR o.id <> $4::int)
     JOIN order_items oi
       ON oi.order_id = o.id AND oi.product_id = ANY($3::int[])
     GROUP BY oi.product_id, days.day`,
    [from, to, productIds, excludeOrderId]
  );

  const result = Object.fromEntries(productIds.map((id) => [id, { maks: 0, perHari: {} }]));
  for (const r of rows) {
    const entry = result[r.product_id];
    entry.perHari[r.day] = r.used;
    if (r.used > entry.maks) entry.maks = r.used;
  }
  return result;
};

export const bulatkan = (n) => Math.round(Number(n) || 0);
