import { Hono } from "hono";
import { validateJson } from "../../request/validator";
import {
  ChatRequestSchema,
  ChatRequest,
  NewChatRequestSchema,
  NewChatRequest,
  NewChatResponse,
} from "./schema";
import { ok } from "../../request/response";
import {
  ensureSession,
  persistRoundStart,
  persistRoundFinish,
} from "@/conversation/presis";
import { graph } from "@/server/llm/llm";
import { buildHistoryMessages } from "@/conversation/history";
import { chatStream, buildChatCompletion } from "@/server/llm/llm";

const router = new Hono();
//test prompt
const systemPrompt = `
You are a helpful assistant that can answer questions and help with tasks.
You are currently in a conversation with a user.
You are to answer the user's question or help with the task.
Before giving your answer, you should make a summary (dont send it to the user) of the conversation history and the user's question or task and then give your answer based on the summary.
You are only allowed to use the information provided to you to answer the user's question or help with the task.
You are not allowed to use any information that is not provided to you.
You are not allowed to use invented information.
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

router.post("/newChat", validateJson(NewChatRequestSchema), async (c) => {
  const _body = c.req.valid("json") as NewChatRequest;

  const sessionId = ensureSession(null);
  console.log("new chat session id", sessionId);
  const res: NewChatResponse = { sessionId };
  c.header("X-Session-ID", sessionId);
  return ok(c, res);
});

router.post("/chatRag", validateJson(ChatRequestSchema), async (c) => {
  const body = c.req.valid("json") as ChatRequest;
  const text = body.message.trim();

  const session_id = ensureSession(body.sessionId);
  const round_request_id = c.get("HTTP_REQUEST_ID");
  const { assistantMsgId } = persistRoundStart(
    session_id,
    round_request_id,
    text
  );

  const cfg = { configurable: { thread_id: session_id } };

  const stateNow = await graph.getState(cfg);
  if (!stateNow?.values?.messages?.length) {
    await graph.updateState(cfg, {
      messages: [],
      sessionId: session_id,
      requestId: round_request_id,
    });
  }
  await graph.updateState(cfg, {
    messages: [{ role: "user", content: text }],
    userQuery: text,
    requestId: round_request_id,
  });

  const finalState = await graph.invoke({}, cfg);

  const answerMessages = finalState.messages ?? [];

  const res = chatStream(answerMessages, (finalText) => {
    persistRoundFinish(assistantMsgId, finalText);
  });

  return res.toTextStreamResponse({
    headers: {
      "X-HTTP-Request-ID": round_request_id,
    },
  });
});

export default router;
