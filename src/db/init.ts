import { db, now } from "./sqlite";
import { ensureTables } from "./sqlite";
import { Faqs, Users, Orders, Tickets } from "./schema";
import { existsSync, readFileSync } from "fs";
import { embed } from "../server/embedding/embedding";
import { f32ToBuffer, toContent, type FaqJson } from "./vec";

export async function seedFaq(path: string) {
  if (!existsSync(path)) {
    throw new Error(`File ${path} does not exist`);
  }
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw) as FaqJson;
  let inserted = 0;
  const cols = db
    .all<{ name: string }>(`PRAGMA table_info(faqs)`)
    .map((r) => r.name);
  if (!cols.includes("embedding")) {
    db.run(`ALTER TABLE faqs ADD COLUMN embedding BLOB`);
  }
  await db.transaction(async (tx) => {
    tx.run(`DELETE FROM faqs`);

    for (const category of Object.keys(data) as (keyof FaqJson)[]) {
      const entries = data[category];
      for (const entry of entries) {
        const content = toContent(entry.question, entry.answer);

        const [vector] = await embed([content]);

        await tx.insert(Faqs).values({
          question: entry.question,
          answer: entry.answer,
          tags: category,
          embedding: f32ToBuffer(vector),
        });
        console.log(`Inserted FAQ: ${entry.question}`);
        inserted++;
      }
    }
  });

  return inserted;
}

export async function seed() {
  // Ensure tables (defensive)
  ensureTables();

  //const count = await seedFaq("support_data/faq_data.json");
  const faqCount = db.select().from(Faqs).all().length;
  if (faqCount > 0) {
    return;
  }

  db.insert(Users).values([
    {
      name: "Alice",
      created_at: now(),
      updated_at: now(),
    },
    {
      name: "Bob",
      created_at: now(),
      updated_at: now(),
    },
  ]);
  db.insert(Orders).values([
    {
      id: "A1001",
      user_id: 1,
      status: "delivered",
      item: "Product 1",
      total: 129.9,
      created_at: now(),
      updated_at: now(),
    },
    {
      id: "A1002",
      user_id: 2,
      status: "processing",
      item: "Product 2",
      total: 59.0,
      created_at: now(),
      updated_at: now(),
    },
  ]);
  db.insert(Tickets).values([
    {
      id: "T1001",
      user_id: 1,
      status: "open",
      subject: "password reset",
      content:
        "Ich habe mein Passwort vergessen und komme nicht mehr in meinen Account.",
      category: "technical",
      created_at: now(),
      updated_at: now(),
    },
    {
      id: "T1002",
      user_id: 2,
      status: "open",
      subject: "App stürzt beim Start ab",
      content: "Ich kann die App nicht öffnen. Sie stürzt beim Start ab.",
      category: "technical",
      created_at: now(),
      updated_at: now(),
    },
  ]);
}
