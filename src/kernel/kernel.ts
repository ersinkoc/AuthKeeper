/**
 * AuthKeeper Kernel
 *
 * The micro-kernel that orchestrates plugins and manages auth state.
 * Most functionality is delegated to core plugins.
 */

import { EventBus } from './event-bus'
import { PluginRegistry } from './plugin-registry'
import {
  AuthError,
  type AuthKeeper,
  type KernelOptions,
  type Plugin,
  type PluginInfo,
  type TokenSet,
  type TokenPayload,
  type LogoutOptions,
  type AuthFetch,
  type FetchInterceptorOptions,
  type EventType,
  type EventHandler,
  type Unsubscribe,
  type AuthEvent,
} from '../types'

/**
 * AuthKeeperKernel - Main kernel implementation
 */
export class AuthKeeperKernel implements AuthKeeper {
  private pluginRegistry: PluginRegistry
  private eventBus: EventBus
  private options: KernelOptions
  private initialized: boolean = false

  constructor(options: KernelOptions) {
    this.options = {
      autoRefresh: true,
      refreshThreshold: 60,
      syncTabs: true,
      ...options,
    }

    this.pluginRegistry = new PluginRegistry()
    this.eventBus = new EventBus()
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Initialize the kernel
   *
   * 1. Install core plugins
   * 2. Install user-provided plugins
   * 3. Load tokens from storage
   * 4. Schedule refresh if authenticated
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    // Core plugins will be installed in Phase 4
    // For now, we just mark as initialized

    // Install user-provided plugins
    if (this.options.plugins) {
      for (const plugin of this.options.plugins) {
        await this.register(plugin)
      }
    }

    this.initialized = true
  }

  /**
   * Destroy the kernel and cleanup
   */
  destroy(): void {
    // Cancel any scheduled refreshes
    this.cancelScheduledRefresh()

    // Clear event handlers
    this.eventBus.clear()

    // Uninstall all plugins
    const pluginNames = this.pluginRegistry.getNames()
    for (const name of pluginNames) {
      this.pluginRegistry.uninstall(name)
    }

    this.pluginRegistry.clear()
    this.initialized = false
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Set authentication tokens
   *
   * Delegates to token-store plugin.
   */
  setTokens(tokens: TokenSet): void {
    const tokenStore = this.pluginRegistry.getApi<any>('token-store')
    if (!tokenStore) {
      throw new AuthError('CONFIG_ERROR', 'token-store plugin not installed')
    }

    tokenStore.set(tokens)

    // Emit login event
    this.emit({
      type: 'login',
      tokens,
      timestamp: Date.now(),
    })

    // Schedule auto-refresh if enabled
    if (this.options.autoRefresh && !this.isExpired()) {
      this.scheduleRefresh()
    }
  }

  /**
   * Get access token
   *
   * Delegates to token-store plugin.
   */
  getAccessToken(): string | null {
    const tokenStore = this.pluginRegistry.getApi<any>('token-store')
    if (!tokenStore) {
      return null
    }

    return tokenStore.getAccessToken()
  }

  /**
   * Get refresh token
   *
   * Delegates to token-store plugin.
   */
  getRefreshToken(): string | null {
    const tokenStore = this.pluginRegistry.getApi<any>('token-store')
    if (!tokenStore) {
      return null
    }

    return tokenStore.getRefreshToken()
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    const tokenStore = this.pluginRegistry.getApi<any>('token-store')
    if (tokenStore) {
      tokenStore.clear()
    }
  }

  // ============================================================================
  // Auth State
  // ============================================================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken()
    return accessToken !== null && !this.isExpired()
  }

  /**
   * Check if token is expired
   *
   * Delegates to token-store plugin.
   */
  isExpired(): boolean {
    const tokenStore = this.pluginRegistry.getApi<any>('token-store')
    if (!tokenStore) {
      return true
    }

    return tokenStore.isExpired()
  }

  /**
   * Get token expiration date
   *
   * Delegates to token-store plugin.
   */
  getExpiresAt(): Date | null {
    const tokenStore = this.pluginRegistry.getApi<any>('token-store')
    if (!tokenStore) {
      return null
    }

    return tokenStore.getExpiresAt()
  }

  /**
   * Get time until expiry in milliseconds
   *
   * Delegates to token-store plugin.
   */
  getTimeUntilExpiry(): number | null {
    const tokenStore = this.pluginRegistry.getApi<any>('token-store')
    if (!tokenStore) {
      return null
    }

    return tokenStore.getExpiresIn()
  }

  // ============================================================================
  // Token Decoding
  // ============================================================================

  /**
   * Decode token payload
   *
   * Delegates to token-decoder plugin.
   */
  decode<T = TokenPayload>(): T | null {
    const tokenDecoder = this.pluginRegistry.getApi<any>('token-decoder')
    if (!tokenDecoder) {
      return null
    }

    return tokenDecoder.decode() as T | null
  }

  /**
   * Get specific claim from token
   *
   * Delegates to token-decoder plugin.
   */
  getClaim<K extends keyof TokenPayload>(key: K): TokenPayload[K] | undefined {
    const tokenDecoder = this.pluginRegistry.getApi<any>('token-decoder')
    if (!tokenDecoder) {
      return undefined
    }

    return tokenDecoder.getClaim(key)
  }

  /**
   * Get multiple claims from token
   *
   * Delegates to token-decoder plugin.
   */
  getClaims<K extends keyof TokenPayload>(keys: K[]): Pick<TokenPayload, K> {
    const tokenDecoder = this.pluginRegistry.getApi<any>('token-decoder')
    if (!tokenDecoder) {
      return {} as Pick<TokenPayload, K>
    }

    return tokenDecoder.getClaims(keys)
  }

  // ============================================================================
  // Refresh
  // ============================================================================

  /**
   * Manually refresh tokens
   *
   * Delegates to refresh-engine plugin.
   */
  async refresh(): Promise<TokenSet> {
    const refreshEngine = this.pluginRegistry.getApi<any>('refresh-engine')
    if (!refreshEngine) {
      throw new AuthError('CONFIG_ERROR', 'refresh-engine plugin not installed')
    }

    return refreshEngine.refresh()
  }

  /**
   * Schedule automatic refresh
   *
   * Delegates to refresh-engine plugin.
   */
  scheduleRefresh(): void {
    if (!this.options.autoRefresh) {
      return
    }

    const refreshEngine = this.pluginRegistry.getApi<any>('refresh-engine')
    if (refreshEngine) {
      refreshEngine.scheduleRefresh()
    }
  }

  /**
   * Cancel scheduled refresh
   *
   * Delegates to refresh-engine plugin.
   */
  cancelScheduledRefresh(): void {
    const refreshEngine = this.pluginRegistry.getApi<any>('refresh-engine')
    if (refreshEngine) {
      refreshEngine.cancelScheduledRefresh()
    }
  }

  // ============================================================================
  // Logout
  // ============================================================================

  /**
   * Logout user
   *
   * Clears tokens and emits logout event.
   */
  logout(options: LogoutOptions = {}): void {
    // Cancel scheduled refresh
    this.cancelScheduledRefresh()

    // Clear tokens
    this.clearTokens()

    // Emit logout event
    this.emit({
      type: 'logout',
      reason: 'manual',
      timestamp: Date.now(),
    })

    // Handle redirect if specified
    if (options.redirect && typeof window !== 'undefined') {
      window.location.href = options.redirect
    }
  }

  // ============================================================================
  // Interceptors
  // ============================================================================

  /**
   * Create authenticated fetch function
   *
   * Delegates to fetch-interceptor plugin.
   */
  createFetch(options?: FetchInterceptorOptions): AuthFetch {
    const fetchInterceptor = this.pluginRegistry.getApi<any>('fetch-interceptor')
    if (!fetchInterceptor) {
      // Return regular fetch if plugin not installed
      return fetch.bind(globalThis)
    }

    return fetchInterceptor.createFetch(options)
  }

  /**
   * Wrap global fetch with auth
   *
   * Delegates to fetch-interceptor plugin.
   */
  wrapFetch(fetch: typeof globalThis.fetch): void {
    const fetchInterceptor = this.pluginRegistry.getApi<any>('fetch-interceptor')
    if (fetchInterceptor) {
      fetchInterceptor.wrapFetch(fetch)
    }
  }

  // ============================================================================
  // Plugin Management
  // ============================================================================

  /**
   * Register and install a plugin
   */
  async register(plugin: Plugin): Promise<void> {
    this.pluginRegistry.register(plugin)
    await this.pluginRegistry.install(plugin.name, this)
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginName: string): Promise<void> {
    await this.pluginRegistry.uninstall(pluginName)
  }

  /**
   * Get plugin by name
   */
  getPlugin<P extends Plugin>(name: string): P | undefined {
    return this.pluginRegistry.get<P>(name)
  }

  /**
   * List all plugins
   */
  listPlugins(): PluginInfo[] {
    return this.pluginRegistry.list()
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Emit an event
   */
  emit(event: AuthEvent): void {
    this.eventBus.emit(event)

    // Call global error handler if it's an error event
    if (event.type === 'error' && this.options.onError) {
      this.options.onError(event.error)
    }
  }

  /**
   * Subscribe to events
   */
  on<E extends EventType>(eventType: E, handler: EventHandler<E>): Unsubscribe {
    return this.eventBus.on(eventType, handler)
  }

  /**
   * Unsubscribe from events
   */
  off<E extends EventType>(eventType: E, handler: EventHandler<E>): void {
    this.eventBus.off(eventType, handler)
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update configuration
   */
  configure(options: Partial<KernelOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    }

    // Update refresh engine threshold if changed
    if (options.refreshThreshold !== undefined) {
      const refreshEngine = this.pluginRegistry.getApi<any>('refresh-engine')
      if (refreshEngine && refreshEngine.setThreshold) {
        refreshEngine.setThreshold(options.refreshThreshold)
      }
    }
  }

  /**
   * Get current configuration
   */
  getOptions(): KernelOptions {
    return { ...this.options }
  }
}
