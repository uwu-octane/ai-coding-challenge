import { Annotation } from "@langchain/langgraph";
import { AgentTraceEvent } from "../shared/graph";
import { KnowledgeAgentOutput } from "../shared/knowledge";
import type { ModelMessage } from "ai";

export const GraphState = Annotation.Root({
  sessionId: Annotation<string>(),
  requestId: Annotation<string>(),
  userQuery: Annotation<string>(),

  //using reducer to merge the nodes
  messages: Annotation<ModelMessage[]>({
    reducer: (prev, next) => prev.concat(next),
  }),
  decision: Annotation<import("../shared/supervisor").SupervisorDecision>({
    reducer: (prev, next) => ({ ...(prev ?? {}), ...(next ?? {}) }),
  }),

  toolCall: Annotation<import("../shared/action").ToolCall | null>({
    reducer: (_, next) => next ?? null,
  }),
  toolResult: Annotation<import("../shared/action").ToolResult | null>({
    reducer: (_, next) => next ?? null,
  }),
  knowledgeRefs: Annotation<KnowledgeAgentOutput["results"]>({
    reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
  }),

  trace: Annotation<import("../shared/graph").AgentTraceEvent[]>({
    reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
  }),
});

export function mergeMessages(
  prev: ModelMessage[] | undefined,
  next: ModelMessage[]
) {
  const merged = [...(prev ?? []), ...next];
  const MAX = 200;
  return merged.length > MAX ? merged.slice(-MAX) : merged;
}

export function pushTrace(
  state: typeof GraphState.State,
  evt: Omit<AgentTraceEvent, "at">
): AgentTraceEvent[] {
  return [...(state.trace ?? []), { ...evt, at: Date.now() }];
}
