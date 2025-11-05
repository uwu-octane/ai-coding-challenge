import { z } from "zod";

export const ChatRequestSchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
  message: z.string().min(1, "message can't be empty").max(8000),
  context: z.record(z.string(), z.any()).optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const NewChatRequestSchema = z.object({
  metadata: z.record(z.string(), z.any()).optional(),
});
export type NewChatRequest = z.infer<typeof NewChatRequestSchema>;

export type NewChatResponse = {
  sessionId: string;
};
