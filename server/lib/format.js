// Normalisasi nomor WA ke format internasional tanpa tanda (628xxxxxxxxxx).
export const normalizeWa = (input) => {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
};

// Tanggal "YYYY-MM-DD" yang benar-benar ada di kalender.
export const isValidDate = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) &&
  new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

// Aritmetika tanggal murni (UTC) pada teks "YYYY-MM-DD" -> tidak terpengaruh zona waktu.
export const addDays = (s, n) =>
  new Date(Date.parse(`${s}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export const diffDays = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

export const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
