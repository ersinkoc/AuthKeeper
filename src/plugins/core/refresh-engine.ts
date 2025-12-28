/**
 * Refresh Engine Plugin
 *
 * Core plugin for automatic token refresh with queue management.
 * - Queues concurrent refresh requests
 * - Schedules refresh before expiry
 * - Retries with exponential backoff
 */

import type { Plugin, TokenSet, AuthKeeper, RefreshTokenFn, AuthError } from '../../types'

/**
 * Refresh Engine API
 */
export interface RefreshEngineAPI {
  refresh(): Promise<TokenSet>
  scheduleRefresh(): void
  cancelScheduledRefresh(): void
  isRefreshing(): boolean
  getNextRefreshAt(): Date | null
  setRefreshFn(fn: RefreshTokenFn): void
  setThreshold(seconds: number): void
}

/**
 * Refresh Engine Options
 */
export interface RefreshEngineOptions {
  refreshFn: RefreshTokenFn
  threshold?: number // Seconds before expiry (default: 60)
  maxRetries?: number // Default: 3
  retryDelay?: number // Default: 1000ms
  onRefreshStart?: () => void
  onRefreshSuccess?: (tokens: TokenSet) => void
  onRefreshError?: (error: Error) => void
}

/**
 * RefreshEnginePlugin class
 */
export class RefreshEnginePlugin implements Plugin {
  name = 'refresh-engine'
  version = '1.0.0'
  type = 'core' as const

  private kernel!: AuthKeeper
  private refreshFn!: RefreshTokenFn
  private isRefreshingFlag = false
  private refreshPromise: Promise<TokenSet> | null = null
  private scheduledRefreshTimeout: ReturnType<typeof setTimeout> | null = null
  private threshold: number
  private maxRetries: number
  private retryDelay: number
  private options: RefreshEngineOptions

  constructor(options: RefreshEngineOptions) {
    this.options = options
    this.refreshFn = options.refreshFn
    this.threshold = options.threshold || 60
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
  }

  install(kernel: AuthKeeper): RefreshEngineAPI {
    this.kernel = kernel

    return {
      refresh: this.refresh.bind(this),
      scheduleRefresh: this.scheduleRefresh.bind(this),
      cancelScheduledRefresh: this.cancelScheduledRefresh.bind(this),
      isRefreshing: () => this.isRefreshingFlag,
      getNextRefreshAt: this.getNextRefreshAt.bind(this),
      setRefreshFn: (fn: RefreshTokenFn) => {
        this.refreshFn = fn
      },
      setThreshold: (seconds: number) => {
        this.threshold = seconds
      },
    }
  }

  /**
   * Refresh tokens
   *
   * Queues concurrent requests - only one refresh executes at a time.
   */
  private async refresh(): Promise<TokenSet> {
    // If already refreshing, return the same promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshingFlag = true
    this.refreshPromise = this.executeRefresh()

    try {
      const tokens = await this.refreshPromise
      return tokens
    } finally {
      this.isRefreshingFlag = false
      this.refreshPromise = null
    }
  }

  /**
   * Execute token refresh with retry logic
   */
  private async executeRefresh(retryCount = 0): Promise<TokenSet> {
    // Call onRefreshStart callback
    if (this.options.onRefreshStart) {
      this.options.onRefreshStart()
    }

    // Get refresh token
    const refreshToken = this.kernel.getRefreshToken()
    if (!refreshToken) {
      const error = new Error('No refresh token available') as AuthError
      error.name = 'AuthError'
      ;(error as any).code = 'REFRESH_TOKEN_MISSING'

      // Emit error event
      this.kernel.emit({
        type: 'error',
        error,
        context: 'refresh',
        timestamp: Date.now(),
      })

      throw error
    }

    try {
      // Get expiry before refresh for event
      const previousExpiresAt = this.kernel.getExpiresAt()

      // Call user-provided refresh function
      const newTokens = await this.refreshFn(refreshToken)

      // Update tokens in store
      this.kernel.setTokens(newTokens)

      // Get new expiry
      const newExpiresAt = this.kernel.getExpiresAt()

      // Emit refresh event
      this.kernel.emit({
        type: 'refresh',
        tokens: newTokens,
        previousExpiresAt,
        newExpiresAt,
        timestamp: Date.now(),
      })

      // Call onRefreshSuccess callback
      if (this.options.onRefreshSuccess) {
        this.options.onRefreshSuccess(newTokens)
      }

      // Schedule next refresh
      this.scheduleRefresh()

      return newTokens
    } catch (error) {
      // Retry with exponential backoff
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.executeRefresh(retryCount + 1)
      }

      // Max retries exceeded
      const authError = new Error('Token refresh failed') as AuthError
      authError.name = 'AuthError'
      ;(authError as any).code = 'REFRESH_FAILED'
      ;(authError as any).cause = error
      ;(authError as any).context = { retryCount }

      // Emit error event
      this.kernel.emit({
        type: 'error',
        error: authError,
        context: 'refresh',
        timestamp: Date.now(),
      })

      // Call onRefreshError callback
      if (this.options.onRefreshError) {
        this.options.onRefreshError(authError)
      }

      throw authError
    }
  }

  /**
   * Schedule automatic refresh
   *
   * Schedules refresh before token expires (threshold seconds before).
   */
  private scheduleRefresh(): void {
    this.cancelScheduledRefresh()

    const expiresIn = this.kernel.getTimeUntilExpiry()
    if (!expiresIn) {
      return
    }

    // Schedule refresh before expiry (threshold seconds before)
    const refreshIn = expiresIn - this.threshold * 1000

    if (refreshIn > 0) {
      this.scheduledRefreshTimeout = setTimeout(() => {
        this.refresh().catch((error) => {
          console.error('[AuthKeeper] Scheduled refresh failed:', error)
        })
      }, refreshIn)
    } else {
      // Token expires soon or already expired, refresh immediately
      this.refresh().catch((error) => {
        console.error('[AuthKeeper] Immediate refresh failed:', error)
      })
    }
  }

  /**
   * Cancel scheduled refresh
   */
  private cancelScheduledRefresh(): void {
    if (this.scheduledRefreshTimeout) {
      clearTimeout(this.scheduledRefreshTimeout)
      this.scheduledRefreshTimeout = null
    }
  }

  /**
   * Get next scheduled refresh time
   */
  private getNextRefreshAt(): Date | null {
    const expiresAt = this.kernel.getExpiresAt()
    if (!expiresAt) {
      return null
    }

    // Calculate refresh time (threshold seconds before expiry)
    const refreshAt = new Date(expiresAt.getTime() - this.threshold * 1000)
    return refreshAt
  }

  /**
   * Uninstall plugin
   */
  uninstall(): void {
    this.cancelScheduledRefresh()
  }
}

/**
 * Create refresh-engine plugin
 */
export function createRefreshEnginePlugin(options: RefreshEngineOptions): RefreshEnginePlugin {
  return new RefreshEnginePlugin(options)
}
