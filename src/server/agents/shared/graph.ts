import type { ModelMessage } from "ai";
import { KnowledgeAgentOutput } from "./knowledge";
import { SupervisorDecision } from "./supervisor";
import { GraphState } from "../graph/graphContext";
export type AgentTraceEvent = {
  at: number; // epoch ms
  node: "supervisor" | "knowledge" | "action" | "answer";
  note: string;
  data?: unknown;
};

export interface GraphState {
  sessionId: string;
  requestId: string;

  userQuery: string;
  messages: ModelMessage[];

  decision?: SupervisorDecision;

  toolCall?: unknown;
  toolResult?: unknown;

  knowledgeRefs: KnowledgeAgentOutput["results"];

  answer?: string;
}

export function pushTrace(
  state: typeof GraphState.State,
  evt: Omit<AgentTraceEvent, "at">
): AgentTraceEvent[] {
  return [...(state.trace ?? []), { ...evt, at: Date.now() }];
}
