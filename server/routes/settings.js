import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { normalizeWa } from "../lib/format.js";

const router = Router();

export const getSettings = async (db = pool) => {
  const { rows } = await db.query("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
};

// Publik: hanya nomor WhatsApp untuk tombol "Sewa via WhatsApp".
router.get("/settings/public", async (req, res) => {
  const s = await getSettings();
  res.json({ wa_admin: s.wa_admin || "" });
});

router.get("/admin/settings", requireAdmin, async (req, res) => {
  const s = await getSettings();
  res.json({
    wa_admin: s.wa_admin || "",
    late_fee_per_day: Number(s.late_fee_per_day),
    gap_days: Number(s.gap_days),
  });
});

router.put("/admin/settings", requireAdmin, async (req, res) => {
  const wa = normalizeWa(req.body.wa_admin);
  const fee = Number(req.body.late_fee_per_day);
  const gap = Number(req.body.gap_days);

  if (wa && (wa.length < 10 || wa.length > 15)) {
    return res.status(400).json({ message: "Nomor WhatsApp tidak valid (10–15 digit)." });
  }
  if (!Number.isInteger(fee) || fee < 0) {
    return res.status(400).json({ message: "Denda per hari harus bilangan bulat >= 0." });
  }
  if (!Number.isInteger(gap) || gap < 0 || gap > 30) {
    return res.status(400).json({ message: "Hari jeda harus 0–30." });
  }

  const entries = { wa_admin: wa, late_fee_per_day: String(fee), gap_days: String(gap) };
  for (const [key, value] of Object.entries(entries)) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
  }
  res.json({ wa_admin: wa, late_fee_per_day: fee, gap_days: gap });
});

export default router;
