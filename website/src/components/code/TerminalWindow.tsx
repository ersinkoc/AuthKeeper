import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface TerminalWindowProps {
  title?: string
  children: ReactNode
  className?: string
}

export function TerminalWindow({
  title = 'Terminal',
  children,
  className,
}: TerminalWindowProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-700 overflow-hidden shadow-2xl",
        className
      )}
    >
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        {/* Traffic Lights */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-3 text-sm text-zinc-400">{title}</span>
      </div>

      {/* Terminal Content */}
      <div className="p-4 bg-zinc-950 font-mono text-sm text-green-400 leading-relaxed">
        {children}
      </div>
    </div>
  )
}
