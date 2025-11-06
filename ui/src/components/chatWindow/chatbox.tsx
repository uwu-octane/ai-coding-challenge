import * as React from "react";
import { Card } from "antd";
import styles from "./chatbox.module.scss";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ai-elements/message";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { HeaderExtra } from "./chatboxheader";
import type { DropdownItem } from "./chatdropdown";
export type ChatRole = "user" | "assistant" | "system";
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  avatar?: string;
  name?: string;
  plugins?: Array<{ type: string; payload: unknown }>;
}

interface ChatContainerProps {
  title?: React.ReactNode;
  messages: ChatMessage[];
  children?: React.ReactNode;
  height?: number | string;
  className?: string;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onClose: () => void;
  items: DropdownItem[];
  activeItemId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function MarkdownRender({ text }: { text: string }) {
  return (
    <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
      {text}
    </ReactMarkdown>
  );
}

export function ChatContainer({
  messages,
  children,
  height = 520,
  className,
  onNewChat,
  onToggleSidebar,
  onClose,
}: ChatContainerProps) {
  // const headerTitle = (
  //   <ChatDropdown
  //     items={items}
  //     activeItemId={activeItemId}
  //     onSelect={onSelect}
  //     onNew={onNew}
  //     buttonClassName="h-6"
  //   />
  // );

  return (
    <Card
      title={<div className={styles.chatTitle}>AI Chat</div>}
      extra={HeaderExtra(styles, onNewChat, onToggleSidebar, onClose)}
      className={cn(styles.chatCard, className)}
      style={
        {
          ["--chatbox-body-height" as string]:
            typeof height === "number" ? `${height}px` : height,
        } as unknown as React.CSSProperties
      }
    >
      {/* 会话主体 */}
      <Conversation className={cn("flex-1 overflow-hidden", styles.chatBody)}>
        <ConversationContent
          className={cn("flex-1", styles.conversationContent)}
        >
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              {m.avatar && <MessageAvatar src={m.avatar} name={m.name} />}
              <MessageContent className={styles.messageContent}>
                <MarkdownRender text={m.content} />
                {/* 预留插件渲染位：后续我们在这里挂 code block 工具条、富卡片等 */}
                {/* {m.plugins?.map((p, i) => (
                  <div key={i}>插件：{p.type}</div>
                ))} */}
              </MessageContent>
            </Message>
          ))}
          <ConversationScrollButton />
        </ConversationContent>
      </Conversation>

      {/* 底部输入区（来自外部） */}
      <div className={styles.chatFooter}>{children}</div>
    </Card>
  );
}
