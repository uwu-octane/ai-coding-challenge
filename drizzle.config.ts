import type { Config } from "drizzle-kit";

// Use SQLite file inside container; allow override via DB_FILE
const dbFile = process.env.DB_FILE || "/app/data.sqlite";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${dbFile}`,
  },
} satisfies Config;
