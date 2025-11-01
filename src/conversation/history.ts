import { db } from "@/db/sqlite";
import { Messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type LlmMessage =
  | { role: "system"; content: string }
  | { role: "user" | "assistant"; content: string };

type Raw = typeof Messages.$inferSelect;

export function buildHistoryMessages(
  sessionId: string,
  N = 50,
  MaxRounds = 5,
  systemPrompt?: string
) {
  //select last N messages by session_id
  const rows = db
    .select()
    .from(Messages)
    .where(eq(Messages.session_id, sessionId))
    .orderBy(desc(Messages.created_at))
    .limit(N)
    .all() as Raw[];

  //group by request_id
  //request-id -> messages
  const byReq = new Map<string, Raw[]>();
  for (const r of rows) {
    const arr = byReq.get(r.request_id) ?? [];
    arr.push(r);
    byReq.set(r.request_id, arr);
  }

  const pairs: { user: Raw; assistant: Raw; ts: number }[] = [];
  for (const [_, msgs] of byReq) {
    const user = msgs.find((m) => m.role === "user" && m.is_completed === 1);
    const assistant = msgs.find(
      (m) => m.role === "assistant" && m.is_completed === 1
    );
    //make user - assistant chat pairs
    if (user && assistant) {
      pairs.push({
        user,
        assistant,
        ts: Math.max(user.created_at, assistant.created_at),
      });
    }
  }

  const latest = pairs.sort((a, b) => a.ts - b.ts).slice(-MaxRounds);

  const out: LlmMessage[] = [];
  if (systemPrompt) out.push({ role: "system", content: systemPrompt });
  for (const p of latest) {
    out.push({ role: "user", content: p.user.content });
    out.push({ role: "assistant", content: p.assistant.content });
  }
  return out;
}
