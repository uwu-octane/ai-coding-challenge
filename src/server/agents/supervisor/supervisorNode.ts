import { Command } from "@langchain/langgraph";
import { GraphState } from "../graph/graphContext";
import { SupervisorDecisionSchema } from "../shared/supervisor";
import { pushTrace } from "../shared/graph";
import { supervisorDecision } from "./supervisorAgent";

// Map route values to actual node names in the graph
function routeToNodeName(route: string): string {
  const routeMap: Record<string, string> = {
    to_knowledge: "knowledge",
    to_tool: "action",
    to_answer: "answer",
    finish: "__end__",
    // to_reflect: "reflect", // TODO: implement reflect node
  };
  return routeMap[route] || "__end__";
}
let count = 0;
export async function supervisorNode(state: typeof GraphState.State) {
  count++;
  console.log(
    "supervisorNode state at count:",
    count,
    JSON.stringify(state, null, 2)
  );
  const { decision } = await supervisorDecision(state.messages);
  console.log(
    "supervisorNode decision at count:",
    count,
    JSON.stringify(decision, null, 2)
  );

  const parsed = SupervisorDecisionSchema.parse(decision);

  const targetNode = routeToNodeName(parsed.route);

  return new Command({
    update: {
      decision: parsed,
      trace: pushTrace(state, {
        node: "supervisor",
        note: `decision=${JSON.stringify(parsed)}`,
      }),
    },
    goto: targetNode,
  });
}

export async function supervisorAnswerNode(
  state: typeof GraphState.State
): Promise<Command> {
  // This is the final answer node - it directly returns messages without additional processing
  // The answer is already in the messages from previous agents (knowledge/action)
  return new Command({
    update: {
      trace: pushTrace(state, {
        node: "answer",
        note: "final answer ready",
      }),
    },
    goto: "__end__",
  });
}
