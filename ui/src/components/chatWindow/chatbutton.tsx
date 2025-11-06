import React from "react";
import { Magnetic } from "@/components/ui/magnetic";
import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";

type Props = React.ComponentProps<typeof motion.button>;

const ChatButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, ...rest }, ref) => {
    const outer = {
      intensity: 0.2,
      range: 150,
      actionArea: "global" as const,
      springOptions: { bounce: 0.1 },
    };
    const inner = {
      intensity: 0.1,
      range: 150,
      actionArea: "global" as const,
      springOptions: { bounce: 0.1 },
    };
    return (
      <Magnetic {...outer}>
        <motion.button
          ref={ref}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className={
            "inline-flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-950 text-zinc-50 shadow-md transition-all duration-300 hover:scale-105 hover:bg-zinc-800 active:scale-95 dark:border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200" +
            (className ? ` ${className}` : "")
          }
          {...rest}
        >
          <Magnetic {...inner}>
            <MessageCircle className="size-4" />
          </Magnetic>
        </motion.button>
      </Magnetic>
    );
  }
);

ChatButton.displayName = "ChatButton";
export { ChatButton };
