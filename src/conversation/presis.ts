import { db, now } from "@/db/sqlite";
import { Sessions, Messages } from "@/db/schema";
import { eq } from "drizzle-orm";
export type Role = "user" | "assistant" | "system";

export function ensureSession(sessionId?: string | null): string {
  if (sessionId) return sessionId;
  const sid = crypto.randomUUID();
  db.insert(Sessions).values({ id: sid, created_at: now() }).execute();
  return sid;
}

export function createMessage(input: {
  id?: string;
  session_id: string;
  request_id: string;
  role: Role;
  content: string;
  is_completed: 0 | 1;
  knowledge_references?: string | null;
}) {
  const id = input.id ?? crypto.randomUUID();
  const ts = now();
  db.insert(Messages)
    .values({
      id,
      session_id: input.session_id,
      request_id: input.request_id,
      role: input.role,
      content: input.content,
      is_completed: input.is_completed,
      knowledge_references: input.knowledge_references ?? null,
      created_at: ts,
      updated_at: ts,
    })
    .execute();
  return id;
}

export function persistRoundStart(
  sessionId: string,
  requestId: string,
  userText: string
) {
  createMessage({
    session_id: sessionId,
    request_id: requestId,
    role: "user",
    content: userText,
    is_completed: 1,
  });
  const assistantMsgId = createMessage({
    session_id: sessionId,
    request_id: requestId,
    role: "assistant",
    content: "",
    is_completed: 0,
  });
  return { assistantMsgId };
}

export function persistRoundFinish(assistantMsgId: string, content: string) {
  db.update(Messages)
    .set({ content, is_completed: 1, updated_at: now() })
    .where(eq(Messages.id, assistantMsgId))
    .execute();
}
