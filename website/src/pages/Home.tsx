import { Hero } from '@/components/home/Hero'
import { Features } from '@/components/home/Features'
import { InstallCommand } from '@/components/home/InstallCommand'
import { CodePreview } from '@/components/home/CodePreview'
import { Stats } from '@/components/home/Stats'

export function Home() {
  return (
    <div>
      <Hero />
      <InstallCommand />
      <Features />
      <CodePreview />
      <Stats />
    </div>
  )
}
