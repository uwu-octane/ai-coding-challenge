import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
};

const PromptInputContext = createContext<PromptInputContextType | undefined>(
  undefined
);

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (context === undefined) {
    throw new Error("usePromptInput must be used within a <PromptInput />");
  }
  return context;
}

type PromptInputProps = {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

function PromptInput({
  className,
  isLoading = false,
  maxHeight = 240,
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  children,
}: PromptInputProps) {
  // 内部状态仅在非受控模式使用
  const [internalValue, setInternalValue] = useState(value ?? "");

  // 同步外部 value（当切到受控模式或上层清空时）
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const ctx = useMemo<PromptInputContextType>(
    () => ({
      isLoading,
      value: value ?? internalValue,
      setValue: handleChange,
      maxHeight,
      onSubmit,
      disabled,
    }),
    [isLoading, value, internalValue, maxHeight, onSubmit, disabled]
  );

  return (
    <TooltipProvider>
      <PromptInputContext.Provider value={ctx}>
        <div
          data-disabled={disabled ? "" : undefined}
          className={cn(
            "rounded-3xl border border-input bg-background p-2 shadow-sm",
            disabled && "opacity-60 pointer-events-none",
            className
          )}
        >
          {children}
        </div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  );
}

export type PromptInputTextareaProps = {
  disableAutosize?: boolean;
} & React.ComponentProps<typeof Textarea>;

function PromptInputTextarea({
  className,
  onKeyDown,
  disableAutosize = false,
  ...props
}: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (disableAutosize) return;
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    const max =
      typeof maxHeight === "number" ? `${maxHeight}px` : String(maxHeight);
    el.style.maxHeight = max;
    el.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(el.scrollHeight, maxHeight)}px`
        : `min(${el.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 提交；Shift+Enter 换行；支持 Ctrl/Cmd+Enter 提交
    if (
      (e.key === "Enter" && !e.shiftKey) ||
      ((e.ctrlKey || e.metaKey) && e.key === "Enter")
    ) {
      e.preventDefault();
      onSubmit?.();
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "min-h-[44px] w-full resize-none border-none bg-transparent p-3 text-primary shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        "placeholder:text-muted-foreground",
        className
      )}
      rows={1}
      disabled={disabled}
      {...props}
    />
  );
}

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({
  children,
  className,
  ...props
}: PromptInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

type PromptInputActionProps = {
  className?: string; // 用在 TooltipContent
  tooltip: React.ReactNode;
  children: React.ReactNode; // 可以是任何节点（不要求 forwardRef）
  side?: "top" | "bottom" | "left" | "right";
} & Omit<React.ComponentProps<typeof Tooltip>, "children">;

function PromptInputAction({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput();

  // 关键修复：用一个稳定的 span 作为触发器（可接收 ref），避免 asChild 直接包裹不转发 ref 的组件（如 Magnetic）
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>
        <span
          aria-disabled={disabled || undefined}
          className={cn(
            "inline-flex items-center",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
};
