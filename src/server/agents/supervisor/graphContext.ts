import { Annotation } from "@langchain/langgraph";
import { KnowledgeAgentOutput } from "../shared/types";

export const GraphState = Annotation.Root({
  sessionId: Annotation<string>(),
  requestId: Annotation<string>(),
  userQuery: Annotation<string>(),

  //using reducer to merge the nodes
  decision: Annotation<import("../shared/types").SupervisorDecision>({
    reducer: (prev, next) => ({ ...(prev ?? {}), ...(next ?? {}) }),
  }),

  toolCall: Annotation<import("../shared/types").ToolCall | null>({
    reducer: (_, next) => next ?? null,
  }),
  toolResult: Annotation<import("../shared/types").ToolResult | null>({
    reducer: (_, next) => next ?? null,
  }),
  knowledgeRefs: Annotation<KnowledgeAgentOutput["results"]>({
    reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
  }),

  answer: Annotation<import("../shared/types").AnswerDraft>({
    reducer: (prev, next) => ({ ...(prev ?? {}), ...(next ?? {}) }),
  }),
  trace: Annotation<import("../shared/types").AgentTraceEvent[]>({
    reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
  }),

  debug: Annotation<{
    route?: "action" | "knowledge" | "direct" | "failAction";
    toolCall?: { tool: string; args: Record<string, any> } | null;
  }>({
    reducer: (prev, next) => ({ ...(prev ?? {}), ...(next ?? {}) }),
  }),
});
