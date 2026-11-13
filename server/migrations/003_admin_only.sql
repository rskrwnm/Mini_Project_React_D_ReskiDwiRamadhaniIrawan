-- Pelanggan tidak punya akun. Tabel users hanya untuk admin.
-- PENTING: jalankan backup (pg_dump) sebelum migrasi ini; akun non-admin dihapus.

DELETE FROM users WHERE role <> 'admin';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role = 'admin');
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';
