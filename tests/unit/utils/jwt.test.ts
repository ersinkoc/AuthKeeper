import { vi } from 'vitest'
import {
  decodeJwt,
  decodePayload,
  decodeHeader,
  isValidJwtFormat,
  getTokenExpiry,
  isTokenExpired,
  getTimeUntilExpiry,
  getClaim,
  getClaims,
} from '../../../src/utils/jwt'
import {
  TEST_ACCESS_TOKEN,
  TEST_EXPIRED_TOKEN,
  TEST_NO_EXPIRY_TOKEN,
  TEST_CUSTOM_CLAIMS_TOKEN,
  MALFORMED_TOKENS,
  createTestToken,
} from '../../fixtures/test-tokens'
import { AuthError } from '../../../src/types'

describe('jwt utilities', () => {
  describe('decodeJwt', () => {
    it('should decode valid JWT token', () => {
      const decoded = decodeJwt(TEST_ACCESS_TOKEN)
      expect(decoded).toHaveProperty('header')
      expect(decoded).toHaveProperty('payload')
      expect(decoded.header).toHaveProperty('alg', 'HS256')
      expect(decoded.payload).toHaveProperty('sub', 'user-123')
      expect(decoded.payload).toHaveProperty('email', 'test@example.com')
    })

    it('should decode header correctly', () => {
      const decoded = decodeJwt(TEST_ACCESS_TOKEN)
      expect(decoded.header.alg).toBe('HS256')
      expect(decoded.header.typ).toBe('JWT')
    })

    it('should decode payload correctly', () => {
      const decoded = decodeJwt(TEST_ACCESS_TOKEN)
      expect(decoded.payload.sub).toBe('user-123')
      expect(decoded.payload.email).toBe('test@example.com')
      expect(decoded.payload.name).toBe('Test User')
      expect(decoded.payload.roles).toEqual(['user', 'admin'])
    })

    it('should support generic payload type', () => {
      interface CustomPayload {
        sub: string
        customField: string
      }
      const token = createTestToken({ sub: 'user-123', customField: 'value' })
      const decoded = decodeJwt<CustomPayload>(token)
      expect(decoded.payload.customField).toBe('value')
    })

    it('should throw error for token with 2 parts', () => {
      expect(() => decodeJwt(MALFORMED_TOKENS.twoparts)).toThrow(AuthError)
      expect(() => decodeJwt(MALFORMED_TOKENS.twoparts)).toThrow('must have 3 parts')
    })

    it('should throw error for token with 4 parts', () => {
      expect(() => decodeJwt(MALFORMED_TOKENS.fourParts)).toThrow(AuthError)
      expect(() => decodeJwt(MALFORMED_TOKENS.fourParts)).toThrow('must have 3 parts')
    })

    it('should throw error for empty token', () => {
      expect(() => decodeJwt(MALFORMED_TOKENS.empty)).toThrow(AuthError)
    })

    it('should throw error for invalid JSON in payload', () => {
      expect(() => decodeJwt(MALFORMED_TOKENS.notJson)).toThrow(AuthError)
      expect(() => decodeJwt(MALFORMED_TOKENS.notJson)).toThrow('Failed to decode JWT')
    })
  })

  describe('decodePayload', () => {
    it('should decode only payload', () => {
      const payload = decodePayload(TEST_ACCESS_TOKEN)
      expect(payload).toHaveProperty('sub', 'user-123')
      expect(payload).toHaveProperty('email', 'test@example.com')
    })

    it('should throw error for malformed token', () => {
      expect(() => decodePayload(MALFORMED_TOKENS.twoparts)).toThrow(AuthError)
    })
  })

  describe('decodeHeader', () => {
    it('should decode only header', () => {
      const header = decodeHeader(TEST_ACCESS_TOKEN)
      expect(header).toHaveProperty('alg', 'HS256')
      expect(header).toHaveProperty('typ', 'JWT')
    })

    it('should throw error for malformed token', () => {
      expect(() => decodeHeader(MALFORMED_TOKENS.twoparts)).toThrow(AuthError)
    })
  })

  describe('isValidJwtFormat', () => {
    it('should return true for valid JWT', () => {
      expect(isValidJwtFormat(TEST_ACCESS_TOKEN)).toBe(true)
      expect(isValidJwtFormat(TEST_EXPIRED_TOKEN)).toBe(true)
      expect(isValidJwtFormat(TEST_NO_EXPIRY_TOKEN)).toBe(true)
    })

    it('should return false for token with 2 parts', () => {
      expect(isValidJwtFormat(MALFORMED_TOKENS.twoparts)).toBe(false)
    })

    it('should return false for token with 4 parts', () => {
      expect(isValidJwtFormat(MALFORMED_TOKENS.fourParts)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidJwtFormat(MALFORMED_TOKENS.empty)).toBe(false)
    })

    it('should return false for non-string', () => {
      expect(isValidJwtFormat(null as any)).toBe(false)
      expect(isValidJwtFormat(undefined as any)).toBe(false)
      expect(isValidJwtFormat(123 as any)).toBe(false)
      expect(isValidJwtFormat({} as any)).toBe(false)
    })

    it('should return false for invalid base64', () => {
      expect(isValidJwtFormat(MALFORMED_TOKENS.invalidBase64)).toBe(false)
    })
  })

  describe('getTokenExpiry', () => {
    it('should return expiry date for token with exp claim', () => {
      const expiry = getTokenExpiry(TEST_ACCESS_TOKEN)
      expect(expiry).toBeInstanceOf(Date)
      expect(expiry!.getTime()).toBeGreaterThan(Date.now())
    })

    it('should return null for token without exp claim', () => {
      const expiry = getTokenExpiry(TEST_NO_EXPIRY_TOKEN)
      expect(expiry).toBeNull()
    })

    it('should return past date for expired token', () => {
      const expiry = getTokenExpiry(TEST_EXPIRED_TOKEN)
      expect(expiry).toBeInstanceOf(Date)
      expect(expiry!.getTime()).toBeLessThan(Date.now())
    })

    it('should return null for malformed token', () => {
      const expiry = getTokenExpiry(MALFORMED_TOKENS.twoparts)
      expect(expiry).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      expect(isTokenExpired(TEST_ACCESS_TOKEN)).toBe(false)
    })

    it('should return true for expired token', () => {
      expect(isTokenExpired(TEST_EXPIRED_TOKEN)).toBe(true)
    })

    it('should return false for token without expiry', () => {
      expect(isTokenExpired(TEST_NO_EXPIRY_TOKEN)).toBe(false)
    })

    it('should consider buffer seconds', () => {
      // Create token that expires in 30 seconds
      const token = createTestToken({
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 30,
      })

      // Without buffer, not expired
      expect(isTokenExpired(token, 0)).toBe(false)

      // With 60 second buffer, considered expired
      expect(isTokenExpired(token, 60)).toBe(true)
    })

    it('should return false for malformed token', () => {
      expect(isTokenExpired(MALFORMED_TOKENS.twoparts)).toBe(false)
    })
  })

  describe('getTimeUntilExpiry', () => {
    it('should return positive number for valid token', () => {
      const timeUntil = getTimeUntilExpiry(TEST_ACCESS_TOKEN)
      expect(timeUntil).toBeGreaterThan(0)
      expect(timeUntil).toBeLessThanOrEqual(3600 * 1000) // Max 1 hour in ms
    })

    it('should return 0 for expired token', () => {
      const timeUntil = getTimeUntilExpiry(TEST_EXPIRED_TOKEN)
      expect(timeUntil).toBe(0)
    })

    it('should return null for token without expiry', () => {
      const timeUntil = getTimeUntilExpiry(TEST_NO_EXPIRY_TOKEN)
      expect(timeUntil).toBeNull()
    })

    it('should return null for malformed token', () => {
      const timeUntil = getTimeUntilExpiry(MALFORMED_TOKENS.twoparts)
      expect(timeUntil).toBeNull()
    })
  })

  describe('getClaim', () => {
    it('should get existing claim', () => {
      expect(getClaim(TEST_ACCESS_TOKEN, 'sub')).toBe('user-123')
      expect(getClaim(TEST_ACCESS_TOKEN, 'email')).toBe('test@example.com')
      expect(getClaim(TEST_ACCESS_TOKEN, 'name')).toBe('Test User')
    })

    it('should return undefined for non-existing claim', () => {
      expect(getClaim(TEST_ACCESS_TOKEN, 'nonexistent' as any)).toBeUndefined()
    })

    it('should get custom claims', () => {
      const payload = decodePayload(TEST_CUSTOM_CLAIMS_TOKEN)
      expect(payload.customClaim).toBe('customValue')
      expect(payload.nestedClaim).toEqual({ foo: 'bar', baz: 123 })
    })

    it('should return undefined for malformed token', () => {
      expect(getClaim(MALFORMED_TOKENS.twoparts, 'sub')).toBeUndefined()
    })
  })

  describe('getClaims', () => {
    it('should get multiple claims', () => {
      const claims = getClaims(TEST_ACCESS_TOKEN, ['sub', 'email', 'name'])
      expect(claims.sub).toBe('user-123')
      expect(claims.email).toBe('test@example.com')
      expect(claims.name).toBe('Test User')
    })

    it('should get subset of claims', () => {
      const claims = getClaims(TEST_ACCESS_TOKEN, ['sub', 'email'])
      expect(claims.sub).toBe('user-123')
      expect(claims.email).toBe('test@example.com')
      expect(claims).not.toHaveProperty('name')
    })

    it('should handle empty claims array', () => {
      const claims = getClaims(TEST_ACCESS_TOKEN, [])
      expect(Object.keys(claims)).toHaveLength(0)
    })

    it('should skip non-existing claims', () => {
      const claims = getClaims(TEST_ACCESS_TOKEN, ['sub', 'nonexistent' as any])
      expect(claims.sub).toBe('user-123')
      expect(claims).not.toHaveProperty('nonexistent')
    })

    it('should return empty object for malformed token', () => {
      const claims = getClaims(MALFORMED_TOKENS.twoparts, ['sub', 'email'])
      expect(Object.keys(claims)).toHaveLength(0)
    })
  })
})
