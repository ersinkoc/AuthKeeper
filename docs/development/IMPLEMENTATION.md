# AuthKeeper - Implementation Architecture & Design Decisions

**Version:** 1.0.0
**Date:** 2025-12-28
**Author:** Ersin KOÇ

---

## 1. ARCHITECTURAL OVERVIEW

### 1.1 Micro-Kernel Pattern

AuthKeeper implements a **micro-kernel architecture** where:
- The kernel provides minimal core functionality
- All features are implemented as plugins
- Plugins communicate through hooks and events
- The kernel orchestrates plugin lifecycle and communication

**Why Micro-Kernel?**
- **Modularity:** Features can be added/removed independently
- **Tree-Shaking:** Users only bundle what they use
- **Testability:** Each plugin can be tested in isolation
- **Extensibility:** Custom plugins are first-class citizens

### 1.2 System Layers

```
┌─────────────────────────────────────────────────────────┐
│             Framework Adapters (React/Vue/Svelte)       │
│                    (Optional Layer)                      │
├─────────────────────────────────────────────────────────┤
│                   Optional Plugins                       │
│  storage-local │ oauth2 │ api-key │ multi-tab-sync │... │
├─────────────────────────────────────────────────────────┤
│                    Core Plugins                          │
│  token-store │ token-decoder │ refresh-engine │...      │
├─────────────────────────────────────────────────────────┤
│                    Micro-Kernel                          │
│  plugin-registry │ event-bus │ lifecycle │ state        │
├─────────────────────────────────────────────────────────┤
│                      Utilities                           │
│  base64 │ jwt │ time │ crypto │ storage │ url │ cookie  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. KERNEL ARCHITECTURE

### 2.1 Kernel Components

```typescript
// kernel/kernel.ts
class AuthKeeperKernel implements AuthKeeper {
  private pluginRegistry: PluginRegistry
  private eventBus: EventBus
  private options: KernelOptions
  private initialized: boolean = false

  constructor(options: KernelOptions) {
    this.options = options
    this.pluginRegistry = new PluginRegistry()
    this.eventBus = new EventBus()
  }

  async init(): Promise<void> {
    // 1. Install core plugins (always loaded)
    await this.installCorePlugins()

    // 2. Install user-provided plugins
    if (this.options.plugins) {
      for (const plugin of this.options.plugins) {
        await this.register(plugin)
      }
    }

    // 3. Load tokens from storage
    await this.loadFromStorage()

    // 4. Schedule refresh if authenticated
    if (this.isAuthenticated() && this.options.autoRefresh) {
      this.scheduleRefresh()
    }

    this.initialized = true
  }

  // Delegates to plugins...
}
```

### 2.2 Plugin Registry

**Responsibilities:**
- Store installed plugins by name
- Validate plugin uniqueness
- Provide plugin lookup
- Handle plugin dependencies (future)

```typescript
// kernel/plugin-registry.ts
class PluginRegistry {
  private plugins: Map<string, PluginInstance> = new Map()

  register(plugin: Plugin, kernel: Kernel): void {
    if (this.plugins.has(plugin.name)) {
      throw new AuthError('CONFIG_ERROR', `Plugin ${plugin.name} already registered`)
    }

    const instance: PluginInstance = {
      plugin,
      installed: false,
      api: null,
    }

    this.plugins.set(plugin.name, instance)
  }

  async install(name: string, kernel: Kernel): Promise<void> {
    const instance = this.plugins.get(name)
    if (!instance) throw new AuthError('CONFIG_ERROR', `Plugin ${name} not found`)
    if (instance.installed) return

    // Call plugin's install method
    const api = await instance.plugin.install(kernel)
    instance.api = api || null
    instance.installed = true
  }

  get<P extends Plugin>(name: string): P | undefined {
    return this.plugins.get(name)?.plugin as P | undefined
  }

  list(): PluginInfo[] {
    return Array.from(this.plugins.entries()).map(([name, instance]) => ({
      name,
      version: instance.plugin.version,
      type: instance.plugin.type,
      enabled: instance.installed,
    }))
  }

  async uninstall(name: string): Promise<void> {
    const instance = this.plugins.get(name)
    if (!instance) return

    if (instance.plugin.uninstall) {
      await instance.plugin.uninstall()
    }

    this.plugins.delete(name)
  }
}
```

### 2.3 Event Bus

**Responsibilities:**
- Event subscription management
- Event emission to subscribers
- Type-safe event handling

```typescript
// kernel/event-bus.ts
class EventBus {
  private handlers: Map<EventType, Set<EventHandler<any>>> = new Map()

  on<E extends EventType>(eventType: E, handler: EventHandler<E>): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }

    this.handlers.get(eventType)!.add(handler)

    return () => this.off(eventType, handler)
  }

  off<E extends EventType>(eventType: E, handler: EventHandler<E>): void {
    this.handlers.get(eventType)?.delete(handler)
  }

  emit(event: AuthEvent): void {
    const handlers = this.handlers.get(event.type)
    if (!handlers) return

    // Execute handlers in next tick to prevent blocking
    setTimeout(() => {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
        }
      })
    }, 0)
  }

  clear(): void {
    this.handlers.clear()
  }
}
```

---

## 3. CORE PLUGIN IMPLEMENTATIONS

### 3.1 token-store Implementation

**Design Decisions:**
- Store tokens in a plain object (in-memory by default)
- Track metadata: setAt, refreshCount
- Calculate expiresAt from expiresIn if not provided
- Emit events on state changes

```typescript
// plugins/core/token-store.ts
class TokenStorePlugin implements Plugin {
  name = 'token-store'
  version = '1.0.0'
  type = 'core' as const

  private tokens: StoredTokens | null = null
  private kernel!: Kernel

  install(kernel: Kernel): TokenStoreAPI {
    this.kernel = kernel

    return {
      set: this.set.bind(this),
      get: this.get.bind(this),
      clear: this.clear.bind(this),
      getAccessToken: () => this.tokens?.accessToken || null,
      getRefreshToken: () => this.tokens?.refreshToken || null,
      getTokenType: () => this.tokens?.tokenType || 'Bearer',
      getExpiresAt: () => this.tokens?.expiresAt ? new Date(this.tokens.expiresAt) : null,
      getExpiresIn: () => {
        if (!this.tokens?.expiresAt) return null
        return this.tokens.expiresAt - Date.now()
      },
      isExpired: () => {
        if (!this.tokens?.expiresAt) return false
        return Date.now() >= this.tokens.expiresAt
      },
      getSetAt: () => this.tokens?.setAt ? new Date(this.tokens.setAt) : null,
      getRefreshCount: () => this.tokens?.refreshCount || 0,
    }
  }

  set(tokens: TokenSet): void {
    // Calculate expiresAt
    let expiresAt: number | null = null
    if (tokens.expiresAt) {
      expiresAt = tokens.expiresAt * 1000 // Convert to ms
    } else if (tokens.expiresIn) {
      expiresAt = Date.now() + (tokens.expiresIn * 1000)
    }

    const refreshCount = this.tokens?.refreshCount || 0

    this.tokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || null,
      tokenType: tokens.tokenType || 'Bearer',
      expiresAt,
      setAt: Date.now(),
      refreshCount: refreshCount + 1,
    }
  }

  get(): StoredTokens | null {
    return this.tokens
  }

  clear(): void {
    this.tokens = null
  }

  uninstall(): void {
    this.clear()
  }
}
```

### 3.2 token-decoder Implementation

**Design Decisions:**
- Implement Base64URL decode from scratch
- No signature validation (client-side only)
- Handle malformed tokens gracefully
- Support generic payload types

```typescript
// plugins/core/token-decoder.ts
class TokenDecoderPlugin implements Plugin {
  name = 'token-decoder'
  version = '1.0.0'
  type = 'core' as const

  install(kernel: Kernel): TokenDecoderAPI {
    const tokenStore = kernel.getPlugin<TokenStorePlugin>('token-store')!

    return {
      decode: <T = TokenPayload>(token?: string): T | null => {
        const jwt = token || tokenStore.api.getAccessToken()
        if (!jwt) return null

        try {
          const decoded = decodeJwt<T>(jwt)
          return decoded.payload
        } catch {
          return null
        }
      },

      getHeader: (token?: string): TokenHeader | null => {
        const jwt = token || tokenStore.api.getAccessToken()
        if (!jwt) return null

        try {
          const decoded = decodeJwt(jwt)
          return decoded.header
        } catch {
          return null
        }
      },

      getClaim: <K extends keyof TokenPayload>(key: K, token?: string) => {
        const payload = this.decode(token)
        return payload?.[key]
      },

      // ... other methods
    }
  }
}

// utils/jwt.ts - From scratch implementation
function base64UrlDecode(str: string): string {
  // Replace URL-safe chars
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

  // Add padding
  const pad = str.length % 4
  if (pad === 2) base64 += '=='
  else if (pad === 3) base64 += '='

  // Decode using native atob (or polyfill for Node.js)
  const decoded = typeof window !== 'undefined'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary')

  // Convert to UTF-8
  return decodeURIComponent(
    decoded.split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join('')
  )
}

function decodeJwt<T = TokenPayload>(token: string): { header: TokenHeader; payload: T } {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new AuthError('TOKEN_DECODE_FAILED', 'Invalid JWT format')
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]!)) as TokenHeader
    const payload = JSON.parse(base64UrlDecode(parts[1]!)) as T
    return { header, payload }
  } catch (error) {
    throw new AuthError('TOKEN_DECODE_FAILED', 'Failed to decode JWT', {
      cause: error as Error,
    })
  }
}
```

### 3.3 refresh-engine Implementation

**Design Decisions:**
- Queue concurrent refresh requests
- Only one refresh executes at a time
- Retry with exponential backoff
- Schedule next refresh before expiry

```typescript
// plugins/core/refresh-engine.ts
class RefreshEnginePlugin implements Plugin {
  name = 'refresh-engine'
  version = '1.0.0'
  type = 'core' as const

  private refreshFn!: RefreshTokenFn
  private isRefreshing = false
  private refreshPromise: Promise<TokenSet> | null = null
  private scheduledRefreshTimeout: number | null = null
  private threshold: number = 60 // seconds
  private maxRetries = 3
  private retryDelay = 1000

  install(kernel: Kernel): RefreshEngineAPI {
    this.refreshFn = kernel.getOptions().refreshToken
    this.threshold = kernel.getOptions().refreshThreshold || 60

    return {
      refresh: this.refresh.bind(this),
      scheduleRefresh: this.scheduleRefresh.bind(this),
      cancelScheduledRefresh: this.cancelScheduledRefresh.bind(this),
      isRefreshing: () => this.isRefreshing,
      getNextRefreshAt: () => {
        // Calculate based on token expiry and threshold
        const tokenStore = kernel.getPlugin<TokenStorePlugin>('token-store')!
        const expiresAt = tokenStore.api.getExpiresAt()
        if (!expiresAt) return null
        return new Date(expiresAt.getTime() - this.threshold * 1000)
      },
      setRefreshFn: (fn: RefreshTokenFn) => {
        this.refreshFn = fn
      },
    }
  }

  async refresh(): Promise<TokenSet> {
    // If already refreshing, return the same promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.executeRefresh()

    try {
      const tokens = await this.refreshPromise
      return tokens
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async executeRefresh(retryCount = 0): Promise<TokenSet> {
    const tokenStore = this.kernel.getPlugin<TokenStorePlugin>('token-store')!
    const refreshToken = tokenStore.api.getRefreshToken()

    if (!refreshToken) {
      throw new AuthError('REFRESH_TOKEN_MISSING', 'No refresh token available')
    }

    try {
      // Call user-provided refresh function
      const newTokens = await this.refreshFn(refreshToken)

      // Update tokens in store
      tokenStore.api.set(newTokens)

      // Emit refresh event
      this.kernel.emit({
        type: 'refresh',
        tokens: newTokens,
        previousExpiresAt: null, // TODO: track previous
        newExpiresAt: tokenStore.api.getExpiresAt(),
        timestamp: Date.now(),
      })

      // Schedule next refresh
      this.scheduleRefresh()

      return newTokens
    } catch (error) {
      // Retry with exponential backoff
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.executeRefresh(retryCount + 1)
      }

      // Max retries exceeded
      const authError = new AuthError('REFRESH_FAILED', 'Token refresh failed', {
        cause: error as Error,
        context: { retryCount },
      })

      this.kernel.emit({
        type: 'error',
        error: authError,
        context: 'refresh',
        timestamp: Date.now(),
      })

      throw authError
    }
  }

  scheduleRefresh(): void {
    this.cancelScheduledRefresh()

    const tokenStore = this.kernel.getPlugin<TokenStorePlugin>('token-store')!
    const expiresIn = tokenStore.api.getExpiresIn()

    if (!expiresIn) return

    // Schedule refresh before expiry (threshold seconds before)
    const refreshIn = expiresIn - (this.threshold * 1000)

    if (refreshIn > 0) {
      this.scheduledRefreshTimeout = setTimeout(() => {
        this.refresh()
      }, refreshIn) as unknown as number
    }
  }

  cancelScheduledRefresh(): void {
    if (this.scheduledRefreshTimeout) {
      clearTimeout(this.scheduledRefreshTimeout)
      this.scheduledRefreshTimeout = null
    }
  }

  uninstall(): void {
    this.cancelScheduledRefresh()
  }
}
```

### 3.4 storage-memory Implementation

**Design Decisions:**
- Use Map for storage (not accessible via XSS)
- Data lost on page refresh
- No persistence across tabs
- Most secure option

```typescript
// plugins/core/storage-memory.ts
class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, string> = new Map()
  private prefix: string

  constructor(options: MemoryStorageOptions = {}) {
    this.prefix = options.prefix || 'authkeeper:'
  }

  get(key: string): string | null {
    return this.store.get(this.prefix + key) || null
  }

  set(key: string, value: string): void {
    this.store.set(this.prefix + key, value)
  }

  remove(key: string): void {
    this.store.delete(this.prefix + key)
  }

  clear(): void {
    this.store.clear()
  }
}
```

### 3.5 fetch-interceptor Implementation

**Design Decisions:**
- Return wrapped fetch function
- Clone request before retry
- Handle 401 with token refresh
- Prevent infinite retry loops

```typescript
// plugins/core/fetch-interceptor.ts
class FetchInterceptorPlugin implements Plugin {
  name = 'fetch-interceptor'
  version = '1.0.0'
  type = 'core' as const

  install(kernel: Kernel): FetchInterceptorAPI {
    return {
      createFetch: (options = {}) => this.createFetch(kernel, options),
      wrapFetch: (fetch: typeof globalThis.fetch) => {
        globalThis.fetch = this.createFetch(kernel, {})(fetch)
      },
      unwrapFetch: () => {
        // TODO: Restore original fetch
      },
    }
  }

  private createFetch(kernel: Kernel, options: FetchInterceptorOptions): AuthFetch {
    const {
      headerName = 'Authorization',
      headerPrefix = 'Bearer ',
      includeUrls = [],
      excludeUrls = [],
      retry401 = true,
      maxRetries = 1,
    } = options

    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const tokenStore = kernel.getPlugin<TokenStorePlugin>('token-store')!
      const refreshEngine = kernel.getPlugin<RefreshEnginePlugin>('refresh-engine')!

      // Determine if we should add auth header
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const shouldInclude = includeUrls.length === 0 || includeUrls.some(pattern =>
        typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)
      )
      const shouldExclude = excludeUrls.some(pattern =>
        typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)
      )

      if (!shouldInclude || shouldExclude) {
        return fetch(input, init)
      }

      // Add auth header
      const accessToken = tokenStore.api.getAccessToken()
      const headers = new Headers(init?.headers)

      if (accessToken) {
        headers.set(headerName, headerPrefix + accessToken)
      }

      // Make request
      let response = await fetch(input, { ...init, headers })

      // Handle 401 with retry
      if (response.status === 401 && retry401 && maxRetries > 0) {
        try {
          // Refresh token
          await refreshEngine.api.refresh()

          // Retry request with new token
          const newToken = tokenStore.api.getAccessToken()
          if (newToken) {
            headers.set(headerName, headerPrefix + newToken)
            response = await fetch(input, { ...init, headers })
          }
        } catch {
          // Refresh failed, return original 401
        }
      }

      return response
    }
  }
}
```

---

## 4. OPTIONAL PLUGIN PATTERNS

### 4.1 Storage Plugins Pattern

All storage plugins implement the `StorageAdapter` interface:

```typescript
interface StorageAdapter {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  clear(): void
}
```

**localStorage Implementation:**
```typescript
class LocalStorageAdapter implements StorageAdapter {
  constructor(private options: LocalStorageOptions) {}

  get(key: string): string | null {
    const value = localStorage.getItem(this.getKey(key))
    if (!value) return null

    if (this.options.encrypt) {
      return this.decrypt(value)
    }
    return value
  }

  set(key: string, value: string): void {
    const toStore = this.options.encrypt ? this.encrypt(value) : value
    localStorage.setItem(this.getKey(key), toStore)
  }

  private getKey(key: string): string {
    return `${this.options.key || 'authkeeper'}:${key}`
  }

  private encrypt(value: string): string {
    // Simple XOR encryption (not production-ready, just example)
    // Real implementation would use Web Crypto API
    return value // TODO: Implement encryption
  }

  private decrypt(value: string): string {
    return value // TODO: Implement decryption
  }
}
```

### 4.2 OAuth2 Plugin Pattern

**State Management:**
- Store state/nonce in sessionStorage
- Generate PKCE code verifier and challenge
- Handle redirect and popup flows

```typescript
class OAuth2Plugin implements Plugin {
  name = 'oauth2'
  version = '1.0.0'
  type = 'optional' as const

  private options!: OAuth2Options
  private kernel!: Kernel

  constructor(options: OAuth2Options) {
    this.options = options
  }

  install(kernel: Kernel): OAuth2API {
    this.kernel = kernel

    return {
      loginWithRedirect: this.loginWithRedirect.bind(this),
      loginWithPopup: this.loginWithPopup.bind(this),
      handleCallback: this.handleCallback.bind(this),
      getUserInfo: this.getUserInfo.bind(this),
      getAuthorizationUrl: this.getAuthorizationUrl.bind(this),
      exchangeCode: this.exchangeCode.bind(this),
    }
  }

  async loginWithRedirect(options?: LoginOptions): Promise<void> {
    const url = await this.getAuthorizationUrl(options)
    window.location.href = url
  }

  async loginWithPopup(options?: LoginOptions): Promise<TokenSet> {
    const url = await this.getAuthorizationUrl(options)

    // Open popup
    const popup = window.open(url, 'oauth2-popup', 'width=500,height=600')

    // Wait for popup to close or receive message
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          reject(new AuthError('OAUTH_ERROR', 'Popup closed'))
        }
      }, 500)

      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'oauth2-success') {
          clearInterval(checkClosed)
          popup?.close()
          resolve(event.data.tokens)
        }
      })
    })
  }

  async getAuthorizationUrl(options?: LoginOptions): Promise<string> {
    const params = new URLSearchParams()
    params.set('client_id', this.options.clientId)
    params.set('redirect_uri', this.options.redirectUri)
    params.set('response_type', this.options.responseType || 'code')
    params.set('scope', options?.scope || this.options.scope || '')

    // PKCE
    if (this.options.pkce) {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)

      sessionStorage.setItem('oauth2:code_verifier', verifier)
      params.set('code_challenge', challenge)
      params.set('code_challenge_method', this.options.codeChallengeMethod || 'S256')
    }

    // State
    if (this.options.state !== false) {
      const state = generateRandomString(32)
      sessionStorage.setItem('oauth2:state', state)
      params.set('state', state)
    }

    // Nonce (for OIDC)
    if (this.options.nonce) {
      const nonce = generateRandomString(32)
      sessionStorage.setItem('oauth2:nonce', nonce)
      params.set('nonce', nonce)
    }

    return `${this.options.authorizationUrl}?${params.toString()}`
  }

  async handleCallback(): Promise<TokenSet> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    // Validate state
    const storedState = sessionStorage.getItem('oauth2:state')
    if (storedState && state !== storedState) {
      throw new AuthError('OAUTH_ERROR', 'State mismatch')
    }

    if (!code) {
      const error = params.get('error')
      const errorDescription = params.get('error_description')
      throw new AuthError('OAUTH_ERROR', errorDescription || error || 'No code received')
    }

    // Exchange code for tokens
    const verifier = sessionStorage.getItem('oauth2:code_verifier')
    const tokens = await this.exchangeCode(code, verifier || undefined)

    // Clear session storage
    sessionStorage.removeItem('oauth2:state')
    sessionStorage.removeItem('oauth2:code_verifier')
    sessionStorage.removeItem('oauth2:nonce')

    // Set tokens
    this.kernel.setTokens(tokens)

    return tokens
  }

  async exchangeCode(code: string, codeVerifier?: string): Promise<TokenSet> {
    const body = new URLSearchParams()
    body.set('grant_type', 'authorization_code')
    body.set('code', code)
    body.set('client_id', this.options.clientId)
    body.set('redirect_uri', this.options.redirectUri)

    if (codeVerifier) {
      body.set('code_verifier', codeVerifier)
    }

    if (this.options.clientSecret) {
      body.set('client_secret', this.options.clientSecret)
    }

    const response = await fetch(this.options.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new AuthError('OAUTH_ERROR', 'Token exchange failed')
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  }

  async getUserInfo(): Promise<UserInfo> {
    if (!this.options.userInfoUrl) {
      throw new AuthError('CONFIG_ERROR', 'userInfoUrl not configured')
    }

    const authFetch = this.kernel.createFetch()
    const response = await authFetch(this.options.userInfoUrl)

    if (!response.ok) {
      throw new AuthError('OAUTH_ERROR', 'Failed to fetch user info')
    }

    return response.json()
  }
}
```

---

## 5. FRAMEWORK ADAPTER PATTERNS

### 5.1 React Adapter Architecture

**Key Decisions:**
- Use `useSyncExternalStore` for concurrent mode compatibility
- Context for kernel instance
- Separate hooks for different concerns

```typescript
// adapters/react/context.ts
const AuthContext = createContext<AuthKeeper | null>(null)

// adapters/react/provider.tsx
export function AuthProvider({ config, plugins, children }: AuthProviderProps) {
  const authRef = useRef<AuthKeeper | null>(null)

  if (!authRef.current) {
    authRef.current = createAuthKeeper(config)
  }

  useEffect(() => {
    authRef.current?.init()
    return () => authRef.current?.destroy()
  }, [])

  return (
    <AuthContext.Provider value={authRef.current}>
      {children}
    </AuthContext.Provider>
  )
}

// adapters/react/use-auth.ts
export function useAuth(): UseAuthReturn {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used within AuthProvider')

  // Use useSyncExternalStore for state subscription
  const isAuthenticated = useSyncExternalStore(
    (callback) => auth.on('login', callback) || auth.on('logout', callback),
    () => auth.isAuthenticated()
  )

  const user = useSyncExternalStore(
    (callback) => auth.on('login', callback) || auth.on('logout', callback),
    () => auth.decode()
  )

  return {
    isAuthenticated,
    user,
    login: async (options) => { /* ... */ },
    logout: (options) => auth.logout(options),
    refresh: () => auth.refresh(),
    error: null, // TODO: track errors
  }
}
```

### 5.2 Vue Adapter Architecture

**Key Decisions:**
- Composition API with `ref()` and `computed()`
- Plugin installation for app-wide availability
- Reactive state updates

```typescript
// adapters/vue/plugin.ts
export function createAuthKeeper(config: AuthKeeperConfig) {
  return {
    install(app: App) {
      const auth = createAuthKeeperCore(config)
      app.provide(AUTH_KEY, auth)

      // Initialize on mount
      auth.init()
    }
  }
}

// adapters/vue/use-auth.ts
export function useAuth() {
  const auth = inject(AUTH_KEY)
  if (!auth) throw new Error('AuthKeeper not installed')

  const isAuthenticated = ref(auth.isAuthenticated())
  const user = ref(auth.decode())

  // Subscribe to changes
  onMounted(() => {
    const unsubscribe = [
      auth.on('login', () => {
        isAuthenticated.value = true
        user.value = auth.decode()
      }),
      auth.on('logout', () => {
        isAuthenticated.value = false
        user.value = null
      }),
    ]

    onUnmounted(() => unsubscribe.forEach(fn => fn()))
  })

  return {
    isAuthenticated,
    user,
    login: async (options) => { /* ... */ },
    logout: (options) => auth.logout(options),
    refresh: () => auth.refresh(),
  }
}
```

### 5.3 Svelte Adapter Architecture

**Key Decisions:**
- Writable stores for reactive state
- Singleton pattern for global state
- Direct store subscriptions

```typescript
// adapters/svelte/auth-store.ts
function createAuthStore() {
  const auth = createAuthKeeperCore(config)

  const { subscribe, set, update } = writable({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // Subscribe to auth events
  auth.on('login', () => {
    update(state => ({ ...state, isAuthenticated: true }))
  })

  auth.on('logout', () => {
    update(state => ({ ...state, isAuthenticated: false }))
  })

  // Initialize
  auth.init().then(() => {
    update(state => ({ ...state, isLoading: false }))
  })

  return {
    subscribe,
    login: async (options) => { /* ... */ },
    logout: (options) => auth.logout(options),
    refresh: () => auth.refresh(),
  }
}

export const authStore = createAuthStore()
```

---

## 6. UTILITIES IMPLEMENTATION

### 6.1 Base64 Utilities

```typescript
// utils/base64.ts
export function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = typeof window !== 'undefined'
    ? btoa(String.fromCharCode(...buffer))
    : Buffer.from(buffer).toString('base64')

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = str.length % 4
  if (pad === 2) base64 += '=='
  else if (pad === 3) base64 += '='

  const decoded = typeof window !== 'undefined'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary')

  return decodeURIComponent(
    decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  )
}
```

### 6.2 Crypto Utilities (PKCE)

```typescript
// utils/crypto.ts
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

export function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return base64UrlEncode(array).substring(0, length)
}
```

---

## 7. TESTING STRATEGY

### 7.1 Test Structure

```
tests/
├── unit/
│   ├── kernel/
│   │   ├── kernel.test.ts
│   │   ├── event-bus.test.ts
│   │   └── plugin-registry.test.ts
│   ├── plugins/
│   │   ├── core/
│   │   │   ├── token-store.test.ts
│   │   │   ├── token-decoder.test.ts
│   │   │   ├── refresh-engine.test.ts
│   │   │   ├── storage-memory.test.ts
│   │   │   └── fetch-interceptor.test.ts
│   │   └── optional/
│   │       ├── oauth2.test.ts
│   │       ├── multi-tab-sync.test.ts
│   │       └── ...
│   ├── adapters/
│   │   ├── react.test.tsx
│   │   ├── vue.test.ts
│   │   └── svelte.test.ts
│   └── utils/
│       ├── base64.test.ts
│       ├── jwt.test.ts
│       ├── crypto.test.ts
│       └── ...
├── integration/
│   ├── auth-flow.test.ts
│   ├── refresh-flow.test.ts
│   ├── oauth2-flow.test.ts
│   └── multi-tab.test.ts
└── fixtures/
    ├── test-tokens.ts
    └── mock-server.ts
```

### 7.2 Mock Strategy

```typescript
// tests/fixtures/test-tokens.ts
export const TEST_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.xxx'

export const TEST_EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTAwMDAwMDAwMH0.xxx'

// Mock crypto API
vi.stubGlobal('crypto', {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  },
  subtle: {
    digest: async (algorithm: string, data: ArrayBuffer) => {
      // Mock SHA-256
      return new Uint8Array(32).buffer
    },
  },
})

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(name: string) {
    this.name = name
  }

  postMessage(data: any) {
    // Simulate message to other tabs
  }

  close() {}
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
```

### 7.3 Coverage Requirements

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
})
```

---

## 8. BUILD & DEPLOYMENT

### 8.1 Build Configuration

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'react/index': 'src/adapters/react/index.ts',
    'vue/index': 'src/adapters/vue/index.ts',
    'svelte/index': 'src/adapters/svelte/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // Let users minify
  external: ['react', 'vue', 'svelte'],
})
```

### 8.2 TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Token Storage Security

**Risk Matrix:**
| Storage Type | XSS Risk | CSRF Risk | Persistence | Multi-tab |
|--------------|----------|-----------|-------------|-----------|
| Memory       | None     | N/A       | None        | No        |
| localStorage | High     | N/A       | Forever     | Yes       |
| sessionStorage | High   | N/A       | Session     | No        |
| Cookie       | Low*     | High*     | Configurable | Yes      |

*Depends on httpOnly and sameSite settings

**Default Choice:** Memory storage (most secure, no XSS risk)

### 9.2 Token Validation

- **Client-side:** Decode only, check expiry
- **Server-side:** Full validation (signature, issuer, audience)
- Never validate signatures client-side (no benefit, adds complexity)

### 9.3 PKCE Implementation

- Code verifier: 43-128 characters, cryptographically random
- Code challenge: SHA-256 hash of verifier
- Store verifier in sessionStorage (cleared after exchange)

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Bundle Size

- Tree-shakeable exports
- Core plugins always bundled
- Optional plugins loaded on demand
- Minimal dependencies (zero runtime deps)

**Target Sizes:**
- Core: <5KB gzipped
- With React adapter: <8KB gzipped
- Full bundle: <15KB gzipped

### 10.2 Runtime Performance

- Lazy plugin loading
- Event handlers run in next tick (non-blocking)
- Debounced multi-tab sync
- Request queue for refresh (prevent race conditions)

---

## 11. ERROR HANDLING STRATEGY

### 11.1 Error Hierarchy

```
Error (native)
  └─ AuthError (custom)
      ├─ TokenError (TOKEN_EXPIRED, TOKEN_INVALID, TOKEN_DECODE_FAILED)
      ├─ RefreshError (REFRESH_FAILED, REFRESH_TOKEN_MISSING)
      ├─ StorageError (STORAGE_ERROR)
      ├─ NetworkError (NETWORK_ERROR, UNAUTHORIZED, FORBIDDEN)
      └─ OAuth2Error (OAUTH_ERROR, PKCE_ERROR, CALLBACK_ERROR)
```

### 11.2 Error Recovery

- Refresh failures → Logout user
- Storage errors → Fall back to memory storage
- Network errors → Retry with backoff
- Decode errors → Clear invalid tokens

---

## 12. DOCUMENTATION STRATEGY

### 12.1 Code Documentation

- JSDoc for all public APIs
- TypeScript types as documentation
- Examples in JSDoc comments
- Link to website for detailed docs

### 12.2 Website Documentation

**Structure:**
1. Home → Hero, quick start, features
2. Getting Started → Installation, basic usage
3. Concepts → Deep dives into architecture
4. API Reference → Full API documentation
5. Guides → Step-by-step tutorials
6. Examples → Complete working examples
7. Playground → Interactive demo

---

## 13. VERSIONING & RELEASES

### 13.1 Semantic Versioning

- **MAJOR:** Breaking API changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

### 13.2 Release Checklist

- [ ] All tests pass (100%)
- [ ] Coverage at 100%
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Examples updated
- [ ] Git tag created
- [ ] NPM publish
- [ ] GitHub release

---

**End of Implementation Document**
