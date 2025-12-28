/**
 * AuthKeeper Type Definitions
 *
 * Complete type system for the AuthKeeper library.
 * All interfaces and types are exported for use by consumers.
 */

// ============================================================================
// Token Types
// ============================================================================

/**
 * Token set returned from authentication/refresh operations
 */
export interface TokenSet {
  /** JWT access token */
  accessToken: string
  /** Optional refresh token for obtaining new access tokens */
  refreshToken?: string
  /** Token expiration in seconds from now */
  expiresIn?: number
  /** Token expiration as Unix timestamp (seconds) */
  expiresAt?: number
  /** Token type (default: 'Bearer') */
  tokenType?: string
}

/**
 * Standard JWT payload with common claims
 */
export interface TokenPayload {
  // Standard JWT claims (RFC 7519)
  /** Subject - usually the user ID */
  sub?: string
  /** Issuer - who created the token */
  iss?: string
  /** Audience - who the token is intended for */
  aud?: string | string[]
  /** Expiration time (Unix timestamp in seconds) */
  exp?: number
  /** Not before time (Unix timestamp in seconds) */
  nbf?: number
  /** Issued at time (Unix timestamp in seconds) */
  iat?: number
  /** JWT ID - unique identifier */
  jti?: string

  // Common custom claims
  /** User email address */
  email?: string
  /** User display name */
  name?: string
  /** User roles */
  roles?: string[]
  /** User permissions */
  permissions?: string[]
  /** OAuth2 scope */
  scope?: string

  // Allow any additional custom claims
  [key: string]: unknown
}

/**
 * JWT header information
 */
export interface TokenHeader {
  /** Algorithm used to sign the token */
  alg: string
  /** Token type (usually 'JWT') */
  typ?: string
  /** Key ID used to sign the token */
  kid?: string
  [key: string]: unknown
}

/**
 * Complete token information including decoded parts
 */
export interface TokenInfo {
  /** Raw JWT string */
  raw: string
  /** Decoded payload */
  payload: TokenPayload
  /** Decoded header */
  header: TokenHeader
  /** When the token expires (null if no expiry) */
  expiresAt: Date | null
  /** Whether the token is expired */
  isExpired: boolean
  /** Time until expiry in milliseconds (null if no expiry) */
  expiresIn: number | null
}

/**
 * Stored token data with metadata
 */
export interface StoredTokens {
  /** Access token */
  accessToken: string
  /** Refresh token (null if not available) */
  refreshToken: string | null
  /** Token type (e.g., 'Bearer') */
  tokenType: string
  /** Expiration timestamp in milliseconds (null if no expiry) */
  expiresAt: number | null
  /** When tokens were set (timestamp in milliseconds) */
  setAt: number
  /** Number of times tokens have been refreshed */
  refreshCount: number
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for authentication errors
 */
export type AuthErrorCode =
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

/**
 * Options for creating an AuthError
 */
export interface AuthErrorOptions {
  /** Additional context about the error */
  context?: Record<string, unknown>
  /** Original error that caused this error */
  cause?: Error
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  /** Error code identifying the type of error */
  code: AuthErrorCode
  /** Additional context about the error */
  context?: Record<string, unknown>
  /** Original error that caused this error */
  cause?: Error

  constructor(code: AuthErrorCode, message: string, options?: AuthErrorOptions) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.context = options?.context
    this.cause = options?.cause

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError)
    }
  }
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * All possible event types
 */
export type EventType =
  | 'login'
  | 'logout'
  | 'refresh'
  | 'expired'
  | 'error'
  | 'storage-change'
  | 'tab-sync'

/**
 * Login event - fired when user logs in
 */
export interface LoginEvent {
  type: 'login'
  tokens: TokenSet
  timestamp: number
}

/**
 * Logout event - fired when user logs out
 */
export interface LogoutEvent {
  type: 'logout'
  reason: 'manual' | 'expired' | 'error' | 'tab-sync'
  timestamp: number
}

/**
 * Refresh event - fired when tokens are refreshed
 */
export interface RefreshEvent {
  type: 'refresh'
  tokens: TokenSet
  previousExpiresAt: Date | null
  newExpiresAt: Date | null
  timestamp: number
}

/**
 * Expired event - fired when token expires
 */
export interface ExpiredEvent {
  type: 'expired'
  expiredAt: Date
  timestamp: number
}

/**
 * Error event - fired when an error occurs
 */
export interface ErrorEvent {
  type: 'error'
  error: AuthError
  context: 'refresh' | 'storage' | 'decode' | 'network'
  timestamp: number
}

/**
 * Storage change event - fired when storage changes
 */
export interface StorageChangeEvent {
  type: 'storage-change'
  key: string
  oldValue: string | null
  newValue: string | null
  timestamp: number
}

/**
 * Tab sync event - fired when syncing across tabs
 */
export interface TabSyncEvent {
  type: 'tab-sync'
  action: 'login' | 'logout' | 'refresh'
  sourceTabId: string
  timestamp: number
}

/**
 * Union of all event types
 */
export type AuthEvent =
  | LoginEvent
  | LogoutEvent
  | RefreshEvent
  | ExpiredEvent
  | ErrorEvent
  | StorageChangeEvent
  | TabSyncEvent

/**
 * Event handler function type
 */
export type EventHandler<E extends EventType> = (
  event: Extract<AuthEvent, { type: E }>
) => void

/**
 * Unsubscribe function returned from event handlers
 */
export type Unsubscribe = () => void

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Storage adapter interface for token persistence
 */
export interface StorageAdapter {
  /** Get value by key */
  get(key: string): string | null
  /** Set value by key */
  set(key: string, value: string): void
  /** Remove value by key */
  remove(key: string): void
  /** Clear all values */
  clear(): void
}

/**
 * Built-in storage types
 */
export type StorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'cookie'

// ============================================================================
// Plugin Types
// ============================================================================

/**
 * Plugin interface for extending AuthKeeper
 */
export interface Plugin {
  /** Unique plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin type */
  type: 'core' | 'optional'

  /** Install plugin and return API */
  install(kernel: AuthKeeper): any
  /** Uninstall plugin and cleanup */
  uninstall?(): void | Promise<void>

  /** Optional lifecycle hooks */
  hooks?: {
    /** Called before tokens are set */
    beforeSetTokens?: (tokens: TokenSet) => TokenSet | false
    /** Called after tokens are set */
    afterSetTokens?: (tokens: TokenSet) => void
    /** Called before refresh */
    beforeRefresh?: () => boolean
    /** Called after refresh */
    afterRefresh?: (tokens: TokenSet) => void
    /** Called before logout */
    beforeLogout?: () => boolean
    /** Called after logout */
    afterLogout?: () => void
    /** Called when token expires */
    onExpired?: () => void
    /** Called on error */
    onError?: (error: AuthError) => void
    /** Called before request */
    beforeRequest?: (request: Request) => Request
    /** Called after response */
    afterResponse?: (response: Response) => Response
  }

  /** Plugin API exposed to consumers */
  api?: Record<string, unknown>
}

/**
 * Plugin information
 */
export interface PluginInfo {
  name: string
  version: string
  type: 'core' | 'optional'
  enabled: boolean
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Refresh token function type
 */
export type RefreshTokenFn = (refreshToken: string) => Promise<TokenSet>

/**
 * Kernel configuration options
 */
export interface KernelOptions {
  /** Storage adapter or type */
  storage: StorageType | StorageAdapter
  /** Function to refresh tokens */
  refreshToken: RefreshTokenFn
  /** Enable automatic token refresh (default: true) */
  autoRefresh?: boolean
  /** Seconds before expiry to refresh (default: 60) */
  refreshThreshold?: number
  /** Enable multi-tab sync (default: true) */
  syncTabs?: boolean
  /** Error handler */
  onError?: (error: AuthError) => void
  /** Additional plugins to install */
  plugins?: Plugin[]
}

/**
 * Logout options
 */
export interface LogoutOptions {
  /** Logout from all tabs */
  allTabs?: boolean
  /** Redirect URL after logout */
  redirect?: string
}

// ============================================================================
// Fetch Interceptor Types
// ============================================================================

/**
 * Authenticated fetch function
 */
export type AuthFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

/**
 * Fetch interceptor options
 */
export interface FetchInterceptorOptions {
  /** Header name for auth token (default: 'Authorization') */
  headerName?: string
  /** Header prefix (default: 'Bearer ') */
  headerPrefix?: string
  /** Only include auth header for these URLs */
  includeUrls?: (string | RegExp)[]
  /** Exclude auth header for these URLs */
  excludeUrls?: (string | RegExp)[]
  /** Callback on 401 response */
  onUnauthorized?: (response: Response) => void
  /** Retry on 401 after refresh (default: true) */
  retry401?: boolean
  /** Max retries (default: 1) */
  maxRetries?: number
}

// ============================================================================
// OAuth2 Types
// ============================================================================

/**
 * OAuth2 login options
 */
export interface LoginOptions {
  /** OAuth2 scope */
  scope?: string
  /** OAuth2 state parameter */
  state?: string
  /** OAuth2 prompt parameter */
  prompt?: 'none' | 'login' | 'consent' | 'select_account'
  /** Login hint (email, etc.) */
  loginHint?: string
  /** Additional OAuth2 parameters */
  extraParams?: Record<string, string>
}

/**
 * User info from OIDC userinfo endpoint
 */
export interface UserInfo {
  sub: string
  email?: string
  name?: string
  picture?: string
  [key: string]: unknown
}

// ============================================================================
// Main AuthKeeper Interface
// ============================================================================

/**
 * Main AuthKeeper interface - the kernel
 */
export interface AuthKeeper {
  // Token Management
  /** Set authentication tokens */
  setTokens(tokens: TokenSet): void
  /** Get access token */
  getAccessToken(): string | null
  /** Get refresh token */
  getRefreshToken(): string | null
  /** Clear all tokens */
  clearTokens(): void

  // Auth State
  /** Check if user is authenticated */
  isAuthenticated(): boolean
  /** Check if token is expired */
  isExpired(): boolean
  /** Get token expiration date */
  getExpiresAt(): Date | null
  /** Get time until expiry in milliseconds */
  getTimeUntilExpiry(): number | null

  // Token Decoding
  /** Decode token payload */
  decode<T = TokenPayload>(): T | null
  /** Get specific claim from token */
  getClaim<K extends keyof TokenPayload>(key: K): TokenPayload[K] | undefined
  /** Get multiple claims from token */
  getClaims<K extends keyof TokenPayload>(keys: K[]): Pick<TokenPayload, K>

  // Refresh
  /** Manually refresh tokens */
  refresh(): Promise<TokenSet>
  /** Schedule automatic refresh */
  scheduleRefresh(): void
  /** Cancel scheduled refresh */
  cancelScheduledRefresh(): void

  // Logout
  /** Logout user */
  logout(options?: LogoutOptions): void

  // Interceptors
  /** Create authenticated fetch function */
  createFetch(options?: FetchInterceptorOptions): AuthFetch
  /** Wrap global fetch with auth */
  wrapFetch(fetch: typeof globalThis.fetch): void

  // Plugin Management
  /** Register a plugin */
  register(plugin: Plugin): void
  /** Unregister a plugin */
  unregister(pluginName: string): void
  /** Get plugin by name */
  getPlugin<P extends Plugin>(name: string): P | undefined
  /** List all plugins */
  listPlugins(): PluginInfo[]

  // Event System
  /** Emit an event */
  emit(event: AuthEvent): void
  /** Subscribe to events */
  on<E extends EventType>(eventType: E, handler: EventHandler<E>): Unsubscribe
  /** Unsubscribe from events */
  off<E extends EventType>(eventType: E, handler: EventHandler<E>): void

  // Lifecycle
  /** Initialize kernel */
  init(): Promise<void>
  /** Destroy kernel and cleanup */
  destroy(): void

  // Configuration
  /** Update configuration */
  configure(options: Partial<KernelOptions>): void
  /** Get current configuration */
  getOptions(): KernelOptions
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export for convenience
  AuthKeeper as default,
}
