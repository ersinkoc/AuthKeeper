import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import '@/styles/prism.css'

interface SyntaxHighlighterProps {
  code: string
  language: string
  highlightLines?: number[]
}

export function SyntaxHighlighter({
  code,
  language,
  highlightLines = [],
}: SyntaxHighlighterProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, language])

  const lines = code.trim().split('\n')

  return (
    <pre className="!bg-transparent !p-0 !m-0 !border-0">
      <code ref={codeRef} className={`language-${language}`}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              highlightLines.includes(i + 1)
                ? 'bg-blue-500/10 border-l-2 border-blue-500 -ml-2 pl-2'
                : ''
            }
          >
            {line}
            {'\n'}
          </div>
        ))}
      </code>
    </pre>
  )
}
