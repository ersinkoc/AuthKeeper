import { motion } from 'framer-motion'
import { IDEWindow } from '@/components/code/IDEWindow'

const exampleCode = `import { createAuthKeeper } from '@oxog/authkeeper'

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
  refreshThreshold: 60, // Refresh 60s before expiry
})

// Set initial tokens
auth.setTokens({
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  expiresIn: 3600, // 1 hour
})

// Create authenticated fetch
const authFetch = auth.createFetch()

// Make authenticated requests
const response = await authFetch('/api/protected')
const data = await response.json()
`

export function CodePreview() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl font-bold mb-8">
            Simple & Powerful API
          </h2>

          <div className="mx-auto max-w-4xl">
            <IDEWindow
              filename="app.ts"
              code={exampleCode}
              language="typescript"
              showSidebar={false}
            />
          </div>

          <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            AuthKeeper provides a simple, intuitive API for managing
            authentication tokens with automatic refresh, fetch interception,
            and a powerful plugin system.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
