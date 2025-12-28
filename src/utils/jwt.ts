/**
 * JWT (JSON Web Token) utilities
 *
 * Implements JWT decoding without validation.
 * Signature validation is NOT performed (client-side doesn't need it).
 * The server should validate signatures.
 */

import { base64UrlDecode } from './base64'
import { AuthError, type TokenPayload, type TokenHeader } from '../types'

/**
 * Decode a JWT token into header and payload
 *
 * NOTE: This does NOT validate the signature!
 * Signature validation should be done server-side.
 *
 * @param token - JWT string (header.payload.signature)
 * @returns Decoded header and payload
 * @throws {AuthError} If token format is invalid
 */
export function decodeJwt<T = TokenPayload>(
  token: string
): { header: TokenHeader; payload: T } {
  // JWT format: header.payload.signature
  const parts = token.split('.')

  if (parts.length !== 3) {
    throw new AuthError('TOKEN_DECODE_FAILED', 'Invalid JWT format: must have 3 parts', {
      context: { parts: parts.length },
    })
  }

  try {
    // Decode header
    const headerJson = base64UrlDecode(parts[0]!)
    const header = JSON.parse(headerJson) as TokenHeader

    // Decode payload
    const payloadJson = base64UrlDecode(parts[1]!)
    const payload = JSON.parse(payloadJson) as T

    return { header, payload }
  } catch (error) {
    throw new AuthError('TOKEN_DECODE_FAILED', 'Failed to decode JWT', {
      cause: error as Error,
    })
  }
}

/**
 * Decode only the payload from a JWT token
 *
 * @param token - JWT string
 * @returns Decoded payload
 * @throws {AuthError} If token format is invalid
 */
export function decodePayload<T = TokenPayload>(token: string): T {
  return decodeJwt<T>(token).payload
}

/**
 * Decode only the header from a JWT token
 *
 * @param token - JWT string
 * @returns Decoded header
 * @throws {AuthError} If token format is invalid
 */
export function decodeHeader(token: string): TokenHeader {
  return decodeJwt(token).header
}

/**
 * Check if a token is valid JWT format (not expired, not signature)
 *
 * @param token - Token string to validate
 * @returns true if token has valid JWT format
 */
export function isValidJwtFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  try {
    // Try to decode both parts
    base64UrlDecode(parts[0]!)
    base64UrlDecode(parts[1]!)
    return true
  } catch {
    return false
  }
}

/**
 * Get expiration date from JWT token
 *
 * @param token - JWT string
 * @returns Expiration date or null if no exp claim
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const payload = decodePayload(token)
    if (payload.exp) {
      // JWT exp is in seconds, JavaScript Date uses milliseconds
      return new Date(payload.exp * 1000)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Check if a JWT token is expired
 *
 * @param token - JWT string
 * @param bufferSeconds - Consider expired if within this many seconds (default: 0)
 * @returns true if token is expired
 */
export function isTokenExpired(token: string, bufferSeconds: number = 0): boolean {
  const expiry = getTokenExpiry(token)
  if (!expiry) {
    // No expiry claim means it doesn't expire
    return false
  }

  const now = Date.now()
  const expiryTime = expiry.getTime() - bufferSeconds * 1000
  return now >= expiryTime
}

/**
 * Get time until token expiry in milliseconds
 *
 * @param token - JWT string
 * @returns Milliseconds until expiry, or null if no expiry
 */
export function getTimeUntilExpiry(token: string): number | null {
  const expiry = getTokenExpiry(token)
  if (!expiry) {
    return null
  }

  const now = Date.now()
  const timeUntil = expiry.getTime() - now
  return Math.max(0, timeUntil)
}

/**
 * Extract a specific claim from JWT token
 *
 * @param token - JWT string
 * @param claim - Claim name
 * @returns Claim value or undefined
 */
export function getClaim<K extends keyof TokenPayload>(
  token: string,
  claim: K
): TokenPayload[K] | undefined {
  try {
    const payload = decodePayload(token)
    return payload[claim]
  } catch {
    return undefined
  }
}

/**
 * Extract multiple claims from JWT token
 *
 * @param token - JWT string
 * @param claims - Array of claim names
 * @returns Object with claim values
 */
export function getClaims<K extends keyof TokenPayload>(
  token: string,
  claims: K[]
): Partial<Pick<TokenPayload, K>> {
  try {
    const payload = decodePayload(token)
    const result: Partial<Pick<TokenPayload, K>> = {}
    for (const claim of claims) {
      if (claim in payload) {
        result[claim] = payload[claim]
      }
    }
    return result
  } catch {
    return {}
  }
}
