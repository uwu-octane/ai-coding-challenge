import { Database } from "bun:sqlite";
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

export const now = (): number => {
  return Math.floor(Date.now() / 1000);
};
