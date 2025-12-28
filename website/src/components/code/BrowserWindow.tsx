import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface BrowserWindowProps {
  url?: string
  children: ReactNode
  className?: string
}

export function BrowserWindow({
  url = 'localhost:3000',
  children,
  className,
}: BrowserWindowProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-700 overflow-hidden shadow-2xl",
        className
      )}
    >
      {/* Browser Chrome */}
      <div className="flex items-center gap-4 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        {/* Traffic Lights */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 text-sm text-zinc-400">
            <Lock className="w-3 h-3" />
            <span>{url}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-950">{children}</div>
    </div>
  )
}
