import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/code/CodeBlock'
import { Book, Code2, Settings } from 'lucide-react'

const apiMethods = [
  {
    category: 'Lifecycle',
    icon: Settings,
    methods: [
      {
        name: 'init()',
        description: 'Initialize the AuthKeeper instance',
        signature: 'async init(): Promise<void>',
        example: `const auth = await createAuthKeeper(options)
await auth.init()`,
      },
      {
        name: 'destroy()',
        description: 'Cleanup and destroy the instance',
        signature: 'destroy(): void',
        example: `auth.destroy()`,
      },
    ],
  },
  {
    category: 'Token Management',
    icon: Code2,
    methods: [
      {
        name: 'setTokens()',
        description: 'Set authentication tokens',
        signature: 'setTokens(tokens: TokenSet): void',
        example: `auth.setTokens({
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  expiresIn: 3600 // seconds
})`,
      },
      {
        name: 'getAccessToken()',
        description: 'Get the current access token',
        signature: 'getAccessToken(): string | null',
        example: `const token = auth.getAccessToken()`,
      },
      {
        name: 'getRefreshToken()',
        description: 'Get the current refresh token',
        signature: 'getRefreshToken(): string | null',
        example: `const refreshToken = auth.getRefreshToken()`,
      },
      {
        name: 'clearTokens()',
        description: 'Clear all tokens',
        signature: 'clearTokens(): void',
        example: `auth.clearTokens()`,
      },
    ],
  },
  {
    category: 'Auth State',
    icon: Book,
    methods: [
      {
        name: 'isAuthenticated()',
        description: 'Check if user is authenticated',
        signature: 'isAuthenticated(): boolean',
        example: `if (auth.isAuthenticated()) {
  console.log('User is logged in')
}`,
      },
      {
        name: 'isExpired()',
        description: 'Check if token is expired',
        signature: 'isExpired(): boolean',
        example: `if (auth.isExpired()) {
  console.log('Token expired')
}`,
      },
      {
        name: 'getExpiresAt()',
        description: 'Get token expiration date',
        signature: 'getExpiresAt(): Date | null',
        example: `const expiresAt = auth.getExpiresAt()
console.log('Expires at:', expiresAt)`,
      },
      {
        name: 'getTimeUntilExpiry()',
        description: 'Get milliseconds until expiration',
        signature: 'getTimeUntilExpiry(): number | null',
        example: `const ms = auth.getTimeUntilExpiry()
console.log('Time until expiry:', ms)`,
      },
    ],
  },
  {
    category: 'Token Refresh',
    icon: Code2,
    methods: [
      {
        name: 'refresh()',
        description: 'Manually refresh tokens',
        signature: 'async refresh(): Promise<TokenSet>',
        example: `try {
  const newTokens = await auth.refresh()
  console.log('Refreshed:', newTokens)
} catch (error) {
  console.error('Refresh failed:', error)
}`,
      },
      {
        name: 'scheduleRefresh()',
        description: 'Schedule automatic token refresh',
        signature: 'scheduleRefresh(): void',
        example: `auth.scheduleRefresh()`,
      },
      {
        name: 'cancelScheduledRefresh()',
        description: 'Cancel scheduled refresh',
        signature: 'cancelScheduledRefresh(): void',
        example: `auth.cancelScheduledRefresh()`,
      },
    ],
  },
  {
    category: 'Events',
    icon: Book,
    methods: [
      {
        name: 'on()',
        description: 'Subscribe to events',
        signature: 'on<E extends EventType>(eventType: E, handler: EventHandler<E>): Unsubscribe',
        example: `const unsubscribe = auth.on('login', (event) => {
  console.log('User logged in:', event.tokens)
})

// Later: unsubscribe()`,
      },
      {
        name: 'off()',
        description: 'Unsubscribe from events',
        signature: 'off<E extends EventType>(eventType: E, handler: EventHandler<E>): void',
        example: `const handler = (event) => console.log(event)
auth.on('logout', handler)
auth.off('logout', handler)`,
      },
      {
        name: 'emit()',
        description: 'Emit custom events',
        signature: 'emit(event: AuthEvent): void',
        example: `auth.emit({
  type: 'custom',
  payload: { data: 'value' }
})`,
      },
    ],
  },
]

export function API() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Book className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">API Reference</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete API documentation for AuthKeeper
          </p>
        </motion.div>

        {/* API Methods */}
        <div className="space-y-12">
          {apiMethods.map((category, categoryIndex) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h2 className="text-3xl font-bold">{category.category}</h2>
                </div>

                <div className="space-y-6">
                  {category.methods.map((method, methodIndex) => (
                    <Card key={method.name}>
                      <CardHeader>
                        <CardTitle className="font-mono text-xl">
                          {method.name}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {method.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                            Signature
                          </h4>
                          <code className="text-sm bg-secondary px-2 py-1 rounded font-mono">
                            {method.signature}
                          </code>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                            Example
                          </h4>
                          <CodeBlock
                            code={method.example}
                            language="typescript"
                            showLineNumbers={false}
                            showCopyButton
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Types Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold mb-6">Type Definitions</h2>
          <Card>
            <CardHeader>
              <CardTitle>Core Types</CardTitle>
              <CardDescription>
                TypeScript type definitions for AuthKeeper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock
                code={`interface TokenSet {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: string
}

interface KernelOptions {
  refreshToken: RefreshTokenFn
  autoRefresh?: boolean
  refreshThreshold?: number
  syncTabs?: boolean
  storage?: StorageAdapter | 'localStorage' | 'sessionStorage' | 'memory'
  plugins?: Plugin[]
  onError?: (error: Error) => void
}

interface Plugin {
  name: string
  version: string
  type: 'core' | 'custom'
  install(kernel: AuthKeeper): PluginAPI | void
  uninstall?(): void
}

type RefreshTokenFn = (refreshToken: string) => Promise<TokenSet>

type EventType =
  | 'login'
  | 'logout'
  | 'refresh:start'
  | 'refresh:success'
  | 'refresh:error'
  | 'token:expired'
  | 'error'`}
                language="typescript"
                showLineNumbers
                showCopyButton
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
