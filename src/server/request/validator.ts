import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const validateJson = <T extends z.ZodTypeAny>(schema: T) =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid request body",
            details: z.treeifyError(result.error),
          },
        },
        400
      );
    }
  });

export const ChatRequestSchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
  message: z.string().min(1, "message can't be empty").max(8000),
  context: z.record(z.string(), z.any()).optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
