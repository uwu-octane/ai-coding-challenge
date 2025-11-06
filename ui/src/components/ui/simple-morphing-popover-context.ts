import { createContext, useContext } from "react";

export type MorphingPopoverContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  uniqueId: string;
  variants?: import("motion/react").Variants;
};

export const MorphingPopoverContext =
  createContext<MorphingPopoverContextValue | null>(null);

export function useSimpleMorphingPopover() {
  const ctx = useContext(MorphingPopoverContext);
  if (!ctx)
    throw new Error(
      "useSimpleMorphingPopover must be used within SimpleMorphingPopover"
    );
  return ctx;
}
