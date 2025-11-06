#!/usr/bin/env bun
// file: ai-chat-cli.ts

import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";

const API_BASE_URL = process.env.API_URL || "http://localhost:7788";
const API_NEW_CHAT = `${API_BASE_URL}/api/ai/newChat`;
const API_CHAT = `${API_BASE_URL}/api/ai/chatRag`;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 120_000);

const QUERY_FILE = path.resolve(
  process.cwd(),
  "support_data",
  "test_queries.txt"
);

let rl: readline.Interface;
let currentSessionId: string | null = null;
let shouldExit = false;
let inflightController: AbortController | null = null;

type QueryGroup = { title: string; queries: string[] };

function parseQueryFile(filePath: string): QueryGroup[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const groups: QueryGroup[] = [];
    let group: QueryGroup | null = null;

    for (const line of lines) {
      if (line.startsWith("#")) {
        if (group) groups.push(group);
        group = { title: line.replace(/^#\s*/, ""), queries: [] };
      } else if (group) {
        group.queries.push(line.replace(/^[-•]\s*/, "")); // allow "- query" style too
      }
    }
    if (group) groups.push(group);
    return groups;
  } catch (err) {
    console.error(`Failed to read query file: ${err}`);
    return [];
  }
}

function printWelcome() {
  console.log("\n=== AI Chat CLI ===");
  console.log("Commands:");
  console.log("  /newchat    - Start a new chat session");
  console.log("  /session    - Show current session id");
  console.log("  /quit       - Quit and clear current session");
  console.log("  @           - Select a test query from predefined list");
  console.log("  Type a message to send it to the AI\n");
}

function printPrompt() {
  if (!rl) return;
  rl.setPrompt(
    currentSessionId ? `[Session: ${currentSessionId.slice(0, 8)}...] > ` : "> "
  );
  rl.prompt();
}

function createRL() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.on("line", async (input) => {
    const keepRunning = await handleCommand(input);
    if (!keepRunning) {
      shouldExit = true;
      rl.close();
    }
  });

  rl.on("close", () => {
    if (shouldExit) {
      console.log("\nGoodbye!");
      process.exit(0);
    }
    // Unexpected close: rebuild
    console.warn("\n⚠️ Readline closed unexpectedly. Restoring input...");
    createRL();
    printPrompt();
  });
}

async function ensureSession(): Promise<string> {
  if (currentSessionId) return currentSessionId;
  process.stdout.write("\n🔄 Creating new chat session...");
  currentSessionId = await createNewChat();
  console.log(` done: ${currentSessionId}`);
  return currentSessionId;
}

async function createNewChat(): Promise<string> {
  const controller = new AbortController();
  inflightController = controller;
  const t = setTimeout(
    () => controller.abort("request-timeout"),
    REQUEST_TIMEOUT_MS
  );

  try {
    const res = await fetch(API_NEW_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      signal: controller.signal,
      keepalive: true,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = (await res.json()) as {
      code: number;
      data?: { sessionId: string };
      message?: string;
    };
    if (result.code !== 0 || !result.data?.sessionId) {
      throw new Error(result.message || "Failed to create new chat session");
    }
    return result.data.sessionId;
  } finally {
    clearTimeout(t);
    inflightController = null;
  }
}

/**
 * Robust stream printer that supports:
 * - text/event-stream (SSE)
 * - Vercel AI "0:" text channel lines
 * - plain text fallbacks
 */
async function printStream(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  // For SSE multi-line event assembly
  let sseDataParts: string[] = [];
  let sseEvent: string | null = null;

  const flushSSE = () => {
    if (!sseDataParts.length) return;
    const joined = sseDataParts.join("\n");
    // Try to skip JSON control payloads; print plain text
    try {
      const maybeJson = JSON.parse(joined);
      if (typeof maybeJson === "string") {
        process.stdout.write(maybeJson);
      }
      // else: ignore non-text JSON control messages
    } catch {
      // Not JSON -> print
      if (joined === "[DONE]") return; // common sentinel
      process.stdout.write(joined);
    }
    sseDataParts = [];
    sseEvent = null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (let raw of lines) {
      const line = raw; // keep exact; avoid trimming token spaces

      // Vercel AI "0:..." line (text channel)
      if (line.startsWith("0:")) {
        process.stdout.write(line.slice(2));
        continue;
      }

      // SSE support (data:, event:, comments, empty -> dispatch)
      if (line.startsWith(":")) continue; // comment
      if (line.startsWith("event:")) {
        sseEvent = line.slice(6).trim();
        continue;
      }
      if (line.startsWith("data:")) {
        sseDataParts.push(line.slice(5).trimStart());
        continue;
      }
      if (line === "") {
        flushSSE();
        continue;
      }

      // Fallback: plain text line (avoid printing SSE control noise)
      if (!/^id:|^retry:/i.test(line)) {
        process.stdout.write(line);
      }
    }
  }

  // Flush remaining pieces
  if (buffer) {
    if (buffer.startsWith("0:")) {
      process.stdout.write(buffer.slice(2));
    } else if (buffer.startsWith("data:")) {
      sseDataParts.push(buffer.slice(5).trimStart());
      flushSSE();
    } else if (!buffer.startsWith("event:") && !buffer.startsWith(":")) {
      process.stdout.write(buffer);
    }
  }
}

async function sendMessage(message: string): Promise<void> {
  try {
    const sessionId = await ensureSession();

    // Pause user input while streaming to avoid prompt collisions
    rl.pause();
    process.stdout.write("\n🤖 ");

    const controller = new AbortController();
    inflightController = controller;
    const t = setTimeout(
      () => controller.abort("request-timeout"),
      REQUEST_TIMEOUT_MS
    );

    const res = await fetch(API_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
      signal: controller.signal,
      keepalive: true,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await printStream(res);
    process.stdout.write("\n\n");
    clearTimeout(t);
  } catch (err) {
    console.error(`\n❌ Error: ${err}`);
  } finally {
    inflightController = null;
    rl.resume();
    printPrompt();
  }
}

async function handleCommand(input: string): Promise<boolean> {
  const trimmed = input.trim();

  // Commands
  if (trimmed.startsWith("/")) {
    switch (trimmed) {
      case "/newchat":
        try {
          console.log("\n🔄 Creating new chat session...");
          currentSessionId = await createNewChat();
          console.log(`✅ New chat session: ${currentSessionId}`);
        } catch (err) {
          console.error(`\n❌ Failed to create new chat: ${err}`);
        }
        printPrompt();
        return true;

      case "/session":
        console.log(
          currentSessionId
            ? `\n🆔 Session: ${currentSessionId}\n`
            : "\n(No active session)\n"
        );
        printPrompt();
        return true;

      case "/quit":
        if (currentSessionId)
          console.log(
            `\n👋 Clearing session: ${currentSessionId.slice(0, 8)}...`
          );
        currentSessionId = null;
        return false;

      default:
        console.log(`\n❌ Unknown command: ${trimmed}`);
        console.log("Available: /newchat, /session, /quit, @");
        printPrompt();
        return true;
    }
  }

  // Test query picker
  if (trimmed === "@") {
    try {
      const groups = parseQueryFile(QUERY_FILE);
      if (!groups.length) {
        console.log("\n⚠️ No queries found in test_queries.txt\n");
        printPrompt();
        return true;
      }

      process.stdin.resume();
      rl.pause();

      const { group } = (await prompts({
        type: "select",
        name: "group",
        message: "Select query category",
        choices: groups.map((g) => ({ title: g.title, value: g })),
      })) as { group?: QueryGroup };

      if (!group) {
        rl.resume();
        printPrompt();
        return true;
      }

      const { query } = (await prompts({
        type: "select",
        name: "query",
        message: `Select a query from "${group.title}"`,
        choices: group.queries.map((q) => ({ title: q, value: q })),
      })) as { query?: string };

      rl.resume();

      if (query) {
        console.log(`\n💬 Selected query: ${query}\n`);
        await sendMessage(query);
      } else {
        printPrompt();
      }
    } catch (err) {
      rl.resume();
      console.error("\n❌ Failed to load test queries:", err);
      printPrompt();
    }
    return true;
  }

  // Regular message
  if (trimmed) {
    await sendMessage(trimmed);
  } else {
    printPrompt();
  }
  return true;
}

async function main() {
  printWelcome();
  createRL();
  printPrompt();
}

process.on("SIGINT", () => {
  console.log("\n\n👋 Goodbye!");
  if (inflightController)
    try {
      inflightController.abort("user-abort");
    } catch {}
  currentSessionId = null;
  shouldExit = true;
  if (rl) rl.close();
  else process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
