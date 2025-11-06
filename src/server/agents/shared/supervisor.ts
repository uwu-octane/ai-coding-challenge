import { z } from "zod";
import { ToolResult, ToolCall } from "./action";
import { KnowledgeAgentOutput } from "./knowledge";

export const PhaseEnum = z.enum([
  "INTENT",
  "KNOWLEDGE",
  "TOOL",
  "REFLECT",
  "ANSWER",
]);
export type Phase = z.infer<typeof PhaseEnum>;

export const RouteEnum = z.enum([
  "to_knowledge",
  "to_tool",
  "to_reflect",
  "to_answer",
  "finish",
]);
export type Route = z.infer<typeof RouteEnum>;

export const IntentEnum = z.enum(["technical", "billing", "general"]);
export type Intent = z.infer<typeof IntentEnum>;

/**
 * Supervisor Decision Schema - The unified communication structure
 * between Supervisor and other agents
 */
export const SupervisorDecisionSchema = z.object({
  phase: PhaseEnum,
  route: RouteEnum,
  reason: z.string(),
  intent: IntentEnum.optional(),
  requery_text: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // payload: z
  //   .object({
  //     // INTENT phase - Initial analysis and query rewrite
  //     intent: IntentEnum.optional(),
  //     requery_text: z.string().optional(),
  //     keywords: z.array(z.string()).optional(),

  //     // TOOL phase - Suggested tool to call
  //     suggested_tool: z.string().optional(),

  //     // REFLECT phase - Ask user for missing information
  //     missing_fields: z.array(z.string()).optional(),
  //     reflect_question: z.string().optional(),
  //   })
  //   .optional(),
});

export type SupervisorDecision = z.infer<typeof SupervisorDecisionSchema>;

/**
 * Answer Draft - Final answer structure
 */
export type AnswerDraft = {
  text: string;
  meta?: {
    route?: string;
    tool_call?: ToolCall | null;
    tool_result?: ToolResult | null;
    knowledge_refs?: KnowledgeAgentOutput["results"] | null;
  };
};
