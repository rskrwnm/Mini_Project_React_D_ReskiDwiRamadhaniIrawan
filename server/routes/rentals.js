import { Router } from "express";
import pool from "../db.js";
import { getSettings } from "./settings.js";
import { addDays, diffDays, escapeLike, isValidDate, normalizeWa } from "../lib/format.js";
import { MAKS_HARI_SEWA, pemakaian, syncOverdue, today } from "../lib/rental.js";

// Dipasang di router admin (sudah dilindungi requireAdmin).
const router = Router();

const IDENTITY_TYPES = ["KTP", "SIM", "Kartu Pelajar", "KTM", "Paspor"];
const STATUSES = ["dibooking", "diambil", "terlambat", "dikembalikan", "selesai", "dibatalkan"];

const isPosInt = (v) => Number.isInteger(v) && v > 0;
const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;

// ---------------------------------------------------------------- pelanggan
router.get("/customers", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  const like = `%${escapeLike(q)}%`;
  const { rows } = await pool.query(
    `SELECT id, name, phone, identity_type, identity_number, address
     FROM customers
     WHERE name ILIKE $1 OR phone ILIKE $1
     ORDER BY name LIMIT 10`,
    [like]
  );
  res.json(rows);
});

// ---------------------------------------------------------- ketersediaan
// Sisa unit tiap produk untuk rentang tanggal ambil..kembali (+ hari jeda).
router.get("/availability", async (req, res) => {
  const { pickup, return: ret, exclude_order } = req.query;
  if (!isValidDate(pickup) || !isValidDate(ret) || ret < pickup) {
    return res.status(400).json({ message: "Tanggal ambil/kembali tidak valid." });
  }
  if (diffDays(pickup, ret) > MAKS_HARI_SEWA) {
    return res.status(400).json({ message: `Lama sewa maksimal ${MAKS_HARI_SEWA} hari.` });
  }

  await syncOverdue();
  const settings = await getSettings();
  const gap = Number(settings.gap_days);
  const { rows: products } = await pool.query("SELECT id, name, stock FROM products ORDER BY id");
  const usage = await pemakaian(
    pool,
    products.map((p) => p.id),
    pickup,
    addDays(ret, gap),
    exclude_order ? Number(exclude_order) : null
  );

  res.json(
    products.map((p) => ({
      product_id: p.id,
      name: p.name,
      stock: p.stock,
      used: usage[p.id].maks,
      available: Math.max(0, p.stock - usage[p.id].maks),
    }))
  );
});

// Kalender ketersediaan satu produk untuk satu bulan.
router.get("/products/:id/calendar", async (req, res) => {
  const month = String(req.query.month || "");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ message: "Parameter month harus berformat YYYY-MM." });
  }
  const { rows: prod } = await pool.query(
    "SELECT id, name, stock FROM products WHERE id = $1",
    [req.params.id]
  );
  if (!prod[0]) return res.status(404).json({ message: "Produk tidak ditemukan." });

  await syncOverdue();
  const first = `${month}-01`;
  const last = addDays(
    new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1)).toISOString().slice(0, 10),
    -1
  );
  const usage = await pemakaian(pool, [prod[0].id], first, last);

  const { rows: bookings } = await pool.query(
    `SELECT o.id AS order_id, o.status, o.pickup_date, o.return_date,
            CASE WHEN o.status = 'terlambat' THEN NULL ELSE (o.return_date + o.gap_days)::text END AS blocked_until,
            oi.quantity, c.name AS customer_name
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = $1
     JOIN customers c ON c.id = o.customer_id
     WHERE o.status IN ('dibooking', 'diambil', 'terlambat')
       AND o.pickup_date <= $3::date
       AND (o.status = 'terlambat' OR o.return_date + o.gap_days >= $2::date)
     ORDER BY o.pickup_date, o.id`,
    [prod[0].id, first, last]
  );

  const days = [];
  for (let d = first; d <= last; d = addDays(d, 1)) {
    const used = usage[prod[0].id].perHari[d] || 0;
    days.push({ date: d, used, available: Math.max(0, prod[0].stock - used) });
  }
  res.json({ product: prod[0], month, days, bookings });
});

// --------------------------------------------------------------- pesanan
const ORDER_SELECT = `
  SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
         c.identity_type, c.identity_number, c.address AS customer_address,
         (SELECT json_agg(json_build_object(
                   'product_id', oi.product_id, 'name', p.name, 'quantity', oi.quantity,
                   'price_per_day', oi.price_per_day, 'deposit', oi.deposit) ORDER BY oi.id)
          FROM order_items oi JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id) AS items
  FROM orders o JOIN customers c ON c.id = o.customer_id`;

const decorate = (order, todayStr) => {
  const overdueDays =
    order.status === "terlambat" || (order.status === "diambil" && order.return_date < todayStr)
      ? Math.max(0, diffDays(order.return_date, todayStr))
      : 0;
  return {
    ...order,
    overdue_days: overdueDays,
    estimated_late_fee: overdueDays * order.late_fee_per_day,
  };
};

const getOrder = async (db, id) => {
  const { rows } = await db.query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  return rows[0] ? decorate(rows[0], await today(db)) : null;
};

const validateCustomer = (c) => {
  if (!c || typeof c !== "object") return { error: "Data penyewa wajib diisi." };
  if (c.id !== undefined && c.id !== null) {
    return Number.isInteger(Number(c.id)) ? { data: { id: Number(c.id) } } : { error: "Penyewa tidak valid." };
  }
  const name = String(c.name || "").trim();
  const phone = normalizeWa(c.phone);
  const identityType = c.identity_type;
  const identityNumber = String(c.identity_number || "").trim();
  const address = String(c.address || "").trim() || null;

  if (name.length < 2 || name.length > 255) return { error: "Nama penyewa wajib diisi (min. 2 karakter)." };
  if (phone.length < 10 || phone.length > 15) return { error: "Nomor WhatsApp penyewa tidak valid (10–15 digit)." };
  if (!IDENTITY_TYPES.includes(identityType)) return { error: "Jenis identitas tidak valid." };
  if (!/^[A-Za-z0-9.\-/ ]{3,50}$/.test(identityNumber)) return { error: "Nomor identitas tidak valid (3–50 karakter)." };
  return { data: { name, phone, identity_type: identityType, identity_number: identityNumber, address } };
};

const validateOrderInput = (body) => {
  const { pickup_date, return_date, items, notes } = body;
  if (!isValidDate(pickup_date) || !isValidDate(return_date)) return { error: "Tanggal ambil dan tanggal kembali wajib diisi." };
  if (return_date < pickup_date) return { error: "Tanggal kembali tidak boleh sebelum tanggal ambil." };
  if (diffDays(pickup_date, return_date) > MAKS_HARI_SEWA) return { error: `Lama sewa maksimal ${MAKS_HARI_SEWA} hari.` };

  if (!Array.isArray(items) || items.length === 0) return { error: "Pilih minimal satu alat." };
  const cleaned = items.map((i) => ({ product_id: Number(i?.product_id), quantity: Number(i?.quantity) }));
  if (cleaned.some((i) => !isPosInt(i.product_id) || !isPosInt(i.quantity))) {
    return { error: "Alat dan jumlah unit harus valid (jumlah minimal 1)." };
  }
  if (new Set(cleaned.map((i) => i.product_id)).size !== cleaned.length) {
    return { error: "Alat yang sama tidak boleh dipilih dua kali. Gabungkan jumlah unitnya." };
  }

  const customer = validateCustomer(body.customer);
  if (customer.error) return { error: customer.error };

  return {
    data: {
      pickup_date,
      return_date,
      items: cleaned.sort((a, b) => a.product_id - b.product_id),
      customer: customer.data,
      notes: String(notes || "").trim() || null,
    },
  };
};

router.post("/orders", async (req, res) => {
  const v = validateOrderInput(req.body);
  if (v.error) return res.status(400).json({ message: v.error });
  const { pickup_date, return_date, items, customer, notes } = v.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await syncOverdue(client);

    if (pickup_date < (await today(client))) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Tanggal ambil tidak boleh sebelum hari ini." });
    }

    const settings = await getSettings(client);
    const gap = Number(settings.gap_days);
    const lateFee = Number(settings.late_fee_per_day);
    const ids = items.map((i) => i.product_id);

    // Kunci baris produk (urut id agar tidak deadlock). Pemesanan yang menyangkut produk
    // yang sama diproses bergantian, jadi cek stok + simpan pesanan aman dari race condition.
    const { rows: products } = await client.query(
      "SELECT id, name, price, deposit, stock FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE",
      [ids]
    );
    if (products.length !== ids.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Ada alat yang tidak ditemukan." });
    }
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));

    // Cek ketersediaan untuk setiap hari pada rentang [ambil, kembali + jeda]
    const usage = await pemakaian(client, ids, pickup_date, addDays(return_date, gap));
    const conflicts = [];
    for (const item of items) {
      const p = byId[item.product_id];
      const available = Math.max(0, p.stock - usage[p.id].maks);
      if (item.quantity > available) {
        conflicts.push({ product_id: p.id, name: p.name, requested: item.quantity, available });
      }
    }
    if (conflicts.length) {
      await client.query("ROLLBACK");
      const detail = conflicts
        .map((c) => `${c.name} (diminta ${c.requested}, tersedia ${c.available})`)
        .join("; ");
      return res.status(409).json({
        message: `Stok tidak cukup pada tanggal tersebut: ${detail}.`,
        conflicts,
      });
    }

    // Pelanggan: pakai yang sudah ada, atau buat/perbarui berdasarkan identitas
    let customerId;
    if (customer.id) {
      const { rows } = await client.query("SELECT id FROM customers WHERE id = $1", [customer.id]);
      if (!rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Penyewa tidak ditemukan." });
      }
      customerId = rows[0].id;
    } else {
      const { rows } = await client.query(
        `INSERT INTO customers (name, phone, identity_type, identity_number, address)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (identity_type, identity_number)
         DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone,
                       address = COALESCE(EXCLUDED.address, customers.address)
         RETURNING id`,
        [customer.name, customer.phone, customer.identity_type, customer.identity_number, customer.address]
      );
      customerId = rows[0].id;
    }

    const days = Math.max(1, diffDays(pickup_date, return_date));
    const perDay = items.reduce((sum, i) => sum + byId[i.product_id].price * i.quantity, 0);
    const rentalTotal = perDay * days;
    const depositTotal = items.reduce((sum, i) => sum + byId[i.product_id].deposit * i.quantity, 0);

    const { rows: created } = await client.query(
      `INSERT INTO orders (customer_id, pickup_date, return_date, days, rental_total, deposit_total,
                           late_fee_per_day, gap_days, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [customerId, pickup_date, return_date, days, rentalTotal, depositTotal, lateFee, gap, notes, req.user.id]
    );
    const orderId = created[0].id;

    for (const item of items) {
      const p = byId[item.product_id];
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_per_day, deposit)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, p.id, item.quantity, p.price, p.deposit]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(await getOrder(pool, orderId));
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
});

router.get("/orders", async (req, res) => {
  await syncOverdue();
  const status = STATUSES.includes(req.query.status) ? req.query.status : null;
  const q = String(req.query.q || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(req.query.per_page, 10) || 10));

  const like = q ? `%${escapeLike(q)}%` : null;
  // Angka dianggap id pesanan hanya jika wajar (maks 9 digit); angka panjang (mis. nomor WA) hanya dicari di nama/WA.
  const idMatch = /^#?\d{1,9}$/.test(q) ? Number(q.replace("#", "")) : null;
  const where = `
    WHERE ($1::text IS NULL OR o.status = $1)
      AND ($2::text IS NULL OR c.name ILIKE $2 OR c.phone ILIKE $2 OR o.id = $3::int)`;
  const params = [status, like, idMatch];

  const [list, total, counts] = await Promise.all([
    pool.query(
      `${ORDER_SELECT} ${where}
       ORDER BY (o.status = 'terlambat') DESC, o.id DESC
       LIMIT $4 OFFSET $5`,
      [...params, perPage, (page - 1) * perPage]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS n FROM orders o JOIN customers c ON c.id = o.customer_id ${where}`,
      params
    ),
    pool.query("SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status"),
  ]);

  const todayStr = await today();
  res.json({
    items: list.rows.map((o) => {
      const d = decorate(o, todayStr);
      // Nomor identitas tidak ditampilkan di daftar (hanya di detail)
      delete d.identity_number;
      delete d.customer_address;
      return d;
    }),
    total: total.rows[0].n,
    page,
    per_page: perPage,
    counts: Object.fromEntries(counts.rows.map((r) => [r.status, r.n])),
  });
});

router.get("/orders/:id", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: "Penyewaan tidak ditemukan." });
  await syncOverdue();
  const order = await getOrder(pool, req.params.id);
  if (!order) return res.status(404).json({ message: "Penyewaan tidak ditemukan." });
  res.json(order);
});

// Perpindahan status yang diizinkan lewat tombol. "terlambat" hanya otomatis,
// "dikembalikan" lewat form pengembalian.
const TRANSISI = {
  dibooking: ["diambil", "dibatalkan"],
  dikembalikan: ["selesai"],
};

router.put("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: "Status tidak valid." });
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: "Penyewaan tidak ditemukan." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT id, status FROM orders WHERE id = $1 FOR UPDATE", [req.params.id]);
    const order = rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Penyewaan tidak ditemukan." });
    }
    if (!(TRANSISI[order.status] || []).includes(status)) {
      await client.query("ROLLBACK");
      const hint =
        status === "dikembalikan" ? " Gunakan form pengembalian." : status === "terlambat" ? " Status terlambat diatur otomatis." : "";
      return res.status(409).json({
        message: `Status tidak bisa diubah dari "${order.status}" ke "${status}".${hint}`,
      });
    }
    await client.query(
      `UPDATE orders SET status = $1::varchar, updated_at = NOW(),
         picked_up_at = CASE WHEN $1::varchar = 'diambil' THEN NOW() ELSE picked_up_at END,
         cancelled_at = CASE WHEN $1::varchar = 'dibatalkan' THEN NOW() ELSE cancelled_at END,
         completed_at = CASE WHEN $1::varchar = 'selesai' THEN NOW() ELSE completed_at END
       WHERE id = $2`,
      [status, order.id]
    );
    await client.query("COMMIT");
    res.json(await getOrder(pool, order.id));
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
});

// Pengembalian: hitung keterlambatan x denda per hari, catat kerusakan, hitung deposit kembali.
router.post("/orders/:id/return", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: "Penyewaan tidak ditemukan." });

  const damageFee = req.body.damage_fee === undefined || req.body.damage_fee === "" ? 0 : Number(req.body.damage_fee);
  const damageNote = String(req.body.damage_note || "").trim() || null;
  if (!isNonNegInt(damageFee)) return res.status(400).json({ message: "Biaya kerusakan harus bilangan bulat >= 0." });
  if (damageFee > 0 && !damageNote) return res.status(400).json({ message: "Isi catatan kerusakan jika ada biaya kerusakan." });
  if (req.body.returned_date !== undefined && req.body.returned_date !== "" && !isValidDate(req.body.returned_date)) {
    return res.status(400).json({ message: "Tanggal pengembalian tidak valid." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await syncOverdue(client);
    const { rows } = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [req.params.id]);
    const order = rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Penyewaan tidak ditemukan." });
    }
    if (!["diambil", "terlambat"].includes(order.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: `Pengembalian hanya bisa dicatat untuk penyewaan berstatus "diambil" atau "terlambat" (sekarang: "${order.status}").`,
      });
    }

    const todayStr = await today(client);
    const returnedDate = req.body.returned_date || todayStr;
    if (returnedDate < order.pickup_date) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Tanggal pengembalian tidak boleh sebelum tanggal ambil." });
    }
    if (returnedDate > todayStr) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Tanggal pengembalian tidak boleh di masa depan." });
    }

    const lateDays = Math.max(0, diffDays(order.return_date, returnedDate));
    const lateFee = lateDays * order.late_fee_per_day;
    const fees = lateFee + damageFee;
    const depositRefund = Math.max(0, order.deposit_total - fees);
    const amountDue = Math.max(0, fees - order.deposit_total);

    await client.query(
      `UPDATE orders SET status = 'dikembalikan', returned_date = $1, late_days = $2, late_fee = $3,
         damage_note = $4, damage_fee = $5, deposit_refund = $6, amount_due = $7, updated_at = NOW()
       WHERE id = $8`,
      [returnedDate, lateDays, lateFee, damageNote, damageFee, depositRefund, amountDue, order.id]
    );
    await client.query("COMMIT");
    res.json(await getOrder(pool, order.id));
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
});

// Isi pesanan tidak bisa diubah (batalkan lalu buat ulang). Hanya catatan yang boleh diedit.
router.put("/orders/:id/notes", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: "Penyewaan tidak ditemukan." });
  const notes = String(req.body.notes || "").trim() || null;
  const { rowCount } = await pool.query("UPDATE orders SET notes = $1, updated_at = NOW() WHERE id = $2", [
    notes,
    req.params.id,
  ]);
  if (!rowCount) return res.status(404).json({ message: "Penyewaan tidak ditemukan." });
  res.json(await getOrder(pool, req.params.id));
});

export default router;
