export const SITE_CONFIG = {
  name: 'AuthKeeper',
  description: 'Zero-dependency token & auth management toolkit with micro-kernel plugin architecture',
  url: 'https://authkeeper.oxog.dev',
  npmPackage: '@oxog/authkeeper',
  repository: 'https://github.com/ersinkoc/authkeeper',
  author: 'Ersin KOÇ',
  license: 'MIT',
} as const

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'API', href: '/docs/api' },
  { label: 'Examples', href: '/examples' },
  { label: 'Playground', href: '/playground' },
] as const

export const SOCIAL_LINKS = {
  github: 'https://github.com/ersinkoc/authkeeper',
  npm: 'https://www.npmjs.com/package/@oxog/authkeeper',
} as const

export const FEATURES = [
  {
    title: 'Plugin-Based Architecture',
    description: 'Extensible micro-kernel design with a clean plugin API',
    icon: 'Puzzle',
  },
  {
    title: 'Automatic Token Refresh',
    description: 'Smart refresh with queuing, retry logic, and threshold control',
    icon: 'RefreshCw',
  },
  {
    title: 'Fetch Interception',
    description: 'Automatic auth header injection and 401 retry with token refresh',
    icon: 'Zap',
  },
  {
    title: 'Flexible Storage',
    description: 'Memory, localStorage, sessionStorage, or custom adapters',
    icon: 'Database',
  },
  {
    title: 'Event System',
    description: 'Subscribe to auth lifecycle events with typed handlers',
    icon: 'Radio',
  },
  {
    title: 'Zero Dependencies',
    description: 'Pure TypeScript implementation with no external dependencies',
    icon: 'Package',
  },
] as const

export const PACKAGE_MANAGERS = [
  { name: 'npm', command: 'npm install @oxog/authkeeper' },
  { name: 'yarn', command: 'yarn add @oxog/authkeeper' },
  { name: 'pnpm', command: 'pnpm add @oxog/authkeeper' },
  { name: 'bun', command: 'bun add @oxog/authkeeper' },
] as const

export const STATS = [
  { label: 'Tests', value: '541 passing', variant: 'success' },
  { label: 'Coverage', value: '99.83%', variant: 'success' },
  { label: 'Dependencies', value: 'Zero', variant: 'info' },
  { label: 'TypeScript', value: '100%', variant: 'info' },
] as const
