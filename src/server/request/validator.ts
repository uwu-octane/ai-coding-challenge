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
