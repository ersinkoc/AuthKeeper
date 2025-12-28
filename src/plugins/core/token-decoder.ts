/**
 * Token Decoder Plugin
 *
 * Core plugin for JWT token decoding.
 * Does NOT validate signatures (client-side doesn't need to).
 */

import type { Plugin, TokenPayload, TokenHeader, TokenInfo, AuthKeeper } from '../../types'
import {
  decodeJwt,
  decodePayload,
  decodeHeader,
  getTokenExpiry,
  isTokenExpired,
  getTimeUntilExpiry,
  getClaim,
  getClaims,
} from '../../utils/jwt'

/**
 * Token Decoder API
 */
export interface TokenDecoderAPI {
  decode<T = TokenPayload>(token?: string): T | null
  getHeader(token?: string): TokenHeader | null
  getClaim<K extends keyof TokenPayload>(key: K, token?: string): TokenPayload[K] | undefined
  getClaims<K extends keyof TokenPayload>(keys: K[], token?: string): Pick<TokenPayload, K>
  getExpiry(token?: string): Date | null
  isExpired(token?: string): boolean
  getTokenInfo(token?: string): TokenInfo | null
}

/**
 * TokenDecoderPlugin class
 */
export class TokenDecoderPlugin implements Plugin {
  name = 'token-decoder'
  version = '1.0.0'
  type = 'core' as const

  private kernel!: AuthKeeper

  install(kernel: AuthKeeper): TokenDecoderAPI {
    this.kernel = kernel

    return {
      decode: this.decode.bind(this),
      getHeader: this.getHeader.bind(this),
      getClaim: this.getClaimFromToken.bind(this),
      getClaims: this.getClaimsFromToken.bind(this),
      getExpiry: this.getExpiry.bind(this),
      isExpired: this.isExpiredToken.bind(this),
      getTokenInfo: this.getTokenInfo.bind(this),
    }
  }

  /**
   * Decode token payload
   */
  private decode<T = TokenPayload>(token?: string): T | null {
    const jwt = token || this.kernel.getAccessToken()
    if (!jwt) {
      return null
    }

    try {
      return decodePayload<T>(jwt)
    } catch {
      return null
    }
  }

  /**
   * Decode token header
   */
  private getHeader(token?: string): TokenHeader | null {
    const jwt = token || this.kernel.getAccessToken()
    if (!jwt) {
      return null
    }

    try {
      return decodeHeader(jwt)
    } catch {
      return null
    }
  }

  /**
   * Get specific claim from token
   */
  private getClaimFromToken<K extends keyof TokenPayload>(
    key: K,
    token?: string
  ): TokenPayload[K] | undefined {
    const jwt = token || this.kernel.getAccessToken()
    if (!jwt) {
      return undefined
    }

    return getClaim(jwt, key)
  }

  /**
   * Get multiple claims from token
   */
  private getClaimsFromToken<K extends keyof TokenPayload>(
    keys: K[],
    token?: string
  ): Pick<TokenPayload, K> {
    const jwt = token || this.kernel.getAccessToken()
    if (!jwt) {
      return {} as Pick<TokenPayload, K>
    }

    return getClaims(jwt, keys) as Pick<TokenPayload, K>
  }

  /**
   * Get token expiry
   */
  private getExpiry(token?: string): Date | null {
    const jwt = token || this.kernel.getAccessToken()
    if (!jwt) {
      return null
    }

    return getTokenExpiry(jwt)
  }

  /**
   * Check if token is expired
   */
  private isExpiredToken(token?: string): boolean {
    const jwt = token || this.kernel.getAccessToken()
    if (!jwt) {
      return true
    }

    return isTokenExpired(jwt)
  }

  /**
   * Get complete token information
   */
  private getTokenInfo(token?: string): TokenInfo | null {
    const jwt = token || this.kernel.getAccessToken()
    if (!jwt) {
      return null
    }

    try {
      const { header, payload } = decodeJwt(jwt)
      const expiresAt = getTokenExpiry(jwt)
      const isExpired = isTokenExpired(jwt)
      const expiresIn = getTimeUntilExpiry(jwt)

      return {
        raw: jwt,
        header,
        payload,
        expiresAt,
        isExpired,
        expiresIn,
      }
    } catch {
      return null
    }
  }

  uninstall(): void {
    // Nothing to cleanup
  }
}

/**
 * Create token-decoder plugin
 */
export function createTokenDecoderPlugin(): TokenDecoderPlugin {
  return new TokenDecoderPlugin()
}
