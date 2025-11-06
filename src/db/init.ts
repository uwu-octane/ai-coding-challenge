import { db, now, sqliteDb } from "./sqlite";
import { ensureTables } from "./sqlite";
import { Faqs, Users, Orders, Tickets } from "./schema";
import { existsSync, readFileSync } from "fs";
import { embed } from "../server/embedding/embedding";
import { f32ToBuffer, toContent, type FaqJson } from "./vec";
import { eq } from "drizzle-orm";

export async function seedFaq(path: string) {
  if (!existsSync(path)) {
    throw new Error(`File ${path} does not exist`);
  }
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw) as FaqJson;
  let inserted = 0;

  // Check if embedding column exists, add it if not
  try {
    const cols = sqliteDb.prepare(`PRAGMA table_info(faqs)`).all() as Array<{
      name: string;
    }>;
    const columnNames = cols.map((r) => r.name);
    if (!columnNames.includes("embedding")) {
      sqliteDb.run(`ALTER TABLE faqs ADD COLUMN embedding BLOB`);
    }
  } catch (err) {
    // Table might not exist yet, but ensureTables should have created it
    // If it still doesn't exist, the error will be caught later
    console.warn("Could not check for embedding column:", err);
  }
  await db.transaction(async (tx) => {
    for (const category of Object.keys(data) as (keyof FaqJson)[]) {
      const entries = data[category];
      for (const entry of entries) {
        // Check if FAQ already exists
        const existing = await tx
          .select()
          .from(Faqs)
          .where(eq(Faqs.question, entry.question))
          .limit(1);

        // Only process if embedded = 0 or doesn't exist
        if (existing.length === 0 || existing[0].embedded === 0) {
          const content = toContent(entry.question, entry.answer);
          const [vector] = await embed([content]);

          if (existing.length === 0) {
            // Insert new FAQ
            await tx.insert(Faqs).values({
              question: entry.question,
              answer: entry.answer,
              tags: category,
              embedding: f32ToBuffer(vector),
              embedded: 1,
            });
            console.log(`Inserted FAQ: ${entry.question}`);
            inserted++;
          } else {
            // Update existing FAQ with embedding
            await tx
              .update(Faqs)
              .set({
                answer: entry.answer,
                tags: category,
                embedding: f32ToBuffer(vector),
                embedded: 1,
              })
              .where(eq(Faqs.question, entry.question));
            console.log(`Updated FAQ embedding: ${entry.question}`);
            inserted++;
          }
        } else {
          console.log(`Skipped FAQ (already embedded): ${entry.question}`);
        }
      }
    }
  });

  return inserted;
}

export async function seed() {
  // Ensure tables (defensive)
  ensureTables();
  await seedFaq("support_data/faq_data.json");
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
