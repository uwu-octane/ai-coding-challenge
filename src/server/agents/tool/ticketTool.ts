import {
  CreateTicketInput,
  ReadTicketInput,
  UpdateTicketInput,
} from "@/db/ticket";
import { db, now } from "@/db/sqlite";
import { Tickets } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";
import { tool } from "ai";
import { z } from "zod";
export const createTicketTool = tool({
  description:
    "create a new ticket (tickets). required fields: user_id, subject, content, category; status default open",
  inputSchema: CreateTicketInput,
  execute: async (input) => {
    const id = input.id ?? crypto.randomUUID();
    const ts = now();
    await db
      .insert(Tickets)
      .values({
        id,
        user_id: input.user_id,
        status: input.status ?? "open",
        subject: input.subject,
        content: input.content,
        category: input.category,
        created_at: ts,
        updated_at: ts,
      })
      .execute();

    return { ok: true, data: { id }, message: "ticket created" };
  },
});

// 2) Read
export const readTicketTool = tool({
  description:
    "read a ticket. if id is provided, query exactly; otherwise, query by conditions (user_id/status/category/subject_like/content_like) with pagination",
  inputSchema: ReadTicketInput,
  execute: async (input) => {
    if (input.id) {
      const rows = db
        .select()
        .from(Tickets)
        .where(eq(Tickets.id, input.id))
        .limit(1)
        .all() as Array<typeof Tickets.$inferSelect>;

      return { ok: true, data: rows[0] ?? null };
    }

    const wheres = [];
    if (input.user_id !== undefined)
      wheres.push(eq(Tickets.user_id, input.user_id));
    if (input.status) wheres.push(eq(Tickets.status, input.status));
    if (input.category) wheres.push(eq(Tickets.category, input.category));
    if (input.subject_like)
      wheres.push(like(Tickets.subject, `%${input.subject_like}%`));
    if (input.content_like)
      wheres.push(like(Tickets.content, `%${input.content_like}%`));

    const whereExpr = wheres.length ? and(...wheres) : undefined;

    const rows = db
      .select()
      .from(Tickets)
      .where(whereExpr as any)
      .limit(input.limit)
      .offset(input.offset)
      .all() as Array<typeof Tickets.$inferSelect>;

    return { ok: true, data: rows };
  },
});

// 3) Update
export const updateTicketTool = tool({
  description:
    "update some fields of a ticket (status/subject/content/category). not support delete",
  inputSchema: UpdateTicketInput,
  execute: async (input) => {
    const patch: Partial<typeof Tickets.$inferInsert> = {};
    if (input.status) patch.status = input.status;
    if (input.subject) patch.subject = input.subject;
    if (input.content) patch.content = input.content;
    if (input.category) patch.category = input.category;

    if (Object.keys(patch).length === 0) {
      return { ok: false, message: "no fields to update" };
    }

    patch.updated_at = now();

    await db
      .update(Tickets)
      .set(patch)
      .where(eq(Tickets.id, input.id))
      .execute();
    return { ok: true, data: { id: input.id }, message: "ticket updated" };
  },
});

export const dummyTool = tool({
  description:
    "no-action-tool, inform supervisor that additional information is required",
  inputSchema: z.object({
    missing: z.array(z.string()).default([]).describe("list of missing fields"),
    reason: z
      .string()
      .default("unclear request or missing required parameters"),
  }),
  execute: async (input) => {
    return {
      ok: false,
      data: {
        reflect: {
          missing: input.missing,
          reason: input.reason,
        },
      },
      message: "reflect_required",
    };
  },
});
