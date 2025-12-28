# 🔐 AuthKeeper

> A micro-kernel authentication library with plugin-based architecture

[![Tests](https://img.shields.io/badge/tests-541%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-99.83%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

AuthKeeper is a lightweight, plugin-based authentication library that provides JWT token management, automatic refresh, and fetch interception with a clean, modular architecture.

## ✨ Features

- 🔌 **Plugin-Based Architecture** - Extensible micro-kernel design
- 🔄 **Automatic Token Refresh** - Smart refresh with queuing and retry logic
- 🎯 **Fetch Interception** - Automatic auth header injection and 401 retry
- 💾 **Flexible Storage** - Memory, localStorage, sessionStorage, or custom adapters
- 📡 **Event System** - Subscribe to auth lifecycle events
- 🔒 **JWT Support** - Built-in JWT decoding and validation
- 🍪 **Cookie Support** - Parse and manage authentication cookies
- ⚡ **Zero Dependencies** - Pure TypeScript implementation
- 🧪 **100% Tested** - 541 tests with 99.83% coverage
- 📦 **Tree-Shakeable** - Only bundle what you use

## 📦 Installation

```bash
npm install @oxog/authkeeper
# or
yarn add @oxog/authkeeper
# or
pnpm add @oxog/authkeeper
# or
bun add @oxog/authkeeper
```

## 🚀 Quick Start

```typescript
import { createAuthKeeper } from '@oxog/authkeeper'

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
```

## 📚 Core Concepts

### Micro-Kernel Architecture

AuthKeeper uses a plugin-based architecture where most functionality is provided by plugins:

```
┌─────────────────────────────────────┐
│          AuthKeeper Kernel          │
│  (Orchestrates plugins & events)    │
└─────────────────────────────────────┘
           │
           ├──► TokenStore Plugin (State Management)
           ├──► TokenDecoder Plugin (JWT Decoding)
           ├──► RefreshEngine Plugin (Auto-Refresh)
           └──► FetchInterceptor Plugin (HTTP Interception)
```

### Core Plugins

All core plugins are automatically registered when using `createAuthKeeper()`:

- **token-store** - Manages token state and expiration
- **token-decoder** - Decodes and validates JWT tokens
- **refresh-engine** - Handles automatic token refresh with retry logic
- **fetch-interceptor** - Injects auth headers and handles 401 responses

## 🎯 Usage Examples

### Token Management

```typescript
// Set tokens
auth.setTokens({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600, // seconds
})

// Get tokens
const accessToken = auth.getAccessToken()
const refreshToken = auth.getRefreshToken()

// Check authentication
if (auth.isAuthenticated()) {
  console.log('User is authenticated')
}

// Check expiration
if (auth.isExpired()) {
  console.log('Token is expired')
}

// Get expiry info
const expiresAt = auth.getExpiresAt()
const timeUntilExpiry = auth.getTimeUntilExpiry()

// Clear tokens
auth.clearTokens()
```

### Manual Token Refresh

```typescript
// Manually refresh tokens
try {
  const newTokens = await auth.refresh()
  console.log('Tokens refreshed:', newTokens)
} catch (error) {
  console.error('Refresh failed:', error)
}
```

### Automatic Refresh

```typescript
// Auto-refresh is enabled by default
const auth = await createAuthKeeper({
  refreshToken: refreshFn,
  autoRefresh: true, // default
  refreshThreshold: 60, // Refresh 60s before expiry
})

// Tokens will be refreshed automatically when they're about to expire
```

### Fetch Interception

```typescript
// Create authenticated fetch
const authFetch = auth.createFetch({
  baseURL: 'https://api.example.com',
  retry401: true, // Retry with refreshed token on 401
  includeURLs: ['/api/*'], // Only add auth to these URLs
  excludeURLs: ['/api/public/*'], // Except these
})

// Use like normal fetch
const response = await authFetch('/api/users')
const data = await response.json()
```

### Event Handling

```typescript
// Subscribe to events
auth.on('login', (event) => {
  console.log('User logged in:', event.tokens)
})

auth.on('logout', (event) => {
  console.log('User logged out:', event.reason)
})

auth.on('refresh:success', (event) => {
  console.log('Tokens refreshed:', event.tokens)
})

auth.on('refresh:error', (event) => {
  console.error('Refresh failed:', event.error)
})

auth.on('error', (event) => {
  console.error('Auth error:', event.error)
})
```

### JWT Decoding

```typescript
// Decode token payload
const payload = auth.decode()
console.log('User ID:', payload?.sub)

// Get specific claim
const userId = auth.getClaim('sub')
const email = auth.getClaim('email')

// Get multiple claims
const { sub, email, exp } = auth.getClaims(['sub', 'email', 'exp'])
```

### Logout

```typescript
// Simple logout
auth.logout()

// Logout with redirect
auth.logout({ redirect: '/login' })
```

## 🔌 Custom Plugins

Create your own plugins to extend functionality:

```typescript
import type { Plugin, AuthKeeper } from '@oxog/authkeeper'

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  type: 'custom',

  install(kernel: AuthKeeper) {
    // Plugin initialization
    return {
      // Public API
      myMethod() {
        // Your logic
      },
    }
  },

  uninstall() {
    // Cleanup
  },
}

// Register custom plugin
await auth.register(myPlugin)
```

## 🧪 Testing

AuthKeeper has comprehensive test coverage:

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui
```

### Test Coverage

```
Test Files:    16/16 passing
Total Tests:   541/541 passing
Coverage:      99.83%
Functions:     100%
Execution:     ~2.5 seconds
```

See [docs/testing/TESTING.md](docs/testing/TESTING.md) for detailed testing documentation.

## 📖 API Reference

### AuthKeeper Interface

```typescript
interface AuthKeeper {
  // Lifecycle
  init(): Promise<void>
  destroy(): void

  // Token Management
  setTokens(tokens: TokenSet): void
  getAccessToken(): string | null
  getRefreshToken(): string | null
  clearTokens(): void

  // Auth State
  isAuthenticated(): boolean
  isExpired(): boolean
  getExpiresAt(): Date | null
  getTimeUntilExpiry(): number | null

  // Token Decoding
  decode<T = TokenPayload>(): T | null
  getClaim<K extends keyof TokenPayload>(key: K): TokenPayload[K] | undefined
  getClaims<K extends keyof TokenPayload>(keys: K[]): Pick<TokenPayload, K>

  // Refresh
  refresh(): Promise<TokenSet>
  scheduleRefresh(): void
  cancelScheduledRefresh(): void

  // Logout
  logout(options?: LogoutOptions): void

  // Fetch
  createFetch(options?: FetchInterceptorOptions): AuthFetch
  wrapFetch(fetch: typeof globalThis.fetch): void

  // Plugins
  register(plugin: Plugin): Promise<void>
  unregister(pluginName: string): Promise<void>
  getPlugin<P extends Plugin>(name: string): P | undefined
  listPlugins(): PluginInfo[]

  // Events
  emit(event: AuthEvent): void
  on<E extends EventType>(eventType: E, handler: EventHandler<E>): Unsubscribe
  off<E extends EventType>(eventType: E, handler: EventHandler<E>): void

  // Configuration
  configure(options: Partial<KernelOptions>): void
  getOptions(): KernelOptions
}
```

### Configuration Options

```typescript
interface KernelOptions {
  // Required
  refreshToken: RefreshTokenFn

  // Optional
  autoRefresh?: boolean // Default: true
  refreshThreshold?: number // Default: 60 (seconds)
  syncTabs?: boolean // Default: true
  storage?: StorageAdapter
  plugins?: Plugin[]
  onError?: (error: Error) => void
}
```

## 🏗️ Architecture

```
src/
├── factory.ts              # Factory function
├── kernel/
│   ├── kernel.ts          # Main kernel
│   ├── event-bus.ts       # Event system
│   └── plugin-registry.ts # Plugin management
├── plugins/core/
│   ├── token-store.ts     # Token state management
│   ├── token-decoder.ts   # JWT decoding
│   ├── refresh-engine.ts  # Auto-refresh logic
│   ├── fetch-interceptor.ts # HTTP interception
│   └── storage-memory.ts  # In-memory storage
└── utils/
    ├── base64.ts          # Base64URL encoding
    ├── cookie.ts          # Cookie utilities
    ├── crypto.ts          # Crypto utilities
    ├── jwt.ts             # JWT parsing
    ├── storage.ts         # Storage helpers
    └── time.ts            # Time utilities
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

MIT © Ersin KOÇ

## 🔗 Links

- [Documentation](./docs)
- [Testing Guide](./docs/testing/TESTING.md)
- [Test Report](./docs/testing/TEST_REPORT.md)
- [Changelog](./CHANGELOG.md)
- [Issues](https://github.com/ersinkoc/authkeeper/issues)

## 💡 Inspiration

AuthKeeper is inspired by:
- [axios-auth-refresh](https://github.com/Flyrell/axios-auth-refresh) - Token refresh pattern
- [oidc-client-ts](https://github.com/authts/oidc-client-ts) - OAuth/OIDC client architecture
- [Keycloak JS](https://www.keycloak.org/) - Authentication library design

---

**Built with ❤️ using TypeScript and Vitest**
