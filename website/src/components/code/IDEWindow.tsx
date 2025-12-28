import { cn } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'

interface IDEWindowProps {
  filename: string
  code: string
  language: string
  showSidebar?: boolean
  className?: string
}

export function IDEWindow({
  filename,
  code,
  language,
  showSidebar = true,
  className,
}: IDEWindowProps) {
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
        {/* Filename */}
        <span className="ml-3 text-sm text-zinc-400">{filename}</span>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-12 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-3 gap-3">
            <div className="w-6 h-6 rounded bg-zinc-800" />
            <div className="w-6 h-6 rounded bg-zinc-800" />
            <div className="w-6 h-6 rounded bg-zinc-800" />
          </div>
        )}

        {/* Code Area */}
        <div className="flex-1 bg-zinc-950">
          <CodeBlock
            code={code}
            language={language}
            showLineNumbers
            showCopyButton
            className="!border-0 !rounded-none"
          />
        </div>
      </div>
    </div>
  )
}
