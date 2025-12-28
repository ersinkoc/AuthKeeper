/**
 * Cookie utilities
 *
 * Helper functions for parsing and serializing cookies.
 */

/**
 * Cookie attributes for serialization
 */
export interface CookieAttributes {
  /** Path where cookie is valid (default: '/') */
  path?: string
  /** Domain where cookie is valid */
  domain?: string
  /** Max age in seconds */
  maxAge?: number
  /** Expiration date */
  expires?: Date
  /** Secure flag (HTTPS only) */
  secure?: boolean
  /** SameSite attribute */
  sameSite?: 'strict' | 'lax' | 'none'
  /** HttpOnly flag (not accessible via JavaScript) */
  httpOnly?: boolean
}

/**
 * Parse document.cookie string into key-value pairs
 *
 * @param cookieString - Cookie string from document.cookie
 * @returns Object with cookie key-value pairs
 */
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  if (!cookieString) {
    return cookies
  }

  cookieString.split(';').forEach((cookie) => {
    const [key, ...valueParts] = cookie.split('=')
    const trimmedKey = key?.trim()
    const value = valueParts.join('=').trim()

    if (trimmedKey) {
      cookies[trimmedKey] = decodeURIComponent(value)
    }
  })

  return cookies
}

/**
 * Get cookie value by name
 *
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = parseCookies(document.cookie)
  return cookies[name] || null
}

/**
 * Serialize cookie with attributes to Set-Cookie format
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param attributes - Cookie attributes
 * @returns Set-Cookie header value
 */
export function serializeCookie(
  name: string,
  value: string,
  attributes: CookieAttributes = {}
): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (attributes.path) {
    cookie += `; Path=${attributes.path}`
  }

  if (attributes.domain) {
    cookie += `; Domain=${attributes.domain}`
  }

  if (attributes.maxAge !== undefined) {
    cookie += `; Max-Age=${attributes.maxAge}`
  }

  if (attributes.expires) {
    cookie += `; Expires=${attributes.expires.toUTCString()}`
  }

  if (attributes.secure) {
    cookie += '; Secure'
  }

  if (attributes.sameSite) {
    const sameSite = attributes.sameSite.charAt(0).toUpperCase() + attributes.sameSite.slice(1)
    cookie += `; SameSite=${sameSite}`
  }

  if (attributes.httpOnly) {
    cookie += '; HttpOnly'
  }

  return cookie
}

/**
 * Set cookie in document
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param attributes - Cookie attributes
 */
export function setCookie(name: string, value: string, attributes: CookieAttributes = {}): void {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = serializeCookie(name, value, attributes)
}

/**
 * Delete cookie by name
 *
 * @param name - Cookie name
 * @param attributes - Cookie attributes (path and domain should match original)
 */
export function deleteCookie(name: string, attributes: Omit<CookieAttributes, 'maxAge' | 'expires'> = {}): void {
  if (typeof document === 'undefined') {
    return
  }

  // Set expiration to past date
  document.cookie = serializeCookie(name, '', {
    ...attributes,
    expires: new Date(0),
  })
}
