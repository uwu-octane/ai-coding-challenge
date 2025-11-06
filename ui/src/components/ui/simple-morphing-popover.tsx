'use client'

import {
  useState,
  useId,
  createContext,
  useContext,
  isValidElement,
  useRef,
  useEffect,
} from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { AnimatePresence, MotionConfig, motion, type Transition, type Variants } from 'motion/react'
import { cn } from '@/lib/utils'

// 统一过渡
const TRANSITION: Transition = { type: 'spring', bounce: 0.1, duration: 0.4 }

type MorphingPopoverContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  uniqueId: string
  variants?: Variants
}

const MorphingPopoverContext = createContext<MorphingPopoverContextValue | null>(null)

/** 仅管理 open/close 两个动作 */
function usePopoverLogic() {
  const uniqueId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  return { isOpen, open, close, uniqueId }
}

/** 根组件：包一层 context 与动画配置 */
export function SimpleMorphingPopover({
  children,
  transition = TRANSITION,
  variants,
  className,
  ...props
}: {
  children: React.ReactNode
  transition?: Transition
  variants?: Variants
  className?: string
} & React.ComponentProps<'div'>) {
  const logic = usePopoverLogic()
  return (
    <MorphingPopoverContext.Provider value={{ ...logic, variants }}>
      <MotionConfig transition={transition}>
        <div className={cn('relative flex items-center justify-center', className)} {...props}>
          {children}
        </div>
      </MotionConfig>
    </MorphingPopoverContext.Provider>
  )
}

/** 触发器：点击时打开 */
export function SimpleMorphingPopoverTrigger({
  children,
  asChild = false,
  className,
  ...props
}: {
  children: React.ReactNode
  asChild?: boolean
  className?: string
} & React.ComponentProps<typeof motion.button>) {
  const ctx = useContext(MorphingPopoverContext)
  if (!ctx) throw new Error('MorphingPopoverTrigger must be used within MorphingPopover')

  const { onClick, ...restProps } = props

  const composeClick =
    (original?: (event: ReactMouseEvent<any>) => void) => (event: ReactMouseEvent<any>) => {
      original?.(event)
      if (event.defaultPrevented) return
      ctx.open()
    }

  if (asChild && isValidElement(children)) {
    const MotionComp = motion.create(children.type as React.ForwardRefExoticComponent<any>)
    const childProps = children.props as Record<string, unknown>
    const childOnClick = childProps.onClick as
      | ((event: ReactMouseEvent<HTMLElement>) => void)
      | undefined

    return (
      <MotionComp
        {...childProps}
        {...restProps}
        onClick={composeClick((e) => {
          ;(childOnClick as any)?.(e)
          ;(onClick as any)?.(e)
        })}
        layoutId={`popover-trigger-${ctx.uniqueId}`}
        className={cn((childProps.className as string) || '', className)}
        aria-expanded={ctx.isOpen}
        aria-controls={`popover-content-${ctx.uniqueId}`}
        data-state={ctx.isOpen ? 'open' : 'closed'}
      />
    )
  }

  return (
    <motion.button
      {...restProps}
      onClick={composeClick(onClick)}
      layoutId={`popover-trigger-${ctx.uniqueId}`}
      className={className}
      aria-expanded={ctx.isOpen}
      aria-controls={`popover-content-${ctx.uniqueId}`}
      data-state={ctx.isOpen ? 'open' : 'closed'}
    >
      {children}
    </motion.button>
  )
}

/** 内容：仅受 isOpen 控制；调用 ctx.close() 即关闭 */
export function SimpleMorphingPopoverContent({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.ComponentProps<typeof motion.div>) {
  const ctx = useContext(MorphingPopoverContext)
  if (!ctx) throw new Error('MorphingPopoverContent must be used within MorphingPopover')
  const ref = useRef<HTMLDivElement>(null)

  // ESC 关闭
  useEffect(() => {
    if (!ctx.isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        ctx.close()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [ctx.isOpen])

  return (
    <AnimatePresence>
      {ctx.isOpen && (
        <motion.div
          {...props}
          ref={ref}
          layoutId={`popover-content-${ctx.uniqueId}`}
          id={`popover-content-${ctx.uniqueId}`}
          role="dialog"
          aria-modal="true"
          className={cn(
            'absolute rounded-md border border-zinc-950/10 bg-white p-2 shadow-md dark:border-zinc-50/10 dark:bg-zinc-700 dark:text-zinc-50',
            className,
          )}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          variants={ctx.variants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** 导出关闭函数钩子（可选） */
export function useSimpleMorphingPopover() {
  const ctx = useContext(MorphingPopoverContext)
  if (!ctx) throw new Error('useSimpleMorphingPopover must be used within SimpleMorphingPopover')
  return ctx
}
