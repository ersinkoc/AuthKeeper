import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/code/CodeBlock'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Code2 } from 'lucide-react'

const basicExample = `import { createAuthKeeper } from '@oxog/authkeeper'

// Create AuthKeeper instance
const auth = await createAuthKeeper({
  refreshToken: async (refreshToken) => {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
    return res.json()
  },
  autoRefresh: true,
  refreshThreshold: 60,
})

// Set tokens
auth.setTokens({
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  expiresIn: 3600,
})

// Make authenticated requests
const authFetch = auth.createFetch()
const response = await authFetch('/api/protected')
const data = await response.json()`

const eventExample = `import { createAuthKeeper } from '@oxog/authkeeper'

const auth = await createAuthKeeper({
  refreshToken: refreshFn,
})

// Subscribe to login event
auth.on('login', (event) => {
  console.log('User logged in:', event.tokens)
  // Update UI, redirect, etc.
})

// Subscribe to logout event
auth.on('logout', (event) => {
  console.log('User logged out:', event.reason)
  window.location.href = '/login'
})

// Subscribe to refresh events
auth.on('refresh:success', (event) => {
  console.log('Tokens refreshed successfully')
})

auth.on('refresh:error', (event) => {
  console.error('Token refresh failed:', event.error)
  // Handle refresh failure
})`

const storageExample = `import { createAuthKeeper } from '@oxog/authkeeper'

// Use localStorage (default)
const auth1 = await createAuthKeeper({
  refreshToken: refreshFn,
  storage: 'localStorage',
})

// Use sessionStorage
const auth2 = await createAuthKeeper({
  refreshToken: refreshFn,
  storage: 'sessionStorage',
})

// Use custom storage adapter
const customStorage = {
  getItem: async (key) => {
    // Your custom logic
    return await myDatabase.get(key)
  },
  setItem: async (key, value) => {
    await myDatabase.set(key, value)
  },
  removeItem: async (key) => {
    await myDatabase.delete(key)
  },
}

const auth3 = await createAuthKeeper({
  refreshToken: refreshFn,
  storage: customStorage,
})`

const pluginExample = `import { createAuthKeeper, type Plugin } from '@oxog/authkeeper'

// Create a custom plugin
const analyticsPlugin: Plugin = {
  name: 'analytics',
  version: '1.0.0',
  type: 'custom',

  install(kernel) {
    // Track login events
    kernel.on('login', () => {
      analytics.track('user_login')
    })

    // Track logout events
    kernel.on('logout', () => {
      analytics.track('user_logout')
    })

    // Track refresh events
    kernel.on('refresh:success', () => {
      analytics.track('token_refresh_success')
    })

    return {
      // Public API
      trackCustomEvent(name: string) {
        analytics.track(name)
      },
    }
  },

  uninstall() {
    // Cleanup
  },
}

// Register the plugin
const auth = await createAuthKeeper({
  refreshToken: refreshFn,
  plugins: [analyticsPlugin],
})

// Use plugin methods
auth.getPlugin('analytics')?.trackCustomEvent('custom_event')`

const examples = [
  {
    id: 'basic',
    title: 'Basic Usage',
    description: 'Get started with AuthKeeper in minutes',
    code: basicExample,
  },
  {
    id: 'events',
    title: 'Event Handling',
    description: 'Subscribe to authentication lifecycle events',
    code: eventExample,
  },
  {
    id: 'storage',
    title: 'Custom Storage',
    description: 'Use different storage adapters or create your own',
    code: storageExample,
  },
  {
    id: 'plugins',
    title: 'Custom Plugins',
    description: 'Extend functionality with custom plugins',
    code: pluginExample,
  },
]

export function Examples() {
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
            <Code2 className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Examples</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practical examples to help you get started with AuthKeeper
          </p>
        </motion.div>

        {/* Examples */}
        <div className="space-y-12">
          {examples.map((example, index) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    {example.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {example.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={example.code}
                    language="typescript"
                    filename={`${example.id}.ts`}
                    showLineNumbers
                    showCopyButton
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Framework Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">
            Framework Integration
          </h2>

          <Tabs defaultValue="react" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="vue">Vue</TabsTrigger>
              <TabsTrigger value="svelte">Svelte</TabsTrigger>
            </TabsList>

            <TabsContent value="react" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>React Integration</CardTitle>
                  <CardDescription>
                    Use AuthKeeper with React hooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={`import { createAuthKeeper } from '@oxog/authkeeper'
import { useState, useEffect } from 'react'

export function useAuth() {
  const [auth] = useState(() => createAuthKeeper({
    refreshToken: async (token) => {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token })
      })
      return res.json()
    }
  }))

  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    auth.on('login', () => setIsAuthenticated(true))
    auth.on('logout', () => setIsAuthenticated(false))
  }, [auth])

  return { auth, isAuthenticated }
}`}
                    language="typescript"
                    filename="useAuth.ts"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vue" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vue Integration</CardTitle>
                  <CardDescription>
                    Use AuthKeeper with Vue composition API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={`import { createAuthKeeper } from '@oxog/authkeeper'
import { ref, onMounted } from 'vue'

export function useAuth() {
  const auth = createAuthKeeper({
    refreshToken: async (token) => {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token })
      })
      return res.json()
    }
  })

  const isAuthenticated = ref(false)

  onMounted(() => {
    auth.on('login', () => isAuthenticated.value = true)
    auth.on('logout', () => isAuthenticated.value = false)
  })

  return { auth, isAuthenticated }
}`}
                    language="typescript"
                    filename="useAuth.ts"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="svelte" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Svelte Integration</CardTitle>
                  <CardDescription>
                    Use AuthKeeper with Svelte stores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={`import { createAuthKeeper } from '@oxog/authkeeper'
import { writable } from 'svelte/store'

const auth = createAuthKeeper({
  refreshToken: async (token) => {
    const res = await fetch('/api/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token })
    })
    return res.json()
  }
})

export const isAuthenticated = writable(false)

auth.on('login', () => isAuthenticated.set(true))
auth.on('logout', () => isAuthenticated.set(false))

export { auth }`}
                    language="typescript"
                    filename="auth.ts"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
