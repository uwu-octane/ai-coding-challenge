import { z } from "zod";

const TicketId = z.string().min(1, "id can't be empty");
const TicketStatus = z
  .enum(["open", "pending", "closed", "archived"])
  .default("open");
const TicketCategory = z.string().min(1, "category can't be empty");

export const CreateTicketInput = z.object({
  id: z.string().uuid().optional(),
  user_id: z.number().int().nonnegative(),
  status: TicketStatus.optional(),
  subject: z.string().min(1),
  content: z.string().min(1),
  category: TicketCategory,
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ReadTicketInput = z.object({
  id: TicketId.optional(),
  user_id: z.number().int().nonnegative().optional(),
  status: TicketStatus.optional(),
  category: z.string().optional(),
  subject_like: z.string().optional(),
  content_like: z.string().optional(),
  limit: z.number().int().positive().max(200).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const UpdateTicketInput = z.object({
  id: TicketId,
  status: TicketStatus.optional(),
  subject: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: TicketCategory.optional(),
});
