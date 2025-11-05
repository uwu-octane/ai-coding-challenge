import type { ModelMessage, ToolModelMessage } from "ai";
import { generateText } from "ai";
import { ToolCallSchema } from "../shared/action";
import { ToolResultSchema } from "../shared/action";
import { model } from "@/server/llm/llm";
import path from "path";
import fs from "fs/promises";
import YAML from "yaml";

type YamlRoot = {
  action_agent?: {
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
  } catch (err: any) {
    console.error(err);
    throw err;
  }
}

export async function getActionAgentSystem(): Promise<string> {
  const p = await loadPrompts();
  const a = p.action_agent ?? {};
  const parts = [a.system ?? "", a.few_shot ?? "", a.guards ?? ""].filter(
    Boolean
  );
  return parts.join("\n\n");
}

export async function actionAgent(
  messages: ModelMessage[],
  tools: Record<string, any>
) {
  const system = await getActionAgentSystem();

  const result = await generateText({
    model,
    tools,
    toolChoice: "required",
    system: system,
    messages: messages,
    temperature: 0,
  });

  const step = result.steps[result.steps.length - 1];
  const call = step?.toolCalls?.[0];
  const res = step?.toolResults?.[0];

  const toolCall = ToolCallSchema.parse({
    tool: call?.toolName,
    input: (call as any)?.input ?? {},
  });

  const toolResult = ToolResultSchema.parse(
    (res as any)?.output ?? { ok: true, data: null }
  );

  const assistantMsg: ModelMessage = {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: call?.toolCallId ?? "",
        toolName: call?.toolName ?? toolCall.tool,
        input: (call as any)?.input ?? {},
      },
    ],
  } as ModelMessage;

  const resultMsg: ToolModelMessage = {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: call?.toolCallId ?? "",
        toolName: call?.toolName ?? toolCall.tool,
        output: {
          type: "json",
          value: toolResult,
        },
      },
    ],
  };

  return {
    toolCall,
    toolResult,
    messages: [assistantMsg, resultMsg],
  };
}
