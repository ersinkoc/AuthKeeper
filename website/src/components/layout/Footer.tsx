import { Github, Twitter, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="font-mono font-bold">AuthKeeper</h3>
            <p className="text-sm text-muted-foreground">
              Zero-dependency auth management toolkit with micro-kernel architecture
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/docs" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="/api" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="/examples" className="hover:text-foreground transition-colors">Examples</a></li>
              <li><a href="/playground" className="hover:text-foreground transition-colors">Playground</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://github.com/ersinkoc/authkeeper" className="hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="https://github.com/ersinkoc/authkeeper/issues" className="hover:text-foreground transition-colors">Issues</a></li>
              <li><a href="https://github.com/ersinkoc/authkeeper/discussions" className="hover:text-foreground transition-colors">Discussions</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Connect</h4>
            <div className="flex space-x-4">
              <a href="https://github.com/ersinkoc" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/ersinkoc" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by Ersin KOÇ
          </p>
          <p className="mt-4 md:mt-0">
            © 2025 AuthKeeper. MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}
