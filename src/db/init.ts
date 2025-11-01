import { db, now } from "./sqlite";
import { Faqs, Users, Orders, Tickets } from "./schema";

export async function seed() {
  const faqCount = db.select().from(Faqs).all().length;
  if (faqCount > 0) {
    return;
  }
  db.insert(Faqs).values([
    {
      question: "Wie kann ich mein Passwort zurücksetzen?",
      answer:
        "Klicken Sie auf 'Passwort vergessen' auf der Login-Seite. Sie erhalten eine E-Mail mit einem Reset-Link. Falls Sie keine E-Mail erhalten, prüfen Sie Ihren Spam-Ordner.",
      tags: "account,security, technical",
    },
  ]);
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
