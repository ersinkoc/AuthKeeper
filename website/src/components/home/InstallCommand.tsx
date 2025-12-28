import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { PACKAGE_MANAGERS } from '@/lib/constants'

export function InstallCommand() {
  const [selected, setSelected] = useState(0)
  const { copied, copy } = useCopyToClipboard()
  const command = PACKAGE_MANAGERS[selected].command

  return (
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <h2 className="text-center text-3xl font-bold mb-8">
            Quick Installation
          </h2>

          {/* Package Manager Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            {PACKAGE_MANAGERS.map((pm, index) => (
              <button
                key={pm.name}
                onClick={() => setSelected(index)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selected === index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {pm.name}
              </button>
            ))}
          </div>

          {/* Command Display */}
          <div className="relative rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <button
                onClick={() => copy(command)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-6 font-mono text-sm text-green-400">
              <span className="text-green-600">$</span> {command}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
