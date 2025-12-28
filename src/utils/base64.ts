/**
 * Base64 and Base64URL encoding/decoding utilities
 *
 * Implements Base64URL encoding/decoding from scratch (zero dependencies).
 * Base64URL is used in JWTs and OAuth2 PKCE.
 */

/**
 * Encode a Uint8Array to Base64URL string
 *
 * Base64URL is like Base64 but URL-safe:
 * - Uses '-' instead of '+'
 * - Uses '_' instead of '/'
 * - Removes padding '='
 *
 * @param buffer - Data to encode
 * @returns Base64URL encoded string
 */
export function base64UrlEncode(buffer: Uint8Array): string {
  // Convert Uint8Array to binary string
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]!)
  }

  // Use btoa for browser, Buffer for Node.js
  const base64 =
    typeof window !== 'undefined'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64')

  // Convert to Base64URL format
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a Base64URL string to UTF-8 string
 *
 * @param str - Base64URL encoded string
 * @returns Decoded UTF-8 string
 */
export function base64UrlDecode(str: string): string {
  // Convert Base64URL to standard Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

  // Add padding if needed
  const pad = str.length % 4
  if (pad === 2) {
    base64 += '=='
  } else if (pad === 3) {
    base64 += '='
  }

  // Decode base64 to binary string
  const binary =
    typeof window !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary')

  // Convert binary string to UTF-8
  // Handle UTF-8 encoding properly
  return decodeURIComponent(
    binary
      .split('')
      .map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join('')
  )
}

/**
 * Encode a string to Base64URL
 *
 * @param str - String to encode
 * @returns Base64URL encoded string
 */
export function stringToBase64Url(str: string): string {
  // Convert string to UTF-8 bytes
  const utf8Bytes = new TextEncoder().encode(str)
  return base64UrlEncode(utf8Bytes)
}

/**
 * Decode a Base64URL string to Uint8Array
 *
 * @param str - Base64URL encoded string
 * @returns Decoded bytes
 */
export function base64UrlDecodeToBytes(str: string): Uint8Array {
  // Convert Base64URL to standard Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

  // Add padding if needed
  const pad = str.length % 4
  if (pad === 2) {
    base64 += '=='
  } else if (pad === 3) {
    base64 += '='
  }

  // Decode base64
  if (typeof window !== 'undefined') {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } else {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
}
