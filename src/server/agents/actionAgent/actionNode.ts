import { Command } from "@langchain/langgraph";
import { actionAgent } from "./actionAgent";

export async function actionNode(state: any): Promise<Command> {
  const toolResult = await actionAgent(state.toolCall);

  // return to supervisor
  return new Command({
    update: {
      toolResult,
      trace: [
        ...(state.trace ?? []),
        {
          at: Date.now(),
          node: "action",
          note: toolResult.ok ? "mock ok" : "mock failed",
        },
      ],
    },
    goto: "supervisor",
  });
}
