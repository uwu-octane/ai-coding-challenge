import { z } from "zod";

export const ToolCallSchema = z.object({
  tool: z.string(),
  input: z.record(z.string(), z.any()).optional().default({}),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;
export const ToolResultSchema = z.object({
  ok: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;
