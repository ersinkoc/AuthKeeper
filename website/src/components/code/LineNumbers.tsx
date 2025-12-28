import { cn } from '@/lib/utils'

interface LineNumbersProps {
  count: number
  highlightLines?: number[]
}

export function LineNumbers({ count, highlightLines = [] }: LineNumbersProps) {
  return (
    <div className="flex flex-col items-end py-4 pl-4 pr-4 text-zinc-600 select-none border-r border-zinc-800 bg-zinc-900/30 font-mono">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i + 1}
          className={cn(
            "text-xs leading-6 tabular-nums",
            highlightLines.includes(i + 1) && "text-blue-400"
          )}
        >
          {i + 1}
        </span>
      ))}
    </div>
  )
}
