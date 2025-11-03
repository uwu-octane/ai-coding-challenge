import { z } from "zod";

export const IntentEnum = z.enum(["technical", "billing", "general"]);
export type Intent = z.infer<typeof IntentEnum>;

export const PhaseEnum = z.enum([
  "INTENT",
  "KNOWLEDGE",
  "TOOL",
  "REFLECT",
  "SUMMARY",
  "ANSWER",
]);
export type Phase = z.infer<typeof PhaseEnum>;

export const RouteEnum = z.enum([
  "to_knowledge",
  "to_tool",
  "to_reflect",
  "to_summary",
  "to_answer",
  "finish",
]);
export type Route = z.infer<typeof RouteEnum>;

export const ToolCallSchema = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.any()).optional().default({}),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

/** Supervisor standard decision output (returned for each phase) */
export const SupervisorDecisionSchema = z.object({
  phase: PhaseEnum, // Current phase of the decision
  route: RouteEnum, // Next step
  reason: z.string().optional(), // Decision reason (for observation)
  // Unified payload: different fields can be filled for each phase
  payload: z
    .object({
      // INTENT phase (rewrite/requery)
      intent: z.enum(["technical", "billing", "general"]).optional(),
      need_requery: z.boolean().optional(),
      requery_text: z.string().optional(),
      keywords: z.array(z.string()).optional(),

      // KNOWLEDGE phase (artifact/decision)
      suggested_tool: z
        .object({ tool: z.string(), reason: z.string().optional() })
        .nullable()
        .optional(),
      required_fields: z.array(z.string()).optional(),
      extracted_args: z.record(z.string(), z.any()).optional(),

      // TOOL phase (specific tool to call)
      tool_call: ToolCallSchema.nullable().optional(),

      // REFLECT phase (what to ask user)
      missing_fields: z.array(z.string()).optional(),
      reflect_question: z.string().optional(),

      // SUMMARY/ANSWER phase (whether there is a draft/whether to answer directly)
      draft_answer: z.string().optional(),
    })
    .default({}),
});
export type SupervisorDecision = z.infer<typeof SupervisorDecisionSchema>;

export type ToolResult =
  | { ok: true; data: any }
  | { ok: false; error: { code: string; message: string } };

export const KnowledgeAgentInputSchema = z.object({
  query: z.string().min(1, "query required"),
  top_k: z.number().int().min(1).max(50).default(5),
  mode: z.enum(["vector", "bm25", "hybrid"]).default("vector"),
});

export type KnowledgeAgentInput = z.infer<typeof KnowledgeAgentInputSchema>;

export const KnowledgeAgentOutputSchema = z.object({
  mode: z.enum(["vector", "bm25", "hybrid"]),
  count: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      answer: z.string(),
      tags: z.string().nullable().optional(),
      score: z.number().min(0).max(1),
    })
  ),
});

export type KnowledgeAgentOutput = z.infer<typeof KnowledgeAgentOutputSchema>;

export type AnswerDraft = {
  text: string;
  meta?: {
    route?: string;
    tool_call?: ToolCall | null;
    tool_result?: ToolResult | null;
    knowledge_refs?: KnowledgeAgentOutput["results"] | null;
  };
};

export type AgentTraceEvent = {
  at: number; // epoch ms
  node:
    | "supervisor"
    | "knowledge"
    | "action"
    | "reflect"
    | "summary"
    | "answer";
  note: string;
  data?: unknown;
};
