# AuthKeeper - Zero-Dependency Token & Auth Management Toolkit

## Package Identity

- **NPM Package**: `@oxog/authkeeper`
- **GitHub Repository**: `https://github.com/ersinkoc/authkeeper`
- **Documentation Site**: `https://authkeeper.oxog.dev`
- **License**: MIT
- **Author**: Ersin KOÇ
- **Created**: 2025-12-28

**NO social media, Discord, email, or external links.**

## Package Description

Zero-dependency token & auth management toolkit with micro-kernel plugin architecture.

AuthKeeper is a comprehensive authentication management library that handles JWT tokens, refresh token rotation, OAuth2/PKCE flows, API keys, and session-based auth. Built on a micro-kernel architecture with a powerful plugin system, it provides auto-refresh, multi-tab sync, secure storage options, fetch/axios interceptors, and 401 retry mechanisms. Framework-agnostic core with dedicated adapters for React, Vue, and Svelte—all without any runtime dependencies.

---

## NON-NEGOTIABLE RULES

These rules are ABSOLUTE and must be followed without exception:

### 1. ZERO DEPENDENCIES
```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```
Implement EVERYTHING from scratch. No runtime dependencies allowed.

### 2. 100% TEST COVERAGE & 100% SUCCESS RATE
- Every line of code must be tested
- Every branch must be tested
- All tests must pass (100% success rate)
- Use Vitest for testing
- Coverage report must show 100%

### 3. DEVELOPMENT WORKFLOW
Create these documents FIRST, before any code:
1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions
3. **TASKS.md** - Ordered task list with dependencies

Only after these documents are complete, implement the code following TASKS.md sequentially.

### 4. TYPESCRIPT STRICT MODE
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### 5. NO EXTERNAL LINKS
- ❌ No social media (Twitter, LinkedIn, etc.)
- ❌ No Discord/Slack links
- ❌ No email addresses
- ❌ No donation/sponsor links
- ✅ Only GitHub repo and documentation site allowed

---

## ARCHITECTURE: MICRO-KERNEL + PLUGIN SYSTEM

### Kernel Responsibilities

```typescript
interface Kernel {
  // Token management
  setTokens(tokens: TokenSet): void
  getAccessToken(): string | null
  getRefreshToken(): string | null
  clearTokens(): void
  
  // Auth state
  isAuthenticated(): boolean
  isExpired(): boolean
  getExpiresAt(): Date | null
  getTimeUntilExpiry(): number | null
  
  // Token decoding
  decode<T = TokenPayload>(): T | null
  getClaim<K extends keyof TokenPayload>(key: K): TokenPayload[K] | undefined
  getClaims<K extends keyof TokenPayload>(keys: K[]): Pick<TokenPayload, K>
  
  // Refresh
  refresh(): Promise<TokenSet>
  scheduleRefresh(): void
  cancelScheduledRefresh(): void
  
  // Logout
  logout(options?: LogoutOptions): void
  
  // Interceptors
  createFetch(options?: FetchOptions): AuthFetch
  wrapFetch(fetch: typeof globalThis.fetch): void
  
  // Plugin management
  register(plugin: Plugin): void
  unregister(pluginName: string): void
  getPlugin<P extends Plugin>(name: string): P | undefined
  listPlugins(): PluginInfo[]
  
  // Event system
  emit(event: AuthEvent): void
  on<E extends EventType>(eventType: E, handler: EventHandler<E>): Unsubscribe
  off<E extends EventType>(eventType: E, handler: EventHandler<E>): void
  
  // Lifecycle
  init(): Promise<void>
  destroy(): void
  
  // Configuration
  configure(options: Partial<KernelOptions>): void
  getOptions(): KernelOptions
}

interface KernelOptions {
  storage: StorageType | StorageAdapter
  refreshToken: RefreshTokenFn
  autoRefresh?: boolean              // Default: true
  refreshThreshold?: number          // Seconds before expiry (default: 60)
  syncTabs?: boolean                 // Default: true
  onError?: (error: AuthError) => void
  plugins?: Plugin[]
}

type StorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'cookie'

type RefreshTokenFn = (refreshToken: string) => Promise<TokenSet>

interface TokenSet {
  accessToken: string
  refreshToken?: string
  expiresIn?: number                 // Seconds
  expiresAt?: number                 // Unix timestamp
  tokenType?: string                 // Default: 'Bearer'
}
```

### Token Types

```typescript
interface TokenPayload {
  // Standard JWT claims
  sub?: string                       // Subject (user ID)
  iss?: string                       // Issuer
  aud?: string | string[]            // Audience
  exp?: number                       // Expiration time
  nbf?: number                       // Not before
  iat?: number                       // Issued at
  jti?: string                       // JWT ID
  
  // Common custom claims
  email?: string
  name?: string
  roles?: string[]
  permissions?: string[]
  scope?: string
  
  // Allow any additional claims
  [key: string]: unknown
}

interface TokenInfo {
  raw: string
  payload: TokenPayload
  header: TokenHeader
  expiresAt: Date | null
  isExpired: boolean
  expiresIn: number | null           // Milliseconds
}

interface TokenHeader {
  alg: string
  typ?: string
  kid?: string
}
```

### Plugin Interface

```typescript
interface Plugin {
  // Identity
  name: string
  version: string
  type: 'core' | 'optional'
  
  // Lifecycle
  install(kernel: Kernel): void | Promise<void>
  uninstall(): void | Promise<void>
  
  // Hooks (all optional)
  hooks?: {
    beforeSetTokens?: (tokens: TokenSet) => TokenSet | false
    afterSetTokens?: (tokens: TokenSet) => void
    beforeRefresh?: () => boolean
    afterRefresh?: (tokens: TokenSet) => void
    beforeLogout?: () => boolean
    afterLogout?: () => void
    onExpired?: () => void
    onError?: (error: AuthError) => void
    beforeRequest?: (request: Request) => Request
    afterResponse?: (response: Response) => Response
  }
  
  // Plugin can expose its own API
  api?: Record<string, unknown>
}

interface PluginInfo {
  name: string
  version: string
  type: 'core' | 'optional'
  enabled: boolean
}
```

### Event Types

```typescript
type EventType =
  | 'login'
  | 'logout'
  | 'refresh'
  | 'expired'
  | 'error'
  | 'storage-change'
  | 'tab-sync'

interface LoginEvent {
  type: 'login'
  tokens: TokenSet
  timestamp: number
}

interface LogoutEvent {
  type: 'logout'
  reason: 'manual' | 'expired' | 'error' | 'tab-sync'
  timestamp: number
}

interface RefreshEvent {
  type: 'refresh'
  tokens: TokenSet
  previousExpiresAt: Date | null
  newExpiresAt: Date | null
  timestamp: number
}

interface ExpiredEvent {
  type: 'expired'
  expiredAt: Date
  timestamp: number
}

interface ErrorEvent {
  type: 'error'
  error: AuthError
  context: 'refresh' | 'storage' | 'decode' | 'network'
  timestamp: number
}

interface StorageChangeEvent {
  type: 'storage-change'
  key: string
  oldValue: string | null
  newValue: string | null
  timestamp: number
}

interface TabSyncEvent {
  type: 'tab-sync'
  action: 'login' | 'logout' | 'refresh'
  sourceTabId: string
  timestamp: number
}

type AuthEvent =
  | LoginEvent
  | LogoutEvent
  | RefreshEvent
  | ExpiredEvent
  | ErrorEvent
  | StorageChangeEvent
  | TabSyncEvent

type EventHandler<E extends EventType> = (event: Extract<AuthEvent, { type: E }>) => void
type Unsubscribe = () => void
```

### Error Types

```typescript
class AuthError extends Error {
  code: AuthErrorCode
  context?: Record<string, unknown>
  cause?: Error
  
  constructor(code: AuthErrorCode, message: string, options?: AuthErrorOptions)
}

type AuthErrorCode =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_DECODE_FAILED'
  | 'REFRESH_FAILED'
  | 'REFRESH_TOKEN_MISSING'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'OAUTH_ERROR'
  | 'PKCE_ERROR'
  | 'CALLBACK_ERROR'
  | 'CONFIG_ERROR'

interface AuthErrorOptions {
  context?: Record<string, unknown>
  cause?: Error
}
```

---

## CORE PLUGINS (5 Total - Always Loaded)

### 1. token-store

Core token state management.

```typescript
interface TokenStoreAPI {
  // CRUD
  set(tokens: TokenSet): void
  get(): StoredTokens | null
  clear(): void
  
  // Access
  getAccessToken(): string | null
  getRefreshToken(): string | null
  getTokenType(): string
  
  // Expiry
  getExpiresAt(): Date | null
  getExpiresIn(): number | null      // Milliseconds
  isExpired(): boolean
  
  // Metadata
  getSetAt(): Date | null
  getRefreshCount(): number
}

interface StoredTokens {
  accessToken: string
  refreshToken: string | null
  tokenType: string
  expiresAt: number | null           // Unix timestamp
  setAt: number                      // Unix timestamp
  refreshCount: number
}

interface TokenStoreOptions {
  validateOnSet?: boolean            // Validate token format
  onSet?: (tokens: StoredTokens) => void
  onClear?: () => void
}
```

### 2. token-decoder

JWT decoding without validation (client-side).

```typescript
interface TokenDecoderAPI {
  decode<T = TokenPayload>(token?: string): T | null
  getHeader(token?: string): TokenHeader | null
  getClaim<K extends keyof TokenPayload>(key: K, token?: string): TokenPayload[K] | undefined
  getClaims<K extends keyof TokenPayload>(keys: K[], token?: string): Pick<TokenPayload, K>
  getExpiry(token?: string): Date | null
  isExpired(token?: string): boolean
  getTokenInfo(token?: string): TokenInfo | null
}

// Base64URL decode implementation (no atob dependency)
function base64UrlDecode(str: string): string {
  // Implement from scratch
}

function decodeJwt<T>(token: string): { header: TokenHeader; payload: T } {
  // Implement from scratch
}
```

**Implementation Notes:**
- Decode only, no signature validation (server's job)
- Handle malformed tokens gracefully
- Support both standard and custom claims
- Base64URL decode from scratch

### 3. refresh-engine

Automatic token refresh with queue management.

```typescript
interface RefreshEngineAPI {
  refresh(): Promise<TokenSet>
  scheduleRefresh(): void
  cancelScheduledRefresh(): void
  isRefreshing(): boolean
  getNextRefreshAt(): Date | null
  setRefreshFn(fn: RefreshTokenFn): void
}

interface RefreshEngineOptions {
  refreshFn: RefreshTokenFn
  threshold: number                  // Seconds before expiry (default: 60)
  maxRetries: number                 // Default: 3
  retryDelay: number                 // Default: 1000ms
  onRefreshStart?: () => void
  onRefreshSuccess?: (tokens: TokenSet) => void
  onRefreshError?: (error: Error) => void
}
```

**Implementation Notes:**
- Queue concurrent refresh requests (only one executes)
- Schedule refresh before token expires
- Retry with exponential backoff
- Cancel scheduled refresh on logout
- Handle refresh token rotation

**Refresh Queue Flow:**
```
Request 1 ──┐
Request 2 ──┼──> [Refresh Queue] ──> Single API Call ──> All Requests Get New Token
Request 3 ──┘
```

### 4. storage-memory

Secure in-memory storage (XSS resistant).

```typescript
interface StorageAdapter {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  clear(): void
}

class MemoryStorage implements StorageAdapter {
  private store: Map<string, string>
  
  // Implements StorageAdapter
  // Data only persists in current tab/session
  // Cleared on page refresh (most secure)
}

interface MemoryStorageOptions {
  prefix?: string                    // Key prefix
}
```

**Security Notes:**
- Tokens never touch localStorage/cookies
- Not accessible via XSS
- Lost on page refresh (trade-off)
- Recommended for high-security apps

### 5. fetch-interceptor

Fetch wrapper with auth header injection and 401 retry.

```typescript
interface FetchInterceptorAPI {
  createFetch(options?: FetchInterceptorOptions): AuthFetch
  wrapFetch(fetch: typeof globalThis.fetch): void
  unwrapFetch(): void
}

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface FetchInterceptorOptions {
  headerName?: string                // Default: 'Authorization'
  headerPrefix?: string              // Default: 'Bearer '
  includeUrls?: (string | RegExp)[]  // Only add header to these URLs
  excludeUrls?: (string | RegExp)[]  // Don't add header to these URLs
  onUnauthorized?: (response: Response) => void
  retry401?: boolean                 // Default: true
  maxRetries?: number                // Default: 1
}
```

**401 Retry Flow:**
```
Request ──> 401 Response ──> Refresh Token ──> Retry Request ──> Success/Fail
```

**Implementation Notes:**
- Clone request before retry
- Don't retry if refresh fails
- Handle refresh-during-request race condition
- Support both fetch overwrite and wrapper

---

## OPTIONAL PLUGINS (9 Total)

### 6. storage-local

localStorage adapter with optional encryption.

```typescript
import { storageLocal } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  storage: storageLocal({
    key: 'auth',
    encrypt: false,
  }),
})

interface LocalStorageOptions {
  key?: string                       // Default: 'authkeeper'
  encrypt?: boolean                  // Default: false
  encryptionKey?: string             // Required if encrypt: true
}
```

### 7. storage-session

sessionStorage adapter.

```typescript
import { storageSession } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  storage: storageSession({ key: 'auth' }),
})

interface SessionStorageOptions {
  key?: string                       // Default: 'authkeeper'
}
```

### 8. storage-cookie

Secure cookie storage with options.

```typescript
import { storageCookie } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  storage: storageCookie({
    name: 'auth',
    secure: true,
    sameSite: 'strict',
    httpOnly: false,                 // Can't be true for JS access
    maxAge: 86400 * 7,               // 7 days
  }),
})

interface CookieStorageOptions {
  name?: string                      // Default: 'authkeeper'
  path?: string                      // Default: '/'
  domain?: string
  secure?: boolean                   // Default: true in production
  sameSite?: 'strict' | 'lax' | 'none'  // Default: 'strict'
  maxAge?: number                    // Seconds
}
```

### 9. multi-tab-sync

Cross-tab synchronization using BroadcastChannel.

```typescript
import { multiTabSync } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  plugins: [multiTabSync({
    channelName: 'authkeeper',
    syncLogin: true,
    syncLogout: true,
    syncRefresh: true,
  })],
})

interface MultiTabSyncOptions {
  channelName?: string               // Default: 'authkeeper-sync'
  syncLogin?: boolean                // Default: true
  syncLogout?: boolean               // Default: true
  syncRefresh?: boolean              // Default: true
  onSync?: (event: TabSyncEvent) => void
}

interface MultiTabSyncAPI {
  broadcast(action: SyncAction): void
  getTabId(): string
  getActiveTabs(): number
}

type SyncAction = 
  | { type: 'login'; tokens: TokenSet }
  | { type: 'logout' }
  | { type: 'refresh'; tokens: TokenSet }
```

**Implementation Notes:**
- Uses BroadcastChannel API
- Fallback to localStorage events for older browsers
- Unique tab ID generation
- Debounce rapid sync events

### 10. oauth2

OAuth2 and OIDC support with PKCE.

```typescript
import { oauth2 } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  plugins: [oauth2({
    clientId: 'my-app',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    redirectUri: 'https://myapp.com/callback',
    scope: 'openid profile email',
    pkce: true,
    responseType: 'code',
  })],
})

// Start login flow
auth.loginWithRedirect()

// Or popup
const tokens = await auth.loginWithPopup()

// Handle callback (call on redirect URI page)
await auth.handleCallback()

// Get user info (if OIDC)
const user = await auth.getUserInfo()

interface OAuth2Options {
  clientId: string
  clientSecret?: string              // Only for confidential clients
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl?: string               // For OIDC
  redirectUri: string
  scope?: string
  responseType?: 'code' | 'token'    // Default: 'code'
  pkce?: boolean                     // Default: true
  codeChallengeMethod?: 'S256' | 'plain'  // Default: 'S256'
  state?: boolean                    // Default: true
  nonce?: boolean                    // Default: true for OIDC
  extraParams?: Record<string, string>
}

interface OAuth2API {
  loginWithRedirect(options?: LoginOptions): void
  loginWithPopup(options?: LoginOptions): Promise<TokenSet>
  handleCallback(): Promise<TokenSet>
  getUserInfo(): Promise<UserInfo>
  getAuthorizationUrl(options?: AuthUrlOptions): string
  exchangeCode(code: string, codeVerifier?: string): Promise<TokenSet>
}

interface LoginOptions {
  scope?: string
  state?: string
  prompt?: 'none' | 'login' | 'consent' | 'select_account'
  loginHint?: string
  extraParams?: Record<string, string>
}
```

**PKCE Implementation:**
```typescript
// Generate code verifier (43-128 chars)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

// Generate code challenge (S256)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}
```

### 11. api-key

Static API key authentication.

```typescript
import { apiKey } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  plugins: [apiKey({
    key: 'my-api-key',
    headerName: 'X-API-Key',
  })],
})

interface ApiKeyOptions {
  key: string | (() => string)       // Static or dynamic
  headerName?: string                // Default: 'X-API-Key'
  queryParam?: string                // Use query param instead of header
}

interface ApiKeyAPI {
  setKey(key: string): void
  getKey(): string
  rotateKey(newKey: string): void
}
```

### 12. session-auth

Cookie/session-based authentication.

```typescript
import { sessionAuth } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  plugins: [sessionAuth({
    loginUrl: '/api/auth/login',
    logoutUrl: '/api/auth/logout',
    sessionUrl: '/api/auth/session',
    credentials: 'include',
  })],
})

interface SessionAuthOptions {
  loginUrl: string
  logoutUrl: string
  sessionUrl: string                 // Check session validity
  credentials?: RequestCredentials   // Default: 'include'
  csrfHeader?: string                // CSRF token header
  csrfCookie?: string                // CSRF cookie name
}

interface SessionAuthAPI {
  login(credentials: Record<string, unknown>): Promise<SessionInfo>
  logout(): Promise<void>
  checkSession(): Promise<SessionInfo | null>
  refreshSession(): Promise<SessionInfo>
}

interface SessionInfo {
  user: Record<string, unknown>
  expiresAt: Date | null
  csrfToken?: string
}
```

### 13. axios-interceptor

Axios integration.

```typescript
import { axiosInterceptor } from '@oxog/authkeeper/plugins'
import axios from 'axios'

const auth = createAuthKeeper({
  plugins: [axiosInterceptor()],
})

// Apply to axios instance
auth.applyAxiosInterceptor(axios)

// Or specific instance
const api = axios.create({ baseURL: '/api' })
auth.applyAxiosInterceptor(api)

interface AxiosInterceptorOptions {
  headerName?: string                // Default: 'Authorization'
  headerPrefix?: string              // Default: 'Bearer '
  includeUrls?: (string | RegExp)[]
  excludeUrls?: (string | RegExp)[]
  retry401?: boolean                 // Default: true
}

interface AxiosInterceptorAPI {
  applyAxiosInterceptor(instance: AxiosInstance): void
  removeAxiosInterceptor(instance: AxiosInstance): void
}
```

### 14. auth-ui

Visual debugging panel.

```typescript
import { authUI, AuthPanel } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  plugins: [authUI({
    position: 'bottom-right',
    shortcut: 'ctrl+shift+a',
    theme: 'dark',
  })],
})

// Or React component
<AuthPanel />

interface AuthUIOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  shortcut: string
  draggable: boolean
  resizable: boolean
  theme: 'dark' | 'light' | 'auto'
  showTokenPreview: boolean          // Show partial token
  showClaims: boolean                // Show decoded claims
}

interface AuthUIAPI {
  open(): void
  close(): void
  toggle(): void
  isOpen(): boolean
}
```

**Panel Layout:**
```
┌─ AuthKeeper ────────────────────── [_] [□] [×]
├─────────────────────────────────────────────────
│  Status: 🟢 Authenticated
├─────────────────────────────────────────────────
│  User Info
│  ┌──────────────────────────────────────────┐
│  │ Sub:    user-123                         │
│  │ Email:  john@example.com                 │
│  │ Roles:  admin, user                      │
│  └──────────────────────────────────────────┘
├─────────────────────────────────────────────────
│  Token Info
│  ┌──────────────────────────────────────────┐
│  │ Access Token:  eyJhbGc...xyz  [📋 Copy]  │
│  │ Expires At:    2025-12-28 14:30:00       │
│  │ Expires In:    ⏱️ 45:32 remaining        │
│  │ Auto Refresh:  ✅ Enabled @ 44:32        │
│  │ Refresh Count: 3                         │
│  └──────────────────────────────────────────┘
├─────────────────────────────────────────────────
│  Storage: memory │ Tabs: 2 synced
├─────────────────────────────────────────────────
│  [🔄 Refresh Now] [🚪 Logout] [📋 Copy Token]
└─────────────────────────────────────────────────
```

---

## FRAMEWORK ADAPTERS

### 15. React Adapter (`@oxog/authkeeper/react`)

```tsx
import {
  AuthProvider,
  useAuth,
  useToken,
  useUser,
  useAuthStatus,
  RequireAuth,
  AuthGuard,
} from '@oxog/authkeeper/react'

// Provider
function App() {
  return (
    <AuthProvider
      config={{
        storage: 'memory',
        refreshToken: async (token) => {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: token }),
          })
          return res.json()
        },
        autoRefresh: true,
        refreshThreshold: 60,
        syncTabs: true,
      }}
      plugins={[oauth2({ ... }), multiTabSync()]}
      onError={(error) => console.error(error)}
    >
      <MyApp />
    </AuthProvider>
  )
}

// Main auth hook
function LoginButton() {
  const {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refresh,
    error,
  } = useAuth()

  if (isLoading) return <Spinner />
  
  if (!isAuthenticated) {
    return <button onClick={() => login()}>Login</button>
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

// Token hook (for API calls)
function ApiComponent() {
  const {
    accessToken,
    authFetch,
    isExpired,
    expiresIn,
  } = useToken()

  const fetchData = async () => {
    const res = await authFetch('/api/data')
    return res.json()
  }

  return (
    <div>
      {isExpired && <span>Session expired</span>}
      {expiresIn && <span>Expires in {Math.floor(expiresIn / 1000)}s</span>}
    </div>
  )
}

// User hook (decoded claims)
function UserProfile() {
  const { user, claims, getClaim } = useUser()

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Roles: {getClaim('roles')?.join(', ')}</p>
    </div>
  )
}

// Auth status hook
function StatusBar() {
  const {
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    storageType,
    tabCount,
  } = useAuthStatus()

  return (
    <div>
      {isRefreshing && <span>Refreshing...</span>}
      {error && <span className="error">{error.message}</span>}
    </div>
  )
}

// Protected route wrapper
function ProtectedPage() {
  return (
    <RequireAuth
      fallback={<LoginPage />}
      loadingFallback={<Spinner />}
    >
      <ProtectedContent />
    </RequireAuth>
  )
}

// Role-based protection
function AdminPage() {
  return (
    <RequireAuth
      roles={['admin']}
      permissions={['write:users']}
      fallback={<AccessDenied />}
    >
      <AdminPanel />
    </RequireAuth>
  )
}

// HOC alternative
const ProtectedComponent = withAuth(MyComponent, {
  roles: ['user'],
  fallback: <LoginPage />,
})

// Types
interface AuthProviderProps {
  children: React.ReactNode
  config: AuthKeeperConfig
  plugins?: Plugin[]
  onError?: (error: AuthError) => void
  onLogin?: (tokens: TokenSet) => void
  onLogout?: () => void
}

interface UseAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
  user: TokenPayload | null
  login: (options?: LoginOptions) => Promise<void>
  logout: (options?: LogoutOptions) => void
  refresh: () => Promise<TokenSet>
  error: AuthError | null
}

interface UseTokenReturn {
  accessToken: string | null
  refreshToken: string | null
  authFetch: AuthFetch
  isExpired: boolean
  expiresAt: Date | null
  expiresIn: number | null
}

interface RequireAuthProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  roles?: string[]
  permissions?: string[]
  onUnauthorized?: () => void
}
```

### 16. Vue Adapter (`@oxog/authkeeper/vue`)

```typescript
import {
  createAuthKeeper,
  useAuth,
  useToken,
  useUser,
  provideAuth,
  injectAuth,
} from '@oxog/authkeeper/vue'

// Plugin installation
const app = createApp(App)
app.use(createAuthKeeper({
  storage: 'memory',
  refreshToken: async (token) => { ... },
  autoRefresh: true,
}))

// Composition API
const {
  isAuthenticated,    // Ref<boolean>
  isLoading,          // Ref<boolean>
  user,               // Ref<TokenPayload | null>
  login,
  logout,
  refresh,
  error,              // Ref<AuthError | null>
} = useAuth()

const {
  accessToken,        // Ref<string | null>
  authFetch,
  isExpired,          // Ref<boolean>
  expiresIn,          // Ref<number | null>
} = useToken()

const {
  user,               // Ref<TokenPayload | null>
  claims,             // Ref<Record<string, unknown>>
  getClaim,
} = useUser()

// Template
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="!isAuthenticated">
    <button @click="login">Login</button>
  </div>
  <div v-else>
    <p>Welcome, {{ user?.email }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>

// Route guard
const router = createRouter({ ... })

router.beforeEach((to, from, next) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else {
    next()
  }
})
```

### 17. Svelte Adapter (`@oxog/authkeeper/svelte`)

```typescript
import {
  createAuthStore,
  authStore,
  tokenStore,
  userStore,
} from '@oxog/authkeeper/svelte'

// Initialize
createAuthStore({
  storage: 'memory',
  refreshToken: async (token) => { ... },
  autoRefresh: true,
})

// Svelte component
<script>
  import { authStore, tokenStore, userStore } from '@oxog/authkeeper/svelte'
</script>

{#if $authStore.isLoading}
  <Spinner />
{:else if !$authStore.isAuthenticated}
  <button on:click={() => $authStore.login()}>Login</button>
{:else}
  <p>Welcome, {$userStore.email}</p>
  <p>Expires in: {Math.floor($tokenStore.expiresIn / 1000)}s</p>
  <button on:click={() => $authStore.logout()}>Logout</button>
{/if}

// Store types
interface AuthStore extends Readable<AuthStoreValue> {
  login: (options?: LoginOptions) => Promise<void>
  logout: (options?: LogoutOptions) => void
  refresh: () => Promise<TokenSet>
}

interface AuthStoreValue {
  isAuthenticated: boolean
  isLoading: boolean
  isRefreshing: boolean
  error: AuthError | null
}

interface TokenStore extends Readable<TokenStoreValue> {
  authFetch: AuthFetch
}

interface TokenStoreValue {
  accessToken: string | null
  refreshToken: string | null
  isExpired: boolean
  expiresAt: Date | null
  expiresIn: number | null
}

interface UserStore extends Readable<TokenPayload | null> {
  getClaim: <K extends keyof TokenPayload>(key: K) => TokenPayload[K] | undefined
}
```

---

## PUBLIC API (Vanilla JS)

```typescript
// Main exports
import {
  // Factory
  createAuthKeeper,
  
  // Types
  type AuthKeeper,
  type TokenSet,
  type TokenPayload,
  type TokenInfo,
  type AuthError,
  type AuthErrorCode,
  type Plugin,
  type StorageAdapter,
} from '@oxog/authkeeper'

// Create instance
const auth = createAuthKeeper({
  storage: 'memory',
  refreshToken: async (refreshToken) => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    
    if (!response.ok) {
      throw new Error('Refresh failed')
    }
    
    return response.json()
  },
  autoRefresh: true,
  refreshThreshold: 60,
  syncTabs: true,
  onError: (error) => console.error('Auth error:', error),
})

// Initialize (loads from storage)
await auth.init()

// Set tokens (after login)
auth.setTokens({
  accessToken: 'eyJhbGciOiJIUzI1NiIs...',
  refreshToken: 'dGhpcyBpcyBhIHJlZnJlc2g...',
  expiresIn: 3600,
})

// Check auth state
auth.isAuthenticated()           // boolean
auth.isExpired()                 // boolean
auth.getAccessToken()            // string | null
auth.getRefreshToken()           // string | null
auth.getExpiresAt()              // Date | null
auth.getTimeUntilExpiry()        // number (ms) | null

// Decode token
auth.decode()                    // TokenPayload | null
auth.getClaim('email')           // string | undefined
auth.getClaims(['sub', 'roles']) // { sub, roles }

// Manual refresh
await auth.refresh()

// Logout
auth.logout()
auth.logout({ allTabs: true })

// Events
auth.on('login', (event) => console.log('Logged in:', event.tokens))
auth.on('logout', (event) => console.log('Logged out:', event.reason))
auth.on('refresh', (event) => console.log('Refreshed:', event.tokens))
auth.on('expired', (event) => console.log('Expired at:', event.expiredAt))
auth.on('error', (event) => console.error('Error:', event.error))

// Fetch interceptor
const authFetch = auth.createFetch({
  includeUrls: ['/api/'],
  excludeUrls: ['/api/public/'],
  retry401: true,
})

const response = await authFetch('/api/protected')

// Cleanup
auth.destroy()
```

---

## TYPE DEFINITIONS

```typescript
// Core types
export interface AuthKeeper {
  // ... Kernel interface methods
}

export interface TokenSet {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  expiresAt?: number
  tokenType?: string
}

export interface TokenPayload {
  sub?: string
  iss?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  email?: string
  name?: string
  roles?: string[]
  permissions?: string[]
  scope?: string
  [key: string]: unknown
}

export interface TokenInfo {
  raw: string
  payload: TokenPayload
  header: TokenHeader
  expiresAt: Date | null
  isExpired: boolean
  expiresIn: number | null
}

export interface TokenHeader {
  alg: string
  typ?: string
  kid?: string
}

// Error types
export class AuthError extends Error {
  code: AuthErrorCode
  context?: Record<string, unknown>
  cause?: Error
}

export type AuthErrorCode = /* as defined above */

// Event types
export type EventType = /* as defined above */
export type AuthEvent = /* as defined above */
export type EventHandler<E extends EventType> = /* as defined above */
export type Unsubscribe = () => void

// Plugin types
export interface Plugin { /* as defined above */ }
export interface StorageAdapter { /* as defined above */ }

// Config types
export interface AuthKeeperConfig {
  storage: StorageType | StorageAdapter
  refreshToken: RefreshTokenFn
  autoRefresh?: boolean
  refreshThreshold?: number
  syncTabs?: boolean
  onError?: (error: AuthError) => void
  plugins?: Plugin[]
}

export type StorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'cookie'
export type RefreshTokenFn = (refreshToken: string) => Promise<TokenSet>
export type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

// Logout options
export interface LogoutOptions {
  allTabs?: boolean
  redirect?: string
}

// Login options (OAuth2)
export interface LoginOptions {
  scope?: string
  state?: string
  prompt?: 'none' | 'login' | 'consent' | 'select_account'
  loginHint?: string
  extraParams?: Record<string, string>
}
```

---

## TECHNICAL REQUIREMENTS

- **Runtime**: Browser (primary), Node.js (limited)
- **Module Format**: ESM + CJS (dual package)
- **Node.js Version**: >= 18 (for build/test)
- **TypeScript Version**: >= 5.0, strict mode
- **Full Generic Support**: All types properly generic

### Browser APIs Used

- `crypto.getRandomValues` - PKCE code verifier
- `crypto.subtle` - SHA-256 for code challenge
- `BroadcastChannel` - Multi-tab sync
- `localStorage` / `sessionStorage` - Optional storage
- `document.cookie` - Cookie storage
- `fetch` - HTTP requests
- `URL` / `URLSearchParams` - OAuth2 flows
- `atob` / `btoa` - Base64 (with fallback)

### Package Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./plugins": {
      "import": "./dist/plugins/index.js",
      "require": "./dist/plugins/index.cjs"
    },
    "./react": {
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    },
    "./vue": {
      "import": "./dist/vue/index.js",
      "require": "./dist/vue/index.cjs"
    },
    "./svelte": {
      "import": "./dist/svelte/index.js",
      "require": "./dist/svelte/index.cjs"
    }
  }
}
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "react": ">=17.0.0",
    "vue": ">=3.0.0",
    "svelte": ">=3.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "vue": { "optional": true },
    "svelte": { "optional": true }
  }
}
```

---

## PROJECT STRUCTURE

```
authkeeper/
├── src/
│   ├── index.ts                    # Main entry, exports
│   ├── types.ts                    # All type definitions
│   │
│   ├── kernel/                     # Micro-kernel core
│   │   ├── index.ts
│   │   ├── kernel.ts               # Kernel implementation
│   │   ├── event-bus.ts            # Event system
│   │   └── plugin-registry.ts      # Plugin management
│   │
│   ├── plugins/                    # All plugins
│   │   ├── index.ts                # Optional plugins export
│   │   ├── core/                   # Core plugins (bundled)
│   │   │   ├── index.ts
│   │   │   ├── token-store.ts
│   │   │   ├── token-decoder.ts
│   │   │   ├── refresh-engine.ts
│   │   │   ├── storage-memory.ts
│   │   │   └── fetch-interceptor.ts
│   │   │
│   │   └── optional/               # Optional plugins
│   │       ├── index.ts
│   │       ├── storage-local.ts
│   │       ├── storage-session.ts
│   │       ├── storage-cookie.ts
│   │       ├── multi-tab-sync.ts
│   │       ├── oauth2/
│   │       │   ├── index.ts
│   │       │   ├── oauth2.ts
│   │       │   ├── pkce.ts
│   │       │   ├── state.ts
│   │       │   └── popup.ts
│   │       ├── api-key.ts
│   │       ├── session-auth.ts
│   │       ├── axios-interceptor.ts
│   │       └── auth-ui/
│   │           ├── index.ts
│   │           ├── panel.tsx
│   │           ├── components/
│   │           │   ├── user-info.tsx
│   │           │   ├── token-info.tsx
│   │           │   ├── status-bar.tsx
│   │           │   └── controls.tsx
│   │           ├── styles/
│   │           │   └── panel.css
│   │           └── utils/
│   │               ├── shadow-dom.ts
│   │               ├── draggable.ts
│   │               └── resizable.ts
│   │
│   ├── adapters/                   # Framework adapters
│   │   ├── react/
│   │   │   ├── index.ts
│   │   │   ├── provider.tsx
│   │   │   ├── context.ts
│   │   │   ├── use-auth.ts
│   │   │   ├── use-token.ts
│   │   │   ├── use-user.ts
│   │   │   ├── use-auth-status.ts
│   │   │   ├── require-auth.tsx
│   │   │   └── with-auth.tsx
│   │   │
│   │   ├── vue/
│   │   │   ├── index.ts
│   │   │   ├── plugin.ts
│   │   │   ├── use-auth.ts
│   │   │   ├── use-token.ts
│   │   │   ├── use-user.ts
│   │   │   └── provide-inject.ts
│   │   │
│   │   └── svelte/
│   │       ├── index.ts
│   │       ├── auth-store.ts
│   │       ├── token-store.ts
│   │       └── user-store.ts
│   │
│   └── utils/                      # Internal utilities
│       ├── index.ts
│       ├── base64.ts               # Base64/Base64URL encode/decode
│       ├── jwt.ts                  # JWT decode (no validation)
│       ├── time.ts                 # Time/expiry utilities
│       ├── storage.ts              # Storage helpers
│       ├── crypto.ts               # PKCE crypto helpers
│       ├── url.ts                  # URL/query string helpers
│       └── cookie.ts               # Cookie utilities
│
├── tests/
│   ├── unit/
│   │   ├── kernel/
│   │   ├── plugins/
│   │   │   ├── core/
│   │   │   └── optional/
│   │   ├── adapters/
│   │   │   ├── react/
│   │   │   ├── vue/
│   │   │   └── svelte/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth-flow.test.ts
│   │   ├── refresh-flow.test.ts
│   │   ├── oauth2-flow.test.ts
│   │   ├── multi-tab.test.ts
│   │   └── storage.test.ts
│   └── fixtures/
│       ├── mock-server.ts
│       ├── test-tokens.ts
│       └── test-storage.ts
│
├── examples/
│   ├── vanilla/
│   │   ├── basic/
│   │   ├── oauth2-pkce/
│   │   └── multi-tab/
│   ├── react/
│   │   ├── basic/
│   │   ├── protected-routes/
│   │   └── oauth2/
│   ├── vue/
│   │   ├── basic/
│   │   └── oauth2/
│   └── svelte/
│       ├── basic/
│       └── oauth2/
│
├── website/                        # React + Vite documentation site
│   └── [See WEBSITE section below]
│
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## DOCUMENTATION WEBSITE

Build a modern, responsive documentation site for `https://authkeeper.oxog.dev`

### Technology Stack

| Tech | Version | Purpose |
|------|---------|---------|
| **React** | 18+ | UI framework |
| **Vite** | 5+ | Build tool |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3+ | Styling |
| **shadcn/ui** | Latest | UI components |
| **React Router** | 6+ | Routing |
| **Prism.js** | Latest | Syntax highlighting |
| **Framer Motion** | Latest | Animations |

### GitHub Pages Deployment

```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: cd website && npm ci
        
      - name: Build
        run: cd website && npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/dist
          cname: authkeeper.oxog.dev
```

### Website Structure

```
website/
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   └── robots.txt
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Navigation, theme toggle
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx         # Docs sidebar
│   │   │   ├── MobileNav.tsx       # Mobile navigation
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── home/
│   │   │   ├── Hero.tsx            # Animated hero section
│   │   │   ├── Features.tsx        # Feature cards
│   │   │   ├── CodePreview.tsx     # Interactive code example
│   │   │   ├── Stats.tsx           # Package stats
│   │   │   ├── Frameworks.tsx      # React/Vue/Svelte logos
│   │   │   ├── Testimonials.tsx    # If any
│   │   │   └── CTA.tsx             # Call to action
│   │   │
│   │   ├── docs/
│   │   │   ├── DocPage.tsx         # Documentation page layout
│   │   │   ├── TableOfContents.tsx
│   │   │   ├── CodeBlock.tsx       # Syntax highlighted code
│   │   │   ├── CopyButton.tsx
│   │   │   ├── PackageManagerTabs.tsx  # npm/yarn/pnpm tabs
│   │   │   ├── FrameworkTabs.tsx   # React/Vue/Svelte tabs
│   │   │   ├── ApiTable.tsx        # API reference table
│   │   │   ├── TypeDef.tsx         # TypeScript type display
│   │   │   └── Callout.tsx         # Info/warning/tip boxes
│   │   │
│   │   ├── examples/
│   │   │   ├── ExampleCard.tsx
│   │   │   ├── ExampleViewer.tsx
│   │   │   └── LiveEditor.tsx      # If playground
│   │   │
│   │   └── shared/
│   │       ├── Logo.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── SearchDialog.tsx    # Cmd+K search
│   │       ├── GitHubLink.tsx
│   │       └── ScrollToTop.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── docs/
│   │   │   ├── GettingStarted.tsx
│   │   │   ├── Installation.tsx
│   │   │   ├── QuickStart.tsx
│   │   │   ├── concepts/
│   │   │   │   ├── TokenManagement.tsx
│   │   │   │   ├── AutoRefresh.tsx
│   │   │   │   ├── Storage.tsx
│   │   │   │   ├── MultiTab.tsx
│   │   │   │   └── Security.tsx
│   │   │   ├── api/
│   │   │   │   ├── AuthKeeper.tsx
│   │   │   │   ├── TokenSet.tsx
│   │   │   │   ├── Events.tsx
│   │   │   │   └── Errors.tsx
│   │   │   ├── plugins/
│   │   │   │   ├── CorePlugins.tsx
│   │   │   │   ├── OAuth2.tsx
│   │   │   │   ├── ApiKey.tsx
│   │   │   │   ├── Storage.tsx
│   │   │   │   └── CustomPlugins.tsx
│   │   │   ├── frameworks/
│   │   │   │   ├── React.tsx
│   │   │   │   ├── Vue.tsx
│   │   │   │   └── Svelte.tsx
│   │   │   └── guides/
│   │   │       ├── OAuth2PKCE.tsx
│   │   │       ├── ProtectedRoutes.tsx
│   │   │       ├── RefreshTokens.tsx
│   │   │       └── Testing.tsx
│   │   ├── Examples.tsx
│   │   ├── Playground.tsx
│   │   └── NotFound.tsx
│   │
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useSearch.ts
│   │   └── useScrollSpy.ts
│   │
│   ├── lib/
│   │   ├── utils.ts                # shadcn/ui utils
│   │   ├── constants.ts
│   │   └── docs-config.ts          # Sidebar navigation config
│   │
│   └── styles/
│       └── globals.css
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── components.json                  # shadcn/ui config
```

### Design System

```css
/* Color Palette - Dark Theme Default */
:root {
  --background: #09090b;            /* zinc-950 */
  --foreground: #fafafa;            /* zinc-50 */
  
  --card: #18181b;                  /* zinc-900 */
  --card-foreground: #fafafa;
  
  --primary: #22c55e;               /* green-500 - Auth/Security theme */
  --primary-foreground: #052e16;
  
  --secondary: #27272a;             /* zinc-800 */
  --secondary-foreground: #fafafa;
  
  --muted: #27272a;
  --muted-foreground: #a1a1aa;      /* zinc-400 */
  
  --accent: #22c55e;
  --accent-foreground: #052e16;
  
  --destructive: #ef4444;           /* red-500 */
  --border: #27272a;
  --ring: #22c55e;
}

/* Light Theme */
.light {
  --background: #ffffff;
  --foreground: #09090b;
  --card: #f4f4f5;
  --primary: #16a34a;               /* green-600 */
  /* ... */
}

/* Accent Colors */
--auth-green: #22c55e;              /* Authenticated */
--auth-red: #ef4444;                /* Error/Logout */
--auth-yellow: #eab308;             /* Warning/Expiring */
--auth-blue: #3b82f6;               /* Info/Refreshing */
```

### Hero Section (Super Şov)

```tsx
// src/components/home/Hero.tsx
import { motion } from 'framer-motion'
import { Shield, Key, RefreshCw, Lock } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10" />
      
      {/* Floating icons animation */}
      <motion.div className="absolute inset-0 pointer-events-none">
        {/* Animated shield, key, lock icons floating */}
      </motion.div>
      
      {/* Main content */}
      <div className="container relative z-10 text-center">
        {/* Animated logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <Shield className="w-24 h-24 mx-auto text-green-500" />
        </motion.div>
        
        {/* Title with typing effect */}
        <motion.h1 
          className="text-6xl md:text-8xl font-bold mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Auth<span className="text-green-500">Keeper</span>
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p className="text-xl md:text-2xl text-muted-foreground mt-4 max-w-2xl mx-auto">
          Zero-dependency token & auth management toolkit.
          <br />
          Built for modern web applications.
        </motion.p>
        
        {/* Stats badges */}
        <motion.div className="flex justify-center gap-4 mt-8">
          <Badge>Zero Dependencies</Badge>
          <Badge>100% TypeScript</Badge>
          <Badge>Tree Shakeable</Badge>
        </motion.div>
        
        {/* CTA buttons */}
        <motion.div className="flex justify-center gap-4 mt-8">
          <Button size="lg" asChild>
            <Link to="/docs/getting-started">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="https://github.com/ersinkoc/authkeeper">
              <GitHubIcon className="mr-2" /> GitHub
            </a>
          </Button>
        </motion.div>
        
        {/* Install command */}
        <motion.div className="mt-12">
          <CodeBlock language="bash" className="max-w-md mx-auto">
            npm install @oxog/authkeeper
          </CodeBlock>
        </motion.div>
        
        {/* Interactive demo preview */}
        <motion.div className="mt-16">
          <InteractiveDemo />
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChevronDown className="w-8 h-8 text-muted-foreground" />
      </motion.div>
    </section>
  )
}
```

### Required Pages

1. **Home** (`/`)
   - Hero with animations
   - Features grid
   - Code preview
   - Framework support
   - Quick install

2. **Getting Started** (`/docs/getting-started`)
   - Installation
   - Quick start
   - Basic example

3. **Concepts** (`/docs/concepts/*`)
   - Token Management
   - Auto Refresh
   - Storage Options
   - Multi-tab Sync
   - Security Best Practices

4. **API Reference** (`/docs/api/*`)
   - AuthKeeper
   - TokenSet
   - Events
   - Errors
   - Full type definitions

5. **Plugins** (`/docs/plugins/*`)
   - Core Plugins
   - OAuth2/PKCE
   - API Key
   - Storage Adapters
   - Custom Plugins

6. **Frameworks** (`/docs/frameworks/*`)
   - React Integration
   - Vue Integration
   - Svelte Integration

7. **Guides** (`/docs/guides/*`)
   - OAuth2 with PKCE
   - Protected Routes
   - Refresh Token Rotation
   - Testing

8. **Examples** (`/examples`)
   - Basic Auth
   - OAuth2 Flow
   - Protected Routes
   - Multi-tab Sync

9. **Playground** (`/playground`)
   - Interactive token decoder
   - Auth flow simulator
   - Live code editor

### Responsive Design

```tsx
// Mobile-first approach
<nav className="
  fixed top-0 w-full z-50
  backdrop-blur-lg bg-background/80 border-b
">
  {/* Desktop nav */}
  <div className="hidden md:flex items-center gap-6">
    <NavigationMenu />
  </div>
  
  {/* Mobile nav */}
  <div className="md:hidden">
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <MobileNav />
      </SheetContent>
    </Sheet>
  </div>
</nav>

// Docs layout
<div className="container flex gap-8">
  {/* Sidebar - hidden on mobile */}
  <aside className="hidden lg:block w-64 shrink-0">
    <Sidebar />
  </aside>
  
  {/* Main content */}
  <main className="flex-1 min-w-0">
    <DocContent />
  </main>
  
  {/* TOC - hidden on mobile/tablet */}
  <aside className="hidden xl:block w-48 shrink-0">
    <TableOfContents />
  </aside>
</div>
```

### Website package.json

```json
{
  "name": "authkeeper-website",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.294.0",
    "prismjs": "^1.29.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-slot": "^1.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/prismjs": "^1.26.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### Vite Config

```typescript
// website/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',  // For custom domain
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
```

---

## README.md TEMPLATE

````markdown
# AuthKeeper

<div align="center">
  <img src="website/public/logo.svg" alt="AuthKeeper" width="120" />
  <h3>Zero-dependency token & auth management toolkit</h3>
  <p>
    <a href="https://authkeeper.oxog.dev">Documentation</a> •
    <a href="https://authkeeper.oxog.dev/docs/getting-started">Getting Started</a> •
    <a href="https://authkeeper.oxog.dev/examples">Examples</a>
  </p>
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/@oxog/authkeeper.svg)](https://www.npmjs.com/package/@oxog/authkeeper)
[![npm downloads](https://img.shields.io/npm/dm/@oxog/authkeeper.svg)](https://www.npmjs.com/package/@oxog/authkeeper)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@oxog/authkeeper)](https://bundlephobia.com/package/@oxog/authkeeper)
[![license](https://img.shields.io/npm/l/@oxog/authkeeper.svg)](LICENSE)

</div>

---

## Features

- 🔐 **Token Management** - JWT, refresh tokens, expiry tracking
- 🔄 **Auto Refresh** - Automatic token refresh before expiry
- 🔒 **Secure Storage** - Memory, localStorage, sessionStorage, cookies
- 📡 **Multi-tab Sync** - Sync auth state across browser tabs
- 🌐 **OAuth2/PKCE** - Full OAuth2 flow with PKCE support
- 🔑 **API Key Auth** - Simple API key authentication
- 🍪 **Session Auth** - Cookie-based session support
- ⚛️ **React/Vue/Svelte** - First-class framework adapters
- 🪶 **Zero Dependencies** - No runtime dependencies
- 📦 **Tree Shakeable** - Import only what you need
- 💪 **TypeScript** - Full type safety

## Installation

```bash
npm install @oxog/authkeeper
```

## Quick Start

```typescript
import { createAuthKeeper } from '@oxog/authkeeper'

const auth = createAuthKeeper({
  storage: 'memory',
  refreshToken: async (token) => {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
    })
    return res.json()
  },
})

// Set tokens after login
auth.setTokens({
  accessToken: 'eyJhbGc...',
  refreshToken: 'refresh...',
  expiresIn: 3600,
})

// Check auth state
auth.isAuthenticated() // true
auth.decode() // { sub: 'user-123', email: 'user@example.com', ... }

// Use with fetch
const authFetch = auth.createFetch()
const data = await authFetch('/api/protected')
```

## React

```tsx
import { AuthProvider, useAuth, RequireAuth } from '@oxog/authkeeper/react'

function App() {
  return (
    <AuthProvider config={authConfig}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <RequireAuth fallback={<LoginPage />}>
            <Dashboard />
          </RequireAuth>
        } />
      </Routes>
    </AuthProvider>
  )
}

function Dashboard() {
  const { user, logout } = useAuth()
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## OAuth2 with PKCE

```typescript
import { createAuthKeeper } from '@oxog/authkeeper'
import { oauth2 } from '@oxog/authkeeper/plugins'

const auth = createAuthKeeper({
  plugins: [oauth2({
    clientId: 'my-app',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    redirectUri: 'https://myapp.com/callback',
    scope: 'openid profile email',
    pkce: true,
  })],
})

// Start login
auth.loginWithRedirect()

// Handle callback (on redirect URI page)
await auth.handleCallback()
```

## Documentation

Visit [authkeeper.oxog.dev](https://authkeeper.oxog.dev) for full documentation.

## License

MIT © [Ersin KOÇ](https://github.com/ersinkoc)
````

---

## CHANGELOG.md TEMPLATE

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-12-28

### Added
- Initial release
- Core token management (set, get, clear, decode)
- Auto-refresh with configurable threshold
- Refresh queue to prevent race conditions
- Storage adapters (memory, localStorage, sessionStorage, cookie)
- Multi-tab synchronization via BroadcastChannel
- Fetch interceptor with 401 retry
- OAuth2/OIDC support with PKCE
- API key authentication plugin
- Session-based authentication plugin
- Axios interceptor plugin
- React adapter (AuthProvider, useAuth, RequireAuth, etc.)
- Vue adapter (useAuth, useToken, useUser)
- Svelte adapter (authStore, tokenStore, userStore)
- Auth UI debug panel
- Full TypeScript support
- 100% test coverage
- Documentation website

### Security
- Secure in-memory storage by default (XSS resistant)
- PKCE for OAuth2 public clients
- Token expiry validation
- Automatic logout on token expiration
```

---

## IMPLEMENTATION CHECKLIST

Before starting implementation:
- [ ] Create SPECIFICATION.md with complete package spec
- [ ] Create IMPLEMENTATION.md with architecture design
- [ ] Create TASKS.md with ordered task list

During implementation:
- [ ] Implement kernel first (foundation)
- [ ] Implement core plugins (5)
- [ ] Implement optional plugins (9)
- [ ] Implement framework adapters (React, Vue, Svelte)
- [ ] Build Auth UI panel
- [ ] Maintain 100% test coverage throughout
- [ ] Write JSDoc for all public APIs
- [ ] Build documentation website

Before completion:
- [ ] All tests passing (100% success rate)
- [ ] Coverage report shows 100%
- [ ] README.md complete
- [ ] CHANGELOG.md initialized
- [ ] Website fully functional
- [ ] Website deploys to GitHub Pages
- [ ] Package builds without errors
- [ ] Tree-shaking works correctly
- [ ] All framework adapters tested
- [ ] OAuth2/PKCE flow tested
- [ ] Multi-tab sync tested

---

## CRITICAL IMPLEMENTATION NOTES

### Security First
- Default to in-memory storage (most secure)
- Never log tokens
- Clear tokens on logout completely
- Validate token format before storing
- Handle token theft scenarios

### JWT Handling
- Decode only, never validate (server's job)
- Handle malformed tokens gracefully
- Parse expiry from `exp` claim
- Support custom claims

### Refresh Token Logic
- Queue concurrent refresh requests
- Only one refresh at a time
- Cancel scheduled refresh on logout
- Handle refresh token rotation
- Retry with backoff on failure

### Multi-tab Sync
- Use BroadcastChannel (modern browsers)
- Fallback to storage events (older browsers)
- Debounce rapid sync events
- Generate unique tab IDs
- Handle tab close gracefully

### OAuth2/PKCE
- Generate cryptographically secure code verifier
- Use SHA-256 for code challenge
- Store state in sessionStorage
- Validate state on callback
- Handle popup blocked scenario

### Framework Adapters
- React: Use useSyncExternalStore for concurrent mode
- Vue: Use ref() and computed() properly
- Svelte: Implement Writable store contract
- All: Proper cleanup on unmount

### Testing
- Mock crypto APIs
- Mock BroadcastChannel
- Mock storage APIs
- Test token expiry scenarios
- Test refresh flow
- Test multi-tab scenarios
- Test OAuth2 flow
- 100% coverage required

---

## BEGIN IMPLEMENTATION

Start by creating SPECIFICATION.md with the complete package specification. Then proceed with IMPLEMENTATION.md and TASKS.md before writing any actual code.

Remember: This package will be published to NPM. It must be production-ready, zero-dependency, fully tested, and professionally documented.

Security is the key differentiator - tokens must be handled securely by default. The website must be modern, responsive, and showcase the library effectively.

**Date: 2025-12-28**
**Author: Ersin KOÇ**
**Repository: github.com/ersinkoc/authkeeper**
**Website: authkeeper.oxog.dev**