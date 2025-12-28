/**
 * Tests for cookie utilities
 */

import { vi } from 'vitest'
import {
  parseCookies,
  getCookie,
  serializeCookie,
  setCookie,
  deleteCookie,
  type CookieAttributes,
} from '../../../src/utils/cookie'

describe('cookie utilities', () => {
  describe('parseCookies()', () => {
    it('should parse simple cookie string', () => {
      const result = parseCookies('token=abc123')
      expect(result).toEqual({ token: 'abc123' })
    })

    it('should parse multiple cookies', () => {
      const result = parseCookies('token=abc123; user=john; session=xyz789')
      expect(result).toEqual({
        token: 'abc123',
        user: 'john',
        session: 'xyz789',
      })
    })

    it('should handle empty string', () => {
      const result = parseCookies('')
      expect(result).toEqual({})
    })

    it('should handle cookies with extra spaces', () => {
      const result = parseCookies('  token = abc123 ;  user = john  ')
      expect(result).toEqual({
        token: 'abc123',
        user: 'john',
      })
    })

    it('should decode URI components', () => {
      const result = parseCookies('message=Hello%20World')
      expect(result).toEqual({ message: 'Hello World' })
    })

    it('should handle cookie values with equals signs', () => {
      const result = parseCookies('token=eyJhbGc=IUzI1NiIsInR5cCI=IkpXVCJ9')
      expect(result).toEqual({
        token: 'eyJhbGc=IUzI1NiIsInR5cCI=IkpXVCJ9',
      })
    })

    it('should handle cookies with special characters in value', () => {
      const result = parseCookies('data=%7B%22key%22%3A%22value%22%7D')
      expect(result).toEqual({
        data: '{"key":"value"}',
      })
    })

    it('should ignore cookies without names', () => {
      const result = parseCookies('=value; valid=test')
      expect(result).toEqual({ valid: 'test' })
    })

    it('should handle empty cookie values', () => {
      const result = parseCookies('empty=; token=abc')
      expect(result).toEqual({
        empty: '',
        token: 'abc',
      })
    })
  })

  describe('getCookie()', () => {
    const originalDocument = global.document

    beforeEach(() => {
      // Mock document
      Object.defineProperty(global, 'document', {
        value: {
          cookie: 'token=abc123; user=john',
        },
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(global, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    })

    it('should get cookie value by name', () => {
      const value = getCookie('token')
      expect(value).toBe('abc123')
    })

    it('should return null for non-existent cookie', () => {
      const value = getCookie('nonexistent')
      expect(value).toBeNull()
    })

    it('should handle decoded values', () => {
      global.document.cookie = 'message=Hello%20World'
      const value = getCookie('message')
      expect(value).toBe('Hello World')
    })

    it('should return null when document is undefined', () => {
      Object.defineProperty(global, 'document', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const value = getCookie('token')
      expect(value).toBeNull()
    })
  })

  describe('serializeCookie()', () => {
    it('should serialize simple cookie', () => {
      const result = serializeCookie('token', 'abc123')
      expect(result).toBe('token=abc123')
    })

    it('should encode name and value', () => {
      const result = serializeCookie('my token', 'value with spaces')
      expect(result).toBe('my%20token=value%20with%20spaces')
    })

    it('should add Path attribute', () => {
      const result = serializeCookie('token', 'abc123', { path: '/app' })
      expect(result).toBe('token=abc123; Path=/app')
    })

    it('should add Domain attribute', () => {
      const result = serializeCookie('token', 'abc123', { domain: 'example.com' })
      expect(result).toBe('token=abc123; Domain=example.com')
    })

    it('should add Max-Age attribute', () => {
      const result = serializeCookie('token', 'abc123', { maxAge: 3600 })
      expect(result).toBe('token=abc123; Max-Age=3600')
    })

    it('should handle Max-Age of 0', () => {
      const result = serializeCookie('token', 'abc123', { maxAge: 0 })
      expect(result).toBe('token=abc123; Max-Age=0')
    })

    it('should add Expires attribute', () => {
      const expires = new Date('2024-12-31T23:59:59.999Z')
      const result = serializeCookie('token', 'abc123', { expires })
      expect(result).toBe('token=abc123; Expires=Tue, 31 Dec 2024 23:59:59 GMT')
    })

    it('should add Secure flag', () => {
      const result = serializeCookie('token', 'abc123', { secure: true })
      expect(result).toBe('token=abc123; Secure')
    })

    it('should add SameSite=Strict', () => {
      const result = serializeCookie('token', 'abc123', { sameSite: 'strict' })
      expect(result).toBe('token=abc123; SameSite=Strict')
    })

    it('should add SameSite=Lax', () => {
      const result = serializeCookie('token', 'abc123', { sameSite: 'lax' })
      expect(result).toBe('token=abc123; SameSite=Lax')
    })

    it('should add SameSite=None', () => {
      const result = serializeCookie('token', 'abc123', { sameSite: 'none' })
      expect(result).toBe('token=abc123; SameSite=None')
    })

    it('should add HttpOnly flag', () => {
      const result = serializeCookie('token', 'abc123', { httpOnly: true })
      expect(result).toBe('token=abc123; HttpOnly')
    })

    it('should combine multiple attributes', () => {
      const result = serializeCookie('token', 'abc123', {
        path: '/',
        domain: 'example.com',
        maxAge: 3600,
        secure: true,
        sameSite: 'strict',
        httpOnly: true,
      })

      expect(result).toBe(
        'token=abc123; Path=/; Domain=example.com; Max-Age=3600; Secure; SameSite=Strict; HttpOnly'
      )
    })

    it('should handle both maxAge and expires', () => {
      const expires = new Date('2024-12-31T23:59:59.999Z')
      const result = serializeCookie('token', 'abc123', {
        maxAge: 3600,
        expires,
      })

      expect(result).toBe('token=abc123; Max-Age=3600; Expires=Tue, 31 Dec 2024 23:59:59 GMT')
    })

    it('should handle empty value', () => {
      const result = serializeCookie('token', '')
      expect(result).toBe('token=')
    })

    it('should encode special characters', () => {
      const result = serializeCookie('data', '{"key":"value"}')
      expect(result).toBe('data=%7B%22key%22%3A%22value%22%7D')
    })
  })

  describe('setCookie()', () => {
    const originalDocument = global.document

    beforeEach(() => {
      // Mock document with writable cookie
      const mockCookie = { value: '' }
      Object.defineProperty(global, 'document', {
        value: {
          get cookie() {
            return mockCookie.value
          },
          set cookie(val: string) {
            mockCookie.value = val
          },
        },
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(global, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    })

    it('should set cookie in document', () => {
      setCookie('token', 'abc123')
      expect(document.cookie).toBe('token=abc123')
    })

    it('should set cookie with attributes', () => {
      setCookie('token', 'abc123', {
        path: '/',
        secure: true,
        sameSite: 'strict',
      })

      expect(document.cookie).toBe('token=abc123; Path=/; Secure; SameSite=Strict')
    })

    it('should not throw when document is undefined', () => {
      Object.defineProperty(global, 'document', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      expect(() => setCookie('token', 'abc123')).not.toThrow()
    })

    it('should encode special characters', () => {
      setCookie('data', '{"key":"value"}')
      expect(document.cookie).toBe('data=%7B%22key%22%3A%22value%22%7D')
    })
  })

  describe('deleteCookie()', () => {
    const originalDocument = global.document

    beforeEach(() => {
      const mockCookie = { value: '' }
      Object.defineProperty(global, 'document', {
        value: {
          get cookie() {
            return mockCookie.value
          },
          set cookie(val: string) {
            mockCookie.value = val
          },
        },
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(global, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    })

    it('should delete cookie by setting expiration to past', () => {
      deleteCookie('token')

      const cookie = document.cookie
      expect(cookie).toContain('token=')
      expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    })

    it('should delete cookie with path and domain', () => {
      deleteCookie('token', {
        path: '/app',
        domain: 'example.com',
      })

      const cookie = document.cookie
      expect(cookie).toContain('token=')
      expect(cookie).toContain('Path=/app')
      expect(cookie).toContain('Domain=example.com')
      expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    })

    it('should delete cookie with secure and sameSite', () => {
      deleteCookie('token', {
        secure: true,
        sameSite: 'strict',
      })

      const cookie = document.cookie
      expect(cookie).toContain('Secure')
      expect(cookie).toContain('SameSite=Strict')
    })

    it('should not throw when document is undefined', () => {
      Object.defineProperty(global, 'document', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      expect(() => deleteCookie('token')).not.toThrow()
    })
  })

  describe('integration scenarios', () => {
    const originalDocument = global.document

    beforeEach(() => {
      const cookieStore: string[] = []

      Object.defineProperty(global, 'document', {
        value: {
          get cookie() {
            return cookieStore.join('; ')
          },
          set cookie(val: string) {
            // Simple cookie store simulation
            const [nameValue] = val.split(';')
            const [name] = nameValue.split('=')

            // Remove old cookie with same name
            const filtered = cookieStore.filter((c) => !c.startsWith(name + '='))

            // Add new cookie if not expired
            if (!val.includes('Expires=Thu, 01 Jan 1970')) {
              filtered.push(nameValue)
            }

            cookieStore.length = 0
            cookieStore.push(...filtered)
          },
        },
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(global, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    })

    it('should set, get, and delete cookie', () => {
      // Set cookie
      setCookie('token', 'abc123', { path: '/' })
      expect(getCookie('token')).toBe('abc123')

      // Update cookie
      setCookie('token', 'xyz789', { path: '/' })
      expect(getCookie('token')).toBe('xyz789')

      // Delete cookie
      deleteCookie('token', { path: '/' })
      expect(getCookie('token')).toBeNull()
    })

    it('should handle multiple cookies', () => {
      setCookie('token', 'abc123')
      setCookie('user', 'john')
      setCookie('session', 'xyz789')

      expect(getCookie('token')).toBe('abc123')
      expect(getCookie('user')).toBe('john')
      expect(getCookie('session')).toBe('xyz789')

      // Delete one cookie
      deleteCookie('user')

      expect(getCookie('token')).toBe('abc123')
      expect(getCookie('user')).toBeNull()
      expect(getCookie('session')).toBe('xyz789')
    })

    it('should handle cookies with special characters', () => {
      const data = { key: 'value', nested: { data: 123 } }
      setCookie('data', JSON.stringify(data))

      const retrieved = getCookie('data')
      expect(retrieved).not.toBeNull()
      expect(JSON.parse(retrieved!)).toEqual(data)
    })
  })
})
