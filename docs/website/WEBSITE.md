# @oxog Package Documentation Website

## Website Identity

- **Package Name**: `{{PACKAGE_NAME}}`
- **NPM Package**: `@oxog/{{PACKAGE_SLUG}}`
- **Website URL**: `https://{{PACKAGE_SLUG}}.oxog.dev`
- **Repository**: `https://github.com/ersinkoc/{{PACKAGE_SLUG}}`
- **Author**: Ersin KOÇ

---

## TECHNOLOGY STACK (MANDATORY - NO EXCEPTIONS)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18+ (latest) | UI framework |
| **Vite** | 5+ (latest) | Build tool, dev server |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3+ | Styling (npm install, NOT CDN) |
| **shadcn/ui** | Latest | UI component library |
| **React Router** | 6+ | Client-side routing |
| **Lucide React** | Latest | Icon library (ONLY icons allowed) |
| **Framer Motion** | Latest | Animations |
| **Prism.js** | Latest | Syntax highlighting |

---

## FONTS (MANDATORY)

```css
/* Import from Google Fonts in index.css */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --font-mono: 'JetBrains Mono', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
}

code, pre, .code-block, .terminal {
  font-family: var(--font-mono);
}
```

**JetBrains Mono** → ALL code, terminal, code blocks
**Inter** → All body text, headings, UI

---

## PROJECT STRUCTURE

```
website/
├── public/
│   ├── favicon.svg
│   ├── og-image.png                    # 1200x630 social image
│   └── robots.txt
│
├── src/
│   ├── main.tsx                        # Entry point
│   ├── App.tsx                         # Router setup
│   ├── index.css                       # Global styles + Tailwind
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── select.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx              # Main navigation
│   │   │   ├── Footer.tsx              # Site footer
│   │   │   ├── Sidebar.tsx             # Docs sidebar
│   │   │   ├── MobileNav.tsx           # Mobile menu (Sheet)
│   │   │   ├── Layout.tsx              # Main layout wrapper
│   │   │   └── DocsLayout.tsx          # Docs page layout
│   │   │
│   │   ├── home/
│   │   │   ├── Hero.tsx                # Animated hero section
│   │   │   ├── Features.tsx            # Feature cards grid
│   │   │   ├── CodePreview.tsx         # IDE-style code preview
│   │   │   ├── InstallCommand.tsx      # Copy-able install command
│   │   │   ├── PackageManagerTabs.tsx  # npm/yarn/pnpm/bun tabs
│   │   │   ├── Stats.tsx               # Bundle size, stars, etc.
│   │   │   ├── Comparison.tsx          # vs other libraries
│   │   │   └── CTA.tsx                 # Call to action section
│   │   │
│   │   ├── code/                       # CODE DISPLAY (CRITICAL)
│   │   │   ├── CodeBlock.tsx           # Main code component
│   │   │   ├── LineNumbers.tsx         # Line number gutter
│   │   │   ├── CopyButton.tsx          # Copy to clipboard
│   │   │   ├── SyntaxHighlighter.tsx   # Prism.js wrapper
│   │   │   ├── CodeTabs.tsx            # Multi-file tabs
│   │   │   ├── FrameworkTabs.tsx       # React/Vue/Svelte tabs
│   │   │   ├── IDEWindow.tsx           # VS Code style window
│   │   │   ├── BrowserWindow.tsx       # Browser chrome window
│   │   │   └── TerminalWindow.tsx      # Terminal window
│   │   │
│   │   ├── docs/
│   │   │   ├── DocPage.tsx             # Documentation wrapper
│   │   │   ├── TableOfContents.tsx     # Right sidebar TOC
│   │   │   ├── Breadcrumb.tsx          # Breadcrumb navigation
│   │   │   ├── PrevNextNav.tsx         # Previous/Next links
│   │   │   ├── SearchDialog.tsx        # Cmd+K search modal
│   │   │   └── OnThisPage.tsx          # Current page sections
│   │   │
│   │   ├── api/
│   │   │   ├── ApiTable.tsx            # API reference table
│   │   │   ├── PropsTable.tsx          # Component props table
│   │   │   ├── TypeDef.tsx             # TypeScript type display
│   │   │   ├── MethodCard.tsx          # Method documentation
│   │   │   ├── ParamList.tsx           # Parameter list
│   │   │   └── ReturnType.tsx          # Return type display
│   │   │
│   │   ├── examples/
│   │   │   ├── ExampleCard.tsx         # Example preview card
│   │   │   ├── ExampleViewer.tsx       # Full example view
│   │   │   ├── LivePreview.tsx         # Live demo component
│   │   │   └── SourceCode.tsx          # Source code display
│   │   │
│   │   ├── playground/
│   │   │   ├── PlaygroundLayout.tsx    # Playground layout
│   │   │   ├── Editor.tsx              # Code editor
│   │   │   ├── Preview.tsx             # Live preview
│   │   │   ├── Console.tsx             # Console output
│   │   │   ├── Controls.tsx            # Run/Reset/Share buttons
│   │   │   └── Presets.tsx             # Example presets
│   │   │
│   │   └── shared/
│   │       ├── Logo.tsx                # Package logo
│   │       ├── ThemeProvider.tsx       # Theme context
│   │       ├── ThemeToggle.tsx         # Dark/Light toggle
│   │       ├── GitHubButton.tsx        # GitHub link button
│   │       ├── NpmBadge.tsx            # NPM version badge
│   │       ├── BundleSizeBadge.tsx     # Bundle size badge
│   │       ├── Callout.tsx             # Info/Warning/Tip boxes
│   │       ├── ScrollToTop.tsx         # Scroll to top button
│   │       └── ExternalLink.tsx        # External link component
│   │
│   ├── pages/
│   │   ├── Home.tsx                    # Landing page
│   │   ├── NotFound.tsx                # 404 page
│   │   │
│   │   ├── docs/
│   │   │   ├── index.tsx               # Docs home
│   │   │   ├── GettingStarted.tsx      # Installation & setup
│   │   │   ├── QuickStart.tsx          # Quick start guide
│   │   │   │
│   │   │   ├── concepts/               # Conceptual guides
│   │   │   │   └── [concept].tsx
│   │   │   │
│   │   │   ├── api/                    # API reference
│   │   │   │   ├── index.tsx           # API overview
│   │   │   │   └── [method].tsx        # Per-method docs
│   │   │   │
│   │   │   ├── plugins/                # Plugin docs (if applicable)
│   │   │   │   └── [plugin].tsx
│   │   │   │
│   │   │   ├── frameworks/             # Framework guides
│   │   │   │   ├── React.tsx
│   │   │   │   ├── Vue.tsx
│   │   │   │   └── Svelte.tsx
│   │   │   │
│   │   │   └── guides/                 # How-to guides
│   │   │       └── [guide].tsx
│   │   │
│   │   ├── examples/
│   │   │   ├── index.tsx               # Examples gallery
│   │   │   └── [example].tsx           # Individual examples
│   │   │
│   │   └── playground/
│   │       └── index.tsx               # Interactive playground
│   │
│   ├── hooks/
│   │   ├── useTheme.ts                 # Theme hook
│   │   ├── useCopyToClipboard.ts       # Copy hook
│   │   ├── useScrollSpy.ts             # TOC active section
│   │   ├── useLocalStorage.ts          # localStorage hook
│   │   ├── useMediaQuery.ts            # Responsive hook
│   │   └── useKeyboardShortcut.ts      # Keyboard shortcuts
│   │
│   ├── lib/
│   │   ├── utils.ts                    # cn() and utilities
│   │   ├── constants.ts                # Site constants
│   │   ├── docs-config.ts              # Sidebar navigation
│   │   └── prism-theme.ts              # Custom Prism theme
│   │
│   └── styles/
│       ├── globals.css                 # Global styles
│       └── prism.css                   # Prism theme CSS
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── components.json                     # shadcn/ui config
```

---

## REQUIRED PAGES

### 1. Home Page (`/`)

Must include:
- **Hero Section**
  - Package logo (animated with Framer Motion)
  - Package name and one-liner tagline
  - Install command with copy button
  - CTA buttons: "Get Started" and "View on GitHub"
  - Animated background or gradient

- **Install Command**
  - Tabs for npm/yarn/pnpm/bun
  - Copy button with "Copied!" feedback
  - Terminal-style window

- **Features Grid**
  - 4-6 feature cards
  - Icon + title + description
  - Subtle hover animations

- **Code Preview**
  - IDE-style window (VS Code look)
  - Syntax highlighted code
  - Line numbers
  - Filename in header

- **Stats Section**
  - Bundle size badge
  - Zero dependencies badge
  - TypeScript badge
  - License badge

### 2. Getting Started (`/docs/getting-started`)

- Installation (all package managers)
- Basic setup
- First example with full code
- Next steps links

### 3. API Reference (`/docs/api/*`)

- Complete API documentation
- Props/parameters tables with types
- Return types
- Usage examples for each method
- TypeScript type definitions

### 4. Examples (`/examples`)

- Gallery of example cards
- Each with:
  - Preview image or live demo
  - Title and description
  - Full source code
  - Copy button
  - "Open in Playground" link

### 5. Playground (`/playground`)

- Split view: Editor | Preview
- Code editor with syntax highlighting
- Real-time preview
- Console output panel
- Preset examples dropdown
- Reset and Share buttons
- Error display

---

## CODE BLOCK COMPONENT (CRITICAL)

Every code block MUST have these features:

```tsx
// src/components/code/CodeBlock.tsx
import { useState } from 'react'
import { Check, Copy, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LineNumbers } from './LineNumbers'
import { SyntaxHighlighter } from './SyntaxHighlighter'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

interface CodeBlockProps {
  code: string
  language: string
  filename?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  showCopyButton?: boolean
  maxHeight?: string
  className?: string
}

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  showCopyButton = true,
  maxHeight,
  className,
}: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard()
  const lines = code.trim().split('\n')
  const lineCount = lines.length

  return (
    <div className={cn(
      "code-block-wrapper rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden",
      className
    )}>
      {/* Header */}
      {(filename || showCopyButton) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
          {filename && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <File className="w-4 h-4" />
              <span>{filename}</span>
            </div>
          )}
          {!filename && <div />}
          {showCopyButton && (
            <button
              onClick={() => copy(code)}
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
          )}
        </div>
      )}

      {/* Code Content */}
      <div 
        className="flex overflow-x-auto"
        style={{ maxHeight: maxHeight || 'none' }}
      >
        {showLineNumbers && (
          <LineNumbers 
            count={lineCount} 
            highlightLines={highlightLines}
          />
        )}
        <div className="flex-1 p-4 overflow-x-auto">
          <SyntaxHighlighter 
            code={code} 
            language={language}
            highlightLines={highlightLines}
          />
        </div>
      </div>
    </div>
  )
}
```

### Line Numbers Component

```tsx
// src/components/code/LineNumbers.tsx
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
```

### Copy Hook

```tsx
// src/hooks/useCopyToClipboard.ts
import { useState, useCallback } from 'react'

export function useCopyToClipboard(duration = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), duration)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [duration])

  return { copied, copy }
}
```

---

## WINDOW COMPONENTS

### IDE Window (VS Code Style)

```tsx
// src/components/code/IDEWindow.tsx
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
  className 
}: IDEWindowProps) {
  return (
    <div className={cn(
      "rounded-lg border border-zinc-700 overflow-hidden shadow-2xl",
      className
    )}>
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
          />
        </div>
      </div>
    </div>
  )
}
```

### Browser Window

```tsx
// src/components/code/BrowserWindow.tsx
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrowserWindowProps {
  url?: string
  children: React.ReactNode
  className?: string
}

export function BrowserWindow({ 
  url = 'localhost:3000', 
  children,
  className 
}: BrowserWindowProps) {
  return (
    <div className={cn(
      "rounded-lg border border-zinc-700 overflow-hidden shadow-2xl",
      className
    )}>
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
      <div className="bg-white dark:bg-zinc-950">
        {children}
      </div>
    </div>
  )
}
```

### Terminal Window

```tsx
// src/components/code/TerminalWindow.tsx
import { cn } from '@/lib/utils'

interface TerminalWindowProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function TerminalWindow({ 
  title = 'Terminal', 
  children,
  className 
}: TerminalWindowProps) {
  return (
    <div className={cn(
      "rounded-lg border border-zinc-700 overflow-hidden shadow-2xl",
      className
    )}>
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
```

---

## THEME SYSTEM (MANDATORY)

### Theme Provider

```tsx
// src/components/shared/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system'
    }
    return 'system'
  })
  
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const root = document.documentElement
    
    const applyTheme = (newTheme: 'dark' | 'light') => {
      setResolvedTheme(newTheme)
      root.classList.remove('light', 'dark')
      root.classList.add(newTheme)
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches ? 'dark' : 'light')
      
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      applyTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### Theme Toggle

```tsx
// src/components/shared/ThemeToggle.tsx
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## COLOR SYSTEM

### Tailwind Config Colors

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### CSS Variables

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
  code, pre {
    @apply font-mono;
  }
}
```

---

## SYNTAX HIGHLIGHTING

### Prism Theme

```css
/* src/styles/prism.css */
code[class*="language-"],
pre[class*="language-"] {
  color: #e4e4e7;
  background: transparent;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  direction: ltr;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  tab-size: 2;
  hyphens: none;
}

/* Tokens */
.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #71717a;
  font-style: italic;
}

.token.punctuation {
  color: #a1a1aa;
}

.token.property,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted {
  color: #f472b6;
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: #a5f3fc;
}

.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string {
  color: #fcd34d;
}

.token.atrule,
.token.attr-value,
.token.keyword {
  color: #c4b5fd;
}

.token.function,
.token.class-name {
  color: #67e8f9;
}

.token.regex,
.token.important,
.token.variable {
  color: #fb923c;
}

.token.important,
.token.bold {
  font-weight: bold;
}

.token.italic {
  font-style: italic;
}

.token.entity {
  cursor: help;
}

/* Line highlighting */
.line-highlight {
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  margin-left: -1rem;
  padding-left: calc(1rem - 3px);
}
```

---

## GITHUB ACTIONS DEPLOYMENT

```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'
      - '.github/workflows/deploy-website.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: website/package-lock.json

      - name: Install dependencies
        working-directory: website
        run: npm ci

      - name: Build website
        working-directory: website
        run: npm run build

      - name: Add CNAME
        run: echo "{{PACKAGE_SLUG}}.oxog.dev" > website/dist/CNAME

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: website/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## PACKAGE.JSON

```json
{
  "name": "{{PACKAGE_SLUG}}-website",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "framer-motion": "^10.18.0",
    "lucide-react": "^0.303.0",
    "prismjs": "^1.29.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "react-helmet-async": "^2.0.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/prismjs": "^1.26.3",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
```

---

## VITE CONFIG

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          radix: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
          ],
        },
      },
    },
  },
})
```

---

## SHADCN/UI CONFIG

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## IMPLEMENTATION CHECKLIST

### Setup
- [ ] Create website folder structure
- [ ] Initialize with Vite + React + TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Install shadcn/ui and add components
- [ ] Setup React Router
- [ ] Configure path aliases

### Fonts & Styling
- [ ] Import JetBrains Mono from Google Fonts
- [ ] Import Inter from Google Fonts
- [ ] Configure Tailwind fontFamily
- [ ] Setup CSS variables for colors
- [ ] Create Prism.js theme

### Theme System
- [ ] Create ThemeProvider
- [ ] Create ThemeToggle component
- [ ] Persist theme in localStorage
- [ ] Support dark/light/system

### Code Components
- [ ] Create CodeBlock with line numbers
- [ ] Create CopyButton with feedback
- [ ] Create IDEWindow component
- [ ] Create BrowserWindow component
- [ ] Create TerminalWindow component
- [ ] Setup Prism.js syntax highlighting

### Pages
- [ ] Create Home page with hero
- [ ] Create Getting Started page
- [ ] Create API Reference pages
- [ ] Create Examples page
- [ ] Create Playground page
- [ ] Create 404 page

### Layout
- [ ] Create Header with navigation
- [ ] Create Footer
- [ ] Create Sidebar for docs
- [ ] Create MobileNav
- [ ] Create DocsLayout

### Deployment
- [ ] Create GitHub Actions workflow
- [ ] Configure CNAME for custom domain
- [ ] Test build process
- [ ] Verify deployment

### Quality
- [ ] Responsive design (mobile-first)
- [ ] Keyboard navigation
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] SEO meta tags
- [ ] Open Graph image
- [ ] Lighthouse score > 90

---

## BEGIN IMPLEMENTATION

Start by creating the project structure and installing dependencies. Follow the checklist above sequentially.

**CRITICAL REQUIREMENTS:**
1. ALL code blocks must have line numbers
2. ALL code blocks must have copy button
3. JetBrains Mono for ALL code
4. Dark/Light theme toggle is MANDATORY
5. IDE/Browser/Terminal windows for code display
6. GitHub Actions for deployment

**Website URL:** `https://{{PACKAGE_SLUG}}.oxog.dev`
**Repository:** `https://github.com/ersinkoc/{{PACKAGE_SLUG}}`