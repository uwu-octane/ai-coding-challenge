import { Command } from "@langchain/langgraph";
import { GraphState, pushTrace } from "../graph/graphContext";
import { knowledgeAgent } from "./knowledgeAgent";
import {
  bm25Search,
  hybridRetrieval,
  rerankMock,
  resultProcess,
} from "./retrieval";
import type { ToolModelMessage } from "ai";

export async function knowledgeNode(
  state: typeof GraphState.State
): Promise<Command> {
  const messages = state.messages ?? [];

  try {
    const { knowledgeRefs, messages: newMessages } =
      await knowledgeAgent(messages);
    //mocking
    bm25Search();
    hybridRetrieval();
    rerankMock();
    resultProcess();
    console.log(
      "knowledgeNode newMessages:",
      JSON.stringify(newMessages, null, 2)
    );
    return new Command({
      update: {
        knowledgeRefs,
        messages: newMessages,
        trace: pushTrace(state, {
          node: "knowledge",
          note: `vector retrieval count=${knowledgeRefs.length}`,
        }),
      },
      goto: "supervisor",
    });
  } catch (err: unknown) {
    const errorMsg: ToolModelMessage = {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: `knowledge_error_${Date.now()}`,
          toolName: "knowledge_vector_search",
          output: {
            type: "json",
            value: {
              mode: "vector" as const,
              count: 0,
              results: [],
              error: err instanceof Error ? err.message : String(err),
            },
          },
        },
      ],
    };

    return new Command({
      update: {
        messages: [...messages, errorMsg],
        trace: pushTrace(state, {
          node: "knowledge",
          note: `error: ${err instanceof Error ? err.message : String(err)}`,
        }),
      },
      goto: "supervisor",
    });
  }
}
