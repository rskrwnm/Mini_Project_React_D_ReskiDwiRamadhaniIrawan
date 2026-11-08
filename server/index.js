import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pool from "./db.js";
import { createToken, requireAdmin, requireAuth } from "./auth.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return res.status(400).json({ message: "Enter a valid email and a password of at least 8 characters." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role",
      [email, passwordHash]
    );
    return res.status(201).json({ message: "Registration successful.", user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    return next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  try {
    const result = await pool.query(
      "SELECT id, email, role, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const publicUser = { id: user.id, email: user.email, role: user.role };
    return res.json({ token: createToken(publicUser), user: publicUser });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/products", async (req, res, next) => {
  const category = typeof req.query.category === "string" ? req.query.category : null;

  try {
    const result = category
      ? await pool.query(
          "SELECT id, name, category, image, description, price FROM products WHERE $1 = ANY(category) ORDER BY id",
          [category]
        )
      : await pool.query(
          "SELECT id, name, category, image, description, price FROM products ORDER BY id"
        );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/products", requireAuth, requireAdmin, async (req, res, next) => {
  const { name, category, image, description, price } = req.body;

  if (!isValidProduct({ name, category, image, description, price })) {
    return res.status(400).json({ message: "All product fields must be valid." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, category, image, description, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, category, image, description, price`,
      [name.trim(), category, image, description.trim(), String(price)]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.put("/api/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const { name, category, image, description, price } = req.body;

  if (!isValidProduct({ name, category, image, description, price })) {
    return res.status(400).json({ message: "All product fields must be valid." });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, category = $2, image = $3, description = $4, price = $5
       WHERE id = $6
       RETURNING id, name, category, image, description, price`,
      [name.trim(), category, image, description.trim(), String(price), req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

function isValidProduct({ name, category, image, description, price }) {
  return (
    typeof name === "string" &&
    name.trim().length > 0 &&
    Array.isArray(category) &&
    category.length > 0 &&
    category.every((value) => typeof value === "string" && value.trim().length > 0) &&
    typeof image === "string" &&
    image.startsWith("data:image/") &&
    typeof description === "string" &&
    description.trim().length > 0 &&
    price !== undefined &&
    Number.isFinite(Number(price)) &&
    Number(price) > 0
  );
}

app.use((error, _req, res, _next) => {
  console.error(error);
  void _next;
  res.status(500).json({ message: "An unexpected server error occurred." });
});

async function start() {
  const schema = await fs.readFile(path.join(currentDirectory, "schema.sql"), "utf8");
  await pool.query(schema);
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API server:", error);
  process.exitCode = 1;
});
