#!/usr/bin/env bun

import readline from "readline";

const API_BASE_URL = process.env.API_URL || "http://localhost:7788";
const API_NEW_CHAT = `${API_BASE_URL}/api/ai/newChat`;
const API_CHAT = `${API_BASE_URL}/api/ai/chatRag`;

let currentSessionId: string | null = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

function printWelcome() {
  console.log("\n=== AI Chat CLI ===");
  console.log("Commands:");
  console.log("  /newchat  - Start a new chat session");
  console.log("  /quit     - Quit and clear current session");
  console.log("  Type a message to send it to the AI\n");
}

function printPrompt() {
  if (currentSessionId) {
    rl.setPrompt(`[Session: ${currentSessionId.slice(0, 8)}...] > `);
  } else {
    rl.setPrompt("> ");
  }
  rl.prompt();
}

async function createNewChat(): Promise<string> {
  try {
    const response = await fetch(API_NEW_CHAT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as {
      code: number;
      data?: { sessionId: string };
      message?: string;
    };

    if (result.code !== 0 || !result.data) {
      throw new Error(result.message || "Failed to create new chat session");
    }

    return result.data.sessionId;
  } catch (error) {
    throw new Error(`Failed to create new chat: ${error}`);
  }
}

async function sendMessage(message: string): Promise<void> {
  if (!currentSessionId) {
    console.log(
      "❌ No active session. Please use /newchat to start a new chat first."
    );
    printPrompt();
    return;
  }

  try {
    const response = await fetch(API_CHAT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    process.stdout.write("\n🤖 ");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        // Handle AI SDK text stream format: "0:text content"
        if (line.startsWith("0:")) {
          const text = line.slice(2);
          process.stdout.write(text);
        }
        // Handle SSE format: "data: text content"
        else if (line.startsWith("data: ")) {
          const text = line.slice(6);
          // Skip JSON objects and non-text events
          if (!text.trim().startsWith("{")) {
            process.stdout.write(text);
          }
        }
        // Handle plain text (fallback)
        else if (!line.startsWith("event:") && !line.startsWith(":")) {
          process.stdout.write(line);
        }
      }
    }

    // Process remaining buffer
    if (buffer) {
      if (buffer.startsWith("0:")) {
        process.stdout.write(buffer.slice(2));
      } else if (buffer.startsWith("data: ")) {
        const text = buffer.slice(6);
        if (!text.trim().startsWith("{")) {
          process.stdout.write(text);
        }
      } else if (!buffer.startsWith("event:") && !buffer.startsWith(":")) {
        process.stdout.write(buffer);
      }
    }

    console.log("\n");
  } catch (error) {
    console.error(`\n❌ Error sending message: ${error}`);
  }

  printPrompt();
}

async function handleCommand(input: string): Promise<boolean> {
  const trimmed = input.trim();

  if (trimmed === "/newchat") {
    try {
      console.log("\n🔄 Creating new chat session...");
      currentSessionId = await createNewChat();
      console.log(`✅ New chat session created: ${currentSessionId}`);
      printPrompt();
    } catch (error) {
      console.error(`\n❌ Failed to create new chat: ${error}`);
      printPrompt();
    }
    return true;
  }

  if (trimmed === "/quit") {
    if (currentSessionId) {
      console.log(`\n👋 Clearing session: ${currentSessionId.slice(0, 8)}...`);
      currentSessionId = null;
    }
    console.log("Goodbye!");
    return false;
  }

  if (trimmed.startsWith("/")) {
    console.log(`\n❌ Unknown command: ${trimmed}`);
    console.log("Available commands: /newchat, /quit");
    printPrompt();
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

  rl.on("line", async (input) => {
    const shouldContinue = await handleCommand(input);
    if (!shouldContinue) {
      rl.close();
      process.exit(0);
    }
  });

  rl.on("close", () => {
    console.log("\nGoodbye!");
    process.exit(0);
  });

  printPrompt();
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Goodbye!");
  if (currentSessionId) {
    currentSessionId = null;
  }
  rl.close();
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
