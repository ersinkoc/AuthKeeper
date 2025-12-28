import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Book, Rocket } from 'lucide-react'

interface ContentItem {
  title: string
  description?: string
  code?: string
}

interface Section {
  id: string
  title: string
  icon: typeof Book
  content: ContentItem[]
}

const sections: Section[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    content: [
      {
        title: 'Installation',
        code: `npm install @oxog/authkeeper`
      },
      {
        title: 'Basic Setup',
        code: `import { createAuthKeeper } from '@oxog/authkeeper'

const auth = await createAuthKeeper({
  refreshToken: async () => {
    const response = await fetch('/api/refresh')
    return response.json()
  }
})

await auth.setTokens({
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  expiresIn: 3600
})`
      }
    ]
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: Book,
    content: [
      {
        title: 'Micro-Kernel Architecture',
        description: 'AuthKeeper uses a micro-kernel plugin architecture where the core kernel provides minimal functionality and plugins extend it with specific features.'
      },
      {
        title: 'Plugin System',
        description: 'Core plugins include token-store, token-decoder, refresh-engine, fetch-interceptor, and storage-memory.'
      }
    ]
  }
]

export function Docs() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Book className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground">Everything you need to know about AuthKeeper</p>
        </div>

        {sections.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.id} id={section.id}>
              <div className="flex items-center gap-3 mb-6">
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold">{section.title}</h2>
              </div>
              <div className="space-y-6">
                {section.content.map((item, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        {item.title}
                      </CardTitle>
                      {item.description && <CardDescription className="text-base">{item.description}</CardDescription>}
                    </CardHeader>
                    {item.code && (
                      <CardContent>
                        <pre className="text-sm overflow-x-auto">
                          <code className="font-mono">{item.code}</code>
                        </pre>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
