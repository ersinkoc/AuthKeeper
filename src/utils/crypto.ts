/**
 * Cryptographic utilities for PKCE (Proof Key for Code Exchange)
 *
 * Implements OAuth2 PKCE flow requirements:
 * - Code verifier generation (43-128 characters)
 * - Code challenge generation (SHA-256)
 */

import { base64UrlEncode } from './base64'

/**
 * Generate a cryptographically secure random code verifier for PKCE
 *
 * The code verifier is a high-entropy cryptographic random string
 * with a minimum length of 43 characters and maximum of 128 characters.
 *
 * @param length - Length of the code verifier (default: 64, min: 43, max: 128)
 * @returns Base64URL-encoded random string
 */
export function generateCodeVerifier(length: number = 64): string {
  // Validate length
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 characters')
  }

  // Generate random bytes
  // We need enough bytes to produce the desired length after base64url encoding
  // Base64 encoding increases size by ~33%, so we generate 3/4 of desired length
  const byteLength = Math.ceil((length * 3) / 4)
  const randomBytes = new Uint8Array(byteLength)
  crypto.getRandomValues(randomBytes)

  // Encode and trim to exact length
  const verifier = base64UrlEncode(randomBytes).substring(0, length)
  return verifier
}

/**
 * Generate code challenge from code verifier using SHA-256
 *
 * The code challenge is a Base64URL-encoded SHA-256 hash of the code verifier.
 * This is the recommended method for PKCE (S256).
 *
 * @param codeVerifier - The code verifier to hash
 * @returns Base64URL-encoded SHA-256 hash
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Convert verifier string to bytes
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Convert to Base64URL
  const hashArray = new Uint8Array(hashBuffer)
  return base64UrlEncode(hashArray)
}

/**
 * Generate a cryptographically secure random string
 *
 * Useful for generating state, nonce, or other random identifiers.
 *
 * @param length - Desired length of the random string
 * @returns Base64URL-encoded random string
 */
export function generateRandomString(length: number): string {
  const byteLength = Math.ceil((length * 3) / 4)
  const randomBytes = new Uint8Array(byteLength)
  crypto.getRandomValues(randomBytes)
  return base64UrlEncode(randomBytes).substring(0, length)
}

/**
 * Generate a random UUID v4
 *
 * @returns UUID v4 string
 */
export function generateUuid(): string {
  // Use crypto.randomUUID if available
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback: generate UUID v4 manually
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // Set version (4) and variant bits
  bytes[6] = (bytes[6]! & 0x0f) | 0x40 // Version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80 // Variant 10

  // Convert to hex string with dashes
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`
}
