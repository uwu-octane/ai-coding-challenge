import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
export const Sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  created_at: integer("created_at").notNull(),
});

export const Messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  session_id: text("session_id").notNull(),
  request_id: text("request_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  is_completed: integer("is_completed").notNull(), // 0/1
  knowledge_references: text("knowledge_references"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export type MessageInsertInput = Omit<
  typeof Messages.$inferInsert,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export const Faqs = sqliteTable("faqs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  tags: text("tags"),
});

export const Users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const Orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  status: text("status").notNull(),
  item: text("item").notNull(),
  total: real("total").notNull(),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const Tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  status: text("status").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});
// export async function initSchema() {
//   db.exec(`
//         PRAGMA journal_mode = WAL;
//         PRAGMA foreign_keys = ON;
//       `);

//   db.exec(`
//         CREATE TABLE IF NOT EXISTS sessions(
//           id TEXT PRIMARY KEY,
//           created_at INTEGER
//         );

//         CREATE TABLE IF NOT EXISTS messages(
//           id TEXT PRIMARY KEY,
//           session_id TEXT,
//           request_id TEXT,
//           role TEXT,
//           content TEXT,
//           is_completed INTEGER,
//           knowledge_references TEXT,
//           created_at INTEGER,
//           updated_at INTEGER
//         );

//         CREATE TABLE IF NOT EXISTS faqs(
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           question TEXT,
//           answer TEXT,
//           tags TEXT
//         );

//         CREATE TABLE IF NOT EXISTS users(
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           name TEXT
//         );

//         CREATE TABLE IF NOT EXISTS orders(
//           id TEXT PRIMARY KEY,
//           user_id INTEGER,
//           status TEXT,
//           item TEXT,
//           total REAL,
//           created_at INTEGER,
//           updated_at INTEGER
//         );

//         CREATE TABLE IF NOT EXISTS tickets(
//           id TEXT PRIMARY KEY,
//           user_id INTEGER,
//           status TEXT,
//           subject TEXT,
//           content TEXT,
//           category TEXT,
//           created_at INTEGER,
//           updated_at INTEGER
//         );

//         CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at);
//         CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
//       `);
// }
