import { Annotation } from "@langchain/langgraph";
import { KnowledgeAgentOutput } from "../shared/knowledge";
import type { ModelMessage } from "ai";
import crypto from "crypto";

export const GraphState = Annotation.Root({
  sessionId: Annotation<string>(),
  requestId: Annotation<string>(),
  userQuery: Annotation<string>(),
  count: Annotation<number>(),

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

type TraceEntry = {
  node: string;
  note: string;
  at?: number;
  id?: string;
  origin?: string;
};

export function pushTrace(
  _state: any,
  entry: Omit<TraceEntry, "at" | "id">
): TraceEntry[] {
  const at = Date.now();
  const id = crypto
    .createHash("sha1")
    .update(`${entry.node}|${entry.note}|${at}`)
    .digest("hex")
    .slice(0, 12);
  if (
    Array.isArray(_state?.trace) &&
    _state.trace.some((e: TraceEntry) => e.id === id)
  ) {
    return [];
  }
  // return the incremental array
  return [{ ...entry, at, id }];
}
