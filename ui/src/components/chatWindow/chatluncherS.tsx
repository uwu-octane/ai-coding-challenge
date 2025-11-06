import React, { useCallback, useRef, useState } from "react";
import { Square, ArrowUp } from "lucide-react";
import { Magnetic } from "@/components/ui/magnetic";
import {
  SimpleMorphingPopover,
  SimpleMorphingPopoverTrigger,
  SimpleMorphingPopoverContent,
} from "@/components/ui/simple-morphing-popover";
import { useSimpleMorphingPopover } from "@/components/ui/simple-morphing-popover-context";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { ChatButton } from "./chatbutton";
import { Button } from "@/components/ui/buttonv1";
import { ActionDock } from "./actiondocker";
import { testActions } from "./testactions";
import { ChatContainer } from "./chatbox";
import type { ChatMessage } from "./chatbox";
import { apiNewChat, apiChatStream, readStreamToCallback } from "@/lib/api";

export function ChatPopoverLauncher() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    const res = await apiNewChat();
    sessionIdRef.current = res.sessionId;
    return res.sessionId;
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const sid = await ensureSession();

      // Append user message
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      // Append placeholder assistant message
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Stream response
      const res = await apiChatStream(
        { sessionId: sid, message: text },
        { rag: true }
      );

      const filterAssistantContent = (chunk: string): string => {
        if (!chunk || chunk.trim() === "") {
          return "";
        }

        let filtered = chunk;

        if (filtered.includes("data: ")) {
          const lines = filtered.split("\n");
          const dataLines = lines
            .filter((line) => line.startsWith("data: "))
            .map((line) => line.replace(/^data: /, ""));
          if (dataLines.length > 0) {
            filtered = dataLines.join("\n");
          }
        }

        if (filtered.includes("event: ")) {
          const lines = filtered.split("\n");
          const eventLine = lines.find((line) => line.startsWith("event: "));
          if (eventLine && !eventLine.includes("text")) {
            return "";
          }
        }

        filtered = filtered.replace(/^(user|system|tool):\s*/gim, "");

        const trimmed = filtered.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            const json = JSON.parse(trimmed);
            if (json.type === "tool-call" || json.type === "tool-result") {
              return "";
            }
            if (json.role && json.role !== "assistant") {
              return "";
            }
            if (json.content && json.role === "assistant") {
              return typeof json.content === "string" ? json.content : "";
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }

        return filtered;
      };

      await readStreamToCallback(res, (chunk) => {
        const filteredChunk = filterAssistantContent(chunk);
        if (filteredChunk) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + filteredChunk }
                : m
            )
          );
        }
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, ensureSession]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    sessionIdRef.current = null;
  };
  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const triggerVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      filter: "blur(10px)",
      transformOrigin: "center",
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transformOrigin: "center",
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)",
      transformOrigin: "center",
    },
  } as const;

  const handleLuncherOpen = async () => {
    console.log("luncher open");
    if (!sessionIdRef.current) {
      try {
        const id = await ensureSession();
        sessionIdRef.current = id;
        console.log("session id", id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "创建会话失败");
      }
    }
  };
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      <SimpleMorphingPopover
        className="relative  pointer-events-auto"
        variants={triggerVariants}
        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
      >
        <SimpleMorphingPopoverTrigger asChild>
          <LauncherButton onClick={handleLuncherOpen} />
        </SimpleMorphingPopoverTrigger>

        <SimpleMorphingPopoverContent
          className="pointer-events-auto relative z-[80] absolute
                     w-[min(100vw-3rem,900px)] origin-center
                     bg-transparent border-none shadow-none p-0"
        >
          <PopoverBody
            messages={messages}
            onNewChat={handleNewChat}
            input={input}
            onInputChange={handleInputChange}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            error={error}
          />
        </SimpleMorphingPopoverContent>
      </SimpleMorphingPopover>
    </div>
  );
}

type PopoverBodyProps = {
  messages: ChatMessage[];
  onNewChat: () => void;
  input: string;
  onInputChange: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  error?: string | null;
};

function PopoverBody({
  messages,
  onNewChat,
  input,
  onInputChange,
  isLoading,
  onSubmit,
  error,
}: PopoverBodyProps) {
  const { isOpen, close } = useSimpleMorphingPopover();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const textarea = contentRef.current?.querySelector("textarea");
      textarea?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  return (
    <div ref={contentRef} className="flex flex-col items-center gap-3 w-full">
      <ChatContainer
        items={[]}
        activeItemId=""
        onSelect={() => {}}
        onNew={() => {}}
        messages={messages}
        onNewChat={onNewChat}
        onToggleSidebar={() => {}}
        onClose={close}
        height={"min(70vh, 680px)"}
      >
        <ActionDock actions={testActions} />
        <div className="w-full">
          <PromptInput
            value={input}
            onValueChange={onInputChange}
            isLoading={isLoading}
            onSubmit={onSubmit}
            maxHeight={200}
            className="w-full overflow-hidden flex flex-row items-center gap-2 rounded-2xl p-0 pr-1 bg-transparent"
          >
            {error && (
              <div className="text-xs text-red-500 px-2 py-1">{error}</div>
            )}
            <PromptInputTextarea
              placeholder="Ask me anything..."
              className="relative z-10 min-h-[20px] max-h-[200px] overflow-y-auto text-base leading-6 placeholder:text-zinc-400 scrollbar-hidden text-xs"
            />
            <PromptInputActions className="bottom-2 right-2 p-0 m-0 absolute">
              <PromptInputAction
                tooltip={isLoading ? "Stop generation" : "Send message"}
              >
                <Magnetic>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-5 w-5 rounded-full"
                    onClick={onSubmit}
                  >
                    {isLoading ? (
                      <Square className="size-3 fill-current" />
                    ) : (
                      <ArrowUp className="size-3" />
                    )}
                  </Button>
                </Magnetic>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </div>
      </ChatContainer>
    </div>
  );
}

function LauncherButton(props: React.ComponentProps<typeof ChatButton>) {
  const { isOpen } = useSimpleMorphingPopover();
  const { className, ...rest } = props;
  return (
    <ChatButton
      aria-label="Chat with AI"
      className={
        (isOpen
          ? "opacity-0 pointer-events-none [inert] aria-hidden"
          : "pointer-events-auto") + (className ? ` ${className}` : "")
      }
      {...rest}
    />
  );
}
