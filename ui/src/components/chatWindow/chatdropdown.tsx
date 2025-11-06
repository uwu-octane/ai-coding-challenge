import React from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { Plus } from 'lucide-react'
import styles from './chatbox.module.scss'
import { Magnetic } from '../ui/magnetic'

export type DropdownItem = {
  id: string
  title: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}

type Props = {
  items: DropdownItem[]
  activeItemId?: string
  onSelect: (id: string) => void
  onNew: () => void
  className?: string
  buttonClassName?: string
  menuClassName?: string
}

export function ChatDropdown({
  items,
  activeItemId,
  onSelect,
  onNew,
  className,
  buttonClassName,
  menuClassName,
}: Props) {
  const safeItems = items ?? []
  const active = safeItems.find((item) => item.id === activeItemId)
  const label = active?.title ?? safeItems[0]?.title ?? 'New Chat'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            styles.headerTextBtn,
            'inline-flex items-center px-1 rounded-md text-xs font-semibold',
            buttonClassName,
          )}
          aria-label="选择会话"
        >
          <span className="truncate max-w-[14rem] text-xs px-1.5 text-zinc-800 dark:text-zinc-200">
            {label}
          </span>
          <Magnetic intensity={0.08} range={120} springOptions={{ bounce: 0.12 }}>
            <ChevronDown className="size-3 opacity-70" />
          </Magnetic>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="start"
        sideOffset={6}
        className={cn(
          // 容器
          'z-[100] min-w-[100px] overflow-hidden rounded-lg border border-zinc-100 bg-white p-1 shadow-lg',
          'dark:border-zinc-800 dark:bg-zinc-950',
          // 基于 Radix 的动画钩子（Animate-UI 也识别 data-state/data-side）
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
          menuClassName,
        )}
      >
        <DropdownMenuItem
          className={itemCls()}
          onSelect={(e) => {
            e.preventDefault()
            onNew()
          }}
        >
          <Plus className="size-3 mr-1" />
          新建会话
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />

        <div className="max-h-72 overflow-y-auto pr-1">
          {safeItems.length === 0 ? (
            <div className="px-2 py-2 text-xs text-zinc-500">暂无历史会话</div>
          ) : (
            safeItems.map((s) => (
              <DropdownMenuItem
                key={s.id}
                className={itemCls(s.id === activeItemId)}
                onSelect={(e) => {
                  e.preventDefault()
                  onSelect(s.id)
                }}
              >
                {s.icon ? <span className="mr-2 inline-flex">{s.icon}</span> : null}
                <span className="truncate">{s.title}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function itemCls(active = false) {
  return cn(
    'group relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-[13px] outline-none',
    active
      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
      : 'text-zinc-700 dark:text-zinc-200',
    'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
  )
}
