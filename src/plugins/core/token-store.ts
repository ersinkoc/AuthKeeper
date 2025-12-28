/**
 * Token Store Plugin
 *
 * Core plugin for token state management.
 * Stores tokens in memory with metadata (setAt, refreshCount).
 */

import type { Plugin, TokenSet, StoredTokens, AuthKeeper } from '../../types'

/**
 * Token Store API
 */
export interface TokenStoreAPI {
  set(tokens: TokenSet): void
  get(): StoredTokens | null
  clear(): void
  getAccessToken(): string | null
  getRefreshToken(): string | null
  getTokenType(): string
  getExpiresAt(): Date | null
  getExpiresIn(): number | null
  isExpired(): boolean
  getSetAt(): Date | null
  getRefreshCount(): number
}

/**
 * Token Store Plugin Options
 */
export interface TokenStoreOptions {
  validateOnSet?: boolean
  onSet?: (tokens: StoredTokens) => void
  onClear?: () => void
}

/**
 * TokenStorePlugin class
 */
export class TokenStorePlugin implements Plugin {
  name = 'token-store'
  version = '1.0.0'
  type = 'core' as const

  private tokens: StoredTokens | null = null
  private options: TokenStoreOptions

  constructor(options: TokenStoreOptions = {}) {
    this.options = options
  }

  install(_kernel: AuthKeeper): TokenStoreAPI {
    return {
      set: this.set.bind(this),
      get: this.get.bind(this),
      clear: this.clear.bind(this),
      getAccessToken: () => this.tokens?.accessToken || null,
      getRefreshToken: () => this.tokens?.refreshToken || null,
      getTokenType: () => this.tokens?.tokenType || 'Bearer',
      getExpiresAt: () => {
        if (!this.tokens?.expiresAt) return null
        return new Date(this.tokens.expiresAt)
      },
      getExpiresIn: () => {
        if (!this.tokens?.expiresAt) return null
        const now = Date.now()
        const timeUntil = this.tokens.expiresAt - now
        return Math.max(0, timeUntil)
      },
      isExpired: () => {
        if (!this.tokens?.expiresAt) return false
        return Date.now() >= this.tokens.expiresAt
      },
      getSetAt: () => {
        if (!this.tokens?.setAt) return null
        return new Date(this.tokens.setAt)
      },
      getRefreshCount: () => this.tokens?.refreshCount || 0,
    }
  }

  /**
   * Set tokens
   */
  private set(tokens: TokenSet): void {
    // Calculate expiresAt
    let expiresAt: number | null = null
    if (tokens.expiresAt) {
      // expiresAt is in seconds (Unix timestamp), convert to milliseconds
      expiresAt = tokens.expiresAt * 1000
    } else if (tokens.expiresIn) {
      // expiresIn is in seconds, convert to milliseconds and add to now
      expiresAt = Date.now() + tokens.expiresIn * 1000
    }

    // Increment refresh count if tokens already exist
    const refreshCount = this.tokens ? this.tokens.refreshCount + 1 : 1

    this.tokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || null,
      tokenType: tokens.tokenType || 'Bearer',
      expiresAt,
      setAt: Date.now(),
      refreshCount,
    }

    // Call callback if provided
    if (this.options.onSet) {
      this.options.onSet(this.tokens)
    }
  }

  /**
   * Get tokens
   */
  private get(): StoredTokens | null {
    return this.tokens
  }

  /**
   * Clear tokens
   */
  private clear(): void {
    this.tokens = null

    // Call callback if provided
    if (this.options.onClear) {
      this.options.onClear()
    }
  }

  /**
   * Uninstall plugin
   */
  uninstall(): void {
    this.clear()
  }
}

/**
 * Create token-store plugin
 */
export function createTokenStorePlugin(options?: TokenStoreOptions): TokenStorePlugin {
  return new TokenStorePlugin(options)
}
