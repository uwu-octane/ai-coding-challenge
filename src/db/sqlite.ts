import Database from "bun:sqlite";
import path from "path";
import fs from "fs";
import { drizzle } from "drizzle-orm/bun-sqlite";

const DB_FILE =
  process.env.DB_FILE || path.resolve(process.cwd(), "data.sqlite");

const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(DB_FILE);

export const db = drizzle(sqlite);
export const sqliteDb = sqlite; // Export raw SQLite instance for direct SQL execution

export const now = (): number => {
  return Math.floor(Date.now() / 1000);
};

// Initialize database schema - create tables if they don't exist
export async function ensureTables() {
  const statements = [
    "PRAGMA journal_mode = WAL",
    "PRAGMA foreign_keys = ON",
    `CREATE TABLE IF NOT EXISTS sessions(
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS messages(
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      request_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      is_completed INTEGER NOT NULL,
      knowledge_references TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS faqs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      tags TEXT,
      embedding BLOB,
      embedded INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS orders(
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      item TEXT NOT NULL,
      total REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS tickets(
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    "CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id)",
  ];

  for (const sql of statements) {
    sqliteDb.run(sql);
  }
  console.log("Database tables ensured");
}
