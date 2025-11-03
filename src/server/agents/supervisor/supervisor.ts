import { Command, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./graphContext";
import {
  Route,
  SupervisorDecision,
  SupervisorDecisionSchema,
  AgentTraceEvent,
  AnswerDraft,
} from "../shared/types";
import { actionNode } from "../actionAgent/actionNode";

const routeToNode: Record<
  Route,
  "knowledge" | "action" | "reflect" | "summary" | "answer" | "__end__"
> = {
  to_knowledge: "knowledge",
  to_tool: "action",
  to_reflect: "reflect",
  to_summary: "summary",
  to_answer: "answer",
  finish: "__end__",
};

function pushTrace(
  state: typeof GraphState.State,
  evt: Omit<AgentTraceEvent, "at">
): AgentTraceEvent[] {
  return [...(state.trace ?? []), { ...evt, at: Date.now() }];
}

async function supervisorNode(state: typeof GraphState.State) {
  const decision: SupervisorDecision = {
    phase: "INTENT",
    route: state.toolCall
      ? "to_tool"
      : !state.knowledgeRefs || state.knowledgeRefs.length === 0
        ? "to_knowledge"
        : state.answer?.text
          ? "to_answer"
          : "to_summary",
    reason: "User is asking about general information",
    payload: {
      intent: "general",
    },
  };
  const parsed = SupervisorDecisionSchema.parse(decision);

  const nextNode = routeToNode[parsed.route];

  return new Command({
    update: {
      decision: parsed,
      trace: pushTrace(state, {
        node: "supervisor",
        note: `route=${parsed.route}`,
      }),
    },
    goto: nextNode,
  });
}

async function knowledgeNode(state: typeof GraphState.State): Promise<Command> {
  return new Command({
    update: {
      knowledgeRefs: [],
      trace: pushTrace(state, { node: "knowledge", note: "stub" }),
    },
    goto: "supervisor",
  });
}

async function reflectNode(state: typeof GraphState.State) {
  const draft: AnswerDraft = {
    text:
      state.answer?.text ??
      "I need more information to continue: please provide the order number or a more specific problem description.",
  };

  return new Command({
    update: {
      answer: draft,
      trace: pushTrace(state, { node: "reflect", note: "ask for details" }),
    },
    goto: "supervisor",
  });
}

async function summaryNode(state: typeof GraphState.State) {
  const parts: string[] = [];

  if (state.knowledgeRefs?.length) {
    parts.push("Knowledge hits:");
    for (const hit of state.knowledgeRefs) {
      parts.push(`• ${hit.answer}`);
    }
  }

  if (state.toolResult?.ok) {
    parts.push("Tool result:");
    parts.push(JSON.stringify(state.toolResult.data));
  }

  const draft: AnswerDraft = {
    text:
      parts.join("\n") ||
      "No knowledge hits available. You can rephrase your query or let me check the FAQ first.",
  };

  return new Command({
    update: {
      answer: { ...(state.answer ?? {}), ...draft },
      trace: pushTrace(state, { node: "summary", note: "compose draft" }),
    },
    goto: "supervisor",
  });
}

async function answerNode(state: typeof GraphState.State) {
  const finalized: AnswerDraft = {
    text: state.answer?.text ?? "Placeholder answer",
  };

  return {
    answer: finalized,
    trace: pushTrace(state, { node: "answer", note: "emit" }),
  };
}

export function buildSupervisor() {
  return new StateGraph(GraphState)
    .addNode("supervisor", supervisorNode, {
      ends: ["knowledge", "action", "reflect", "summary", "answer", "__end__"],
    })
    .addNode("knowledge", knowledgeNode)
    .addNode("action", actionNode)
    .addNode("reflect", reflectNode)
    .addNode("summary", summaryNode)
    .addNode("answer", answerNode)
    .addEdge("__start__", "supervisor")
    .compile();
}

export async function runOnce(input: {
  sessionId: string;
  requestId: string;
  userQuery: string;
}) {
  const app = buildSupervisor();
  return app.invoke({
    ...input,
  } as unknown as typeof GraphState.State);
}
