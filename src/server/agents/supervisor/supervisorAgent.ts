import { tool } from "ai";
import { z } from "zod";
import {
  PhaseEnum,
  RouteEnum,
  IntentEnum,
  SupervisorDecisionSchema,
} from "../shared/supervisor";
import { SupervisorDecision } from "../shared/supervisor";
import type { ModelMessage, ToolModelMessage } from "ai";
import { generateText } from "ai";
import { model } from "@/server/llm/llm";
import path from "path";
import fs from "fs/promises";
import YAML from "yaml";

type YamlRoot = {
  supervisor_agent?: {
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

export async function getSupervisorAgentPrompt(): Promise<string> {
  const p = await loadPrompts();
  const a = p.supervisor_agent ?? {};
  const parts = [a.system ?? "", a.few_shot ?? "", a.guards ?? ""].filter(
    Boolean
  );
  return parts.join("\n\n");
}

export const routeDecisionTool = tool({
  name: "supervisor_route_decision",
  description:
    "Choose next route (to_knowledge | to_tool | to_reflect | to_answer | finish) and optional payload for the workflow.",
  inputSchema: z.object({
    phase: PhaseEnum,
    route: RouteEnum,
    reason: z.string().optional(),
    payload: z.object({
      // INTENT phase
      intent: IntentEnum,
      requery_text: z.string(),
      keywords: z.array(z.string()),
      command: z.string(),

      // TOOL phase
      suggested_tool: z.string().optional(),

      // REFLECT phase
      missing_fields: z.array(z.string()).optional(),
      reflect_question: z.string().optional(),
    }),
  }),
  execute: async (args) => args,
});

export async function supervisorDecision(messages: ModelMessage[]): Promise<{
  ok: boolean;
  decision: SupervisorDecision;
  messages: ModelMessage[];
}> {
  const system = await getSupervisorAgentPrompt();
  const { steps } = await generateText({
    model,
    messages: messages,
    tools: {
      supervisor_route_decision: routeDecisionTool,
    },
    toolChoice: "required",
    temperature: 0,
    system: system,
  });
  const step = steps[steps.length - 1];
  const decision = SupervisorDecisionSchema.parse(
    step?.toolResults?.[0]?.output
  );

  const SupervisorDecisionMsg: ToolModelMessage = {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: step?.toolCalls?.[0]?.toolCallId ?? "",
        toolName: step?.toolCalls?.[0]?.toolName ?? "supervisor_route_decision",
        output: {
          type: "json",
          value: decision,
        },
      },
    ],
  };

  return {
    ok: true,
    decision,
    messages: [...messages, SupervisorDecisionMsg],
  };
}
