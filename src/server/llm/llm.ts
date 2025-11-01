import { createDeepSeek } from "@ai-sdk/deepseek";
import { ModelMessage, streamText } from "ai";
import type { LlmMessage } from "@/conversation/history";

const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "deepseek-chat";
const LLM_BASE_URL = process.env.LLM_BASE_URL;

console.log("LLM_BASE_URL:", LLM_BASE_URL);
console.log("LLM_MODEL:", LLM_MODEL);
if (!LLM_API_KEY) {
  console.error("LLM_API_KEY is not set");
  throw new Error("LLM_API_KEY is not set");
}

export const llm = createDeepSeek({
  apiKey: LLM_API_KEY,
  baseURL: LLM_BASE_URL,
});

export function buildChatCompletion(
  history: LlmMessage[],
  userText: string,
  systemPrompt?: string
): ModelMessage[] {
  const msgs: ModelMessage[] = [];
  if (systemPrompt) {
    msgs.push({ role: "system", content: systemPrompt });
  }
  for (const message of history) {
    // Filter out system messages from history as we handle system prompt separately
    if (message.role !== "system") {
      msgs.push({ role: message.role, content: message.content });
    }
  }
  msgs.push({ role: "user", content: userText });
  return msgs;
}

export function chatStream(
  messages: ModelMessage[],
  onFinish: (finalText: string) => void
) {
  return streamText({
    model: llm(LLM_MODEL),
    messages,
    temperature: 0.3,
    maxRetries: 2,
    onFinish: ({ text }) => onFinish(text ?? ""),
    onError: (err) => console.error("stream error:", err),
  });
}
