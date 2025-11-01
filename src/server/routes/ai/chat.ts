import { Hono } from "hono";
import { validateJson, ChatRequestSchema } from "../../request/validator";
import { ChatRequest } from "../../request/validator";
import {
  ensureSession,
  persistRoundStart,
  persistRoundFinish,
} from "@/conversation/presis";

import { buildHistoryMessages } from "@/conversation/history";
import { chatStream, buildChatCompletion } from "@/server/llm/llm";
const router = new Hono();
//test prompt
const systemPrompt = `
You are a helpful assistant that can answer questions and help with tasks.
You are currently in a conversation with a user.
You are to answer the user's question or help with the task.
You are to use the information provided to you to answer the user's question or help with the task.
`;

router.post("/chat", validateJson(ChatRequestSchema), async (c) => {
  const body = c.req.valid("json") as ChatRequest;
  const text = body.message.trim();

  const session_id = ensureSession(body.sessionId);
  const round_request_id = c.get("HTTP_REQUEST_ID");
  const { assistantMsgId } = persistRoundStart(
    session_id,
    round_request_id,
    text
  );

  const history = buildHistoryMessages(session_id);
  const messages = buildChatCompletion(history, text, systemPrompt);
  const res = chatStream(messages, (finalText) => {
    persistRoundFinish(assistantMsgId, finalText);
  });

  //todo; update assistant message in real time if needed

  return res.toTextStreamResponse({
    headers: {
      "X-HTTP-Request-ID": round_request_id,
    },
  });
});

export default router;
