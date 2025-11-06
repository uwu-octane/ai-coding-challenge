import React, { useState } from 'react'
import { Square, ArrowUp } from 'lucide-react'
import { Magnetic } from '@/components/ui/magnetic'
import {
  SimpleMorphingPopover,
  SimpleMorphingPopoverTrigger,
  SimpleMorphingPopoverContent,
  useSimpleMorphingPopover,
} from '@/components/ui/simple-morphing-popover'
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input'
import { ChatButton } from './chatbutton'
import { Button } from '@/components/ui/buttonv1'
import { ActionDock } from './actiondocker'
import { testActions } from './testactions'
import { ChatContainer } from './chatbox'
import type { ChatMessage } from './chatbox'

export function ChatPopoverLauncher() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = () => {
    if (!input.trim()) return
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
  }

  const triggerVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      y: 8,
      filter: 'blur(6px)',
      transformOrigin: 'bottom right',
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transformOrigin: 'bottom right',
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 4,
      filter: 'blur(4px)',
      transformOrigin: 'bottom right',
    },
  } as const

  return (
    <div className="pointer-events-none fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-[60]">
      <SimpleMorphingPopover
        className="relative flex items-end justify-end pointer-events-auto"
        variants={triggerVariants}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
      >
        <SimpleMorphingPopoverTrigger asChild>
          <LauncherButton />
        </SimpleMorphingPopoverTrigger>

        <SimpleMorphingPopoverContent
          className="pointer-events-auto absolute right-0 bottom-0 z-[80]
                     w-[min(100vw,400px)] origin-bottom-right
                     bg-transparent border-none shadow-none p-0"
        >
          <PopoverBody
            messages={messages}
            onNewChat={handleNewChat}
            input={input}
            onInputChange={setInput}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </SimpleMorphingPopoverContent>
      </SimpleMorphingPopover>
    </div>
  )
}

type PopoverBodyProps = {
  messages: ChatMessage[]
  onNewChat: () => void
  input: string
  onInputChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

function PopoverBody({
  messages,
  onNewChat,
  input,
  onInputChange,
  isLoading,
  onSubmit,
}: PopoverBodyProps) {
  const { isOpen, close } = useSimpleMorphingPopover()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isOpen) return
    const frame = requestAnimationFrame(() => {
      const textarea = contentRef.current?.querySelector('textarea')
      textarea?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen])

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
            <PromptInputTextarea
              placeholder="Ask me anything..."
              className="relative z-10 min-h-[20px] max-h-[200px] overflow-y-auto text-base leading-6 placeholder:text-zinc-400 scrollbar-hidden text-xs"
            />
            <PromptInputActions className="bottom-2 right-2 p-0 m-0">
              <PromptInputAction tooltip={isLoading ? 'Stop generation' : 'Send message'}>
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
  )
}

function LauncherButton(props: React.ComponentProps<typeof ChatButton>) {
  const { isOpen } = useSimpleMorphingPopover()
  const { className, ...rest } = props
  return (
    <ChatButton
      aria-label="Chat with AI"
      className={
        (isOpen ? 'opacity-0 pointer-events-none [inert] aria-hidden' : 'pointer-events-auto') +
        (className ? ` ${className}` : '')
      }
      {...rest}
    />
  )
}
