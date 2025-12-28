import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Terminal, Wrench } from 'lucide-react'

export function Playground() {
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
            <Play className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Playground</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive playground to test AuthKeeper features
          </p>
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="border-dashed">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Under Construction</CardTitle>
              <CardDescription className="text-base">
                The interactive playground is currently under development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  Upcoming Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Live code editor with TypeScript support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Real-time preview of AuthKeeper functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Pre-configured examples and templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Console output and event logging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Share and export your code</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                  Try it Locally
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  While the playground is being developed, you can try AuthKeeper locally:
                </p>
                <pre className="bg-background/50 p-3 rounded text-xs font-mono overflow-x-auto">
                  <code>npm install @oxog/authkeeper{'\n'}npm run dev</code>
                </pre>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Check out our{' '}
                  <a href="/examples" className="text-primary hover:underline font-medium">
                    Examples
                  </a>{' '}
                  and{' '}
                  <a href="/docs" className="text-primary hover:underline font-medium">
                    Documentation
                  </a>{' '}
                  in the meantime!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get started with AuthKeeper in under 5 minutes
              </p>
              <a
                href="/docs"
                className="text-sm text-primary hover:underline font-medium mt-2 inline-block"
              >
                Read Guide →
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore practical examples and use cases
              </p>
              <a
                href="/examples"
                className="text-sm text-primary hover:underline font-medium mt-2 inline-block"
              >
                View Examples →
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">API Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete API documentation and types
              </p>
              <a
                href="/docs/api"
                className="text-sm text-primary hover:underline font-medium mt-2 inline-block"
              >
                View API →
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
