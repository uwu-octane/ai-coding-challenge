import type { ModelMessage, ToolModelMessage } from "ai";
import { generateText, tool } from "ai";
import { model } from "@/server/llm/llm";
import { retrieval } from "./retrieval";
import path from "path";
import fs from "fs/promises";
import YAML from "yaml";
import {
  KnowledgeAgentInputSchema,
  type KnowledgeAgentOutput,
  KnowledgeAgentOutputSchema,
} from "../shared/knowledge";

type YamlRoot = {
  knowledge_agent?: {
    system?: string;
    few_shot?: string;
    guards?: string;
  };
};

let cached: YamlRoot | null = null;

export async function loadPrompts(
  filePath = path.resolve(__dirname, "prompt.yaml")
): Promise<YamlRoot> {
  if (cached) return cached;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    cached = YAML.parse(raw) as YamlRoot;
    return cached;
  } catch (err: unknown) {
    console.error("Error loading knowledge agent prompts:", err);
    throw err;
  }
}

export async function getKnowledgeAgentSystem(): Promise<string> {
  const p = await loadPrompts();
  const k = p.knowledge_agent ?? {};
  const parts = [k.system ?? "", k.few_shot ?? "", k.guards ?? ""].filter(
    Boolean
  );
  return parts.join("\n\n");
}

// Define the vector search tool using Vercel AI SDK
const vectorSearchTool = tool({
  description: "Performs vector search in FAQ knowledge database",
  inputSchema: KnowledgeAgentInputSchema,
  execute: async ({ query, top_k, scoreThreshold }) => {
    const results = await retrieval(query, top_k, scoreThreshold);
    return {
      mode: "vector" as const,
      count: results.length,
      results: results,
    };
  },
});

export async function knowledgeAgent(messages: ModelMessage[]) {
  const system = await getKnowledgeAgentSystem();

  let stepIndex = 0;
  const result = await generateText({
    model,
    tools: {
      knowledge_vector_search: vectorSearchTool,
    },
    toolChoice: "required",
    system: system,
    messages: messages,
    temperature: 0,
    onStepFinish: (step) => {
      const snapshot = {
        index: stepIndex++,
        finishReason: step.finishReason,
        toolCalls: (step.toolCalls ?? []).map((tc) => ({
          toolName: tc.toolName,
          input: tc.input,
        })),
        text: step.text?.slice?.(0, 200),
      };
      console.log("[KA/onStepFinish]", JSON.stringify(snapshot, null, 2));
    },
  });
  const stepsDebug = (result.steps ?? []).map((s: any, i: number) => ({
    i,
    finishReason: s.finishReason,
    toolCalls: (s.toolCalls ?? []).map((tc: any) => ({
      toolName: tc.toolName,
      input: tc.input,
    })),
    toolResults: (s.toolResults ?? []).map((tr: any) => ({
      toolName: tr.toolName,
      ok: Boolean(tr.result),
    })),
    text: s.text?.slice?.(0, 200),
  }));
  console.log("[KA/steps]", JSON.stringify(stepsDebug, null, 2));

  const step = result.steps[result.steps.length - 1];
  const call = step?.toolCalls?.[0];
  const res = step?.toolResults?.[0];
  console.log(
    "knowledgeAgent call:",
    JSON.stringify(call?.input ?? {}, null, 2)
  );
  const toolName = call?.toolName ?? "knowledge_vector_search";

  const output: KnowledgeAgentOutput = KnowledgeAgentOutputSchema.parse(
    res?.output ?? {
      mode: "vector",
      count: 0,
      results: [],
    }
  );

  const assistantMsg: ModelMessage = {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: call?.toolCallId ?? "",
        toolName: toolName,
        input: (call as any).input ?? {},
      },
    ],
  } as ModelMessage;

  const KnowledgeToolResultMsg: ToolModelMessage = {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: call?.toolCallId ?? "",
        toolName: toolName,
        output: {
          type: "json",
          value: output,
        },
      },
    ],
  };
  // console.log("knowledgeAgent output:", KnowledgeToolResultMsg);
  return {
    knowledgeRefs: output.results ?? [],
    messages: [assistantMsg, KnowledgeToolResultMsg],
  };
}
