import { ToolCall, ToolResult } from "../shared/types";

export async function actionAgent(
  toolCall: ToolCall | null,
  options?: { delayMs?: number }
): Promise<ToolResult> {
  const delayMs = options?.delayMs ?? 300;

  // mock the tool execution
  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const tool = toolCall?.tool ?? "mock.tool";
  const args = toolCall?.args ?? {};

  return {
    ok: true,
    data: {
      executedAt: new Date().toISOString(),
      tool,
      args,
      mockOutput: `Executed ${tool} with ${Object.keys(args).length} arg(s).`,
    },
  };
}
