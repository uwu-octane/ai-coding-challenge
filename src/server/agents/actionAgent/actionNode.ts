// actionNode.ts —— 仅此一个 node 接入 Graph
import { Command } from "@langchain/langgraph";
import { GraphState } from "../graph/graphContext";
import { actionAgent } from "./actionAgent";
import { pushTrace } from "../shared/graph";
import { tools } from "./tool";

export async function actionNode(
  state: typeof GraphState.State
): Promise<Command> {
  const messages = state.messages ?? [];
  const {
    toolCall,
    toolResult,
    messages: newMessages,
  } = await actionAgent(messages, tools);

  return new Command({
    update: {
      toolCall,
      toolResult,
      messages: [...messages, ...newMessages],
      trace: pushTrace(state, {
        node: "action",
        note: `ai-sdk tool="${toolCall.tool}" ok=${String((toolResult as any).ok)}`,
      }),
    },
    goto: "supervisor",
  });
}
