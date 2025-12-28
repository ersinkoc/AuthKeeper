import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Shield, Zap, Code, Lock, RefreshCw, Boxes, CheckCircle2, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Zero Dependencies',
    description: 'Pure TypeScript implementation with no runtime dependencies'
  },
  {
    icon: Boxes,
    title: 'Plugin Architecture',
    description: 'Micro-kernel design with extensible plugin system'
  },
  {
    icon: RefreshCw,
    title: 'Auto-Refresh',
    description: 'Smart token refresh with queuing and retry logic'
  },
  {
    icon: Lock,
    title: 'Type-Safe',
    description: 'Full TypeScript support with strict mode compatibility'
  },
  {
    icon: Zap,
    title: 'Fast & Lightweight',
    description: 'Optimized performance with minimal memory footprint'
  },
  {
    icon: Code,
    title: 'Framework Agnostic',
    description: 'Works with React, Vue, Svelte, and vanilla JS'
  }
]

const stats = [
  { value: '541', label: 'Tests Passing' },
  { value: '99.83%', label: 'Code Coverage' },
  { value: '0', label: 'Dependencies' },
  { value: '<3s', label: 'Test Time' }
]

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0 grid-background opacity-50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm bg-secondary/50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-mono">v1.0.0 - Production Ready</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Auth Management
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Zero-dependency token & auth management toolkit with a micro-kernel plugin architecture.
              Built for developers who care about code quality.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/docs">
                <Button size="lg" className="font-mono">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/playground">
                <Button size="lg" variant="outline" className="font-mono">
                  Try Playground
                </Button>
              </Link>
            </div>

            {/* Code Preview */}
            <div className="browser-window max-w-3xl mx-auto mt-12">
              <div className="browser-controls">
                <div className="browser-dot browser-dot-red"></div>
                <div className="browser-dot browser-dot-yellow"></div>
                <div className="browser-dot browser-dot-green"></div>
              </div>
              <div className="bg-secondary/50 p-6">
                <pre className="text-left text-sm"><code className="font-mono">{`import { createAuthKeeper } from '@oxog/authkeeper'

const auth = await createAuthKeeper({
  refreshToken: async () => {
    const res = await fetch('/api/refresh')
    return res.json()
  }
})

// Set tokens - auto-refresh enabled!
await auth.setTokens({
  accessToken: 'your-jwt-token',
  refreshToken: 'your-refresh-token',
  expiresIn: 3600
})

// All fetch requests now include auth headers
const data = await auth.fetch('/api/protected')`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold font-mono text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Built for Modern Applications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for robust authentication and authorization in your apps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground">
              Install AuthKeeper and start building secure applications in minutes
            </p>
            <div className="terminal max-w-2xl mx-auto">
              <div className="terminal-prompt">npm install @oxog/authkeeper</div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/docs">
                <Button size="lg" className="font-mono">
                  Read Documentation
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="font-mono" asChild>
                <a href="https://github.com/ersinkoc/authkeeper">
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
