/**
 * Tests for TokenDecoderPlugin
 */

import { vi } from 'vitest'
import { TokenDecoderPlugin, createTokenDecoderPlugin } from '../../../../src/plugins/core/token-decoder'
import type { AuthKeeper, TokenPayload } from '../../../../src/types'
import { createTestToken } from '../../../fixtures/test-tokens'

describe('TokenDecoderPlugin', () => {
  let plugin: TokenDecoderPlugin
  let mockKernel: Partial<AuthKeeper>
  let api: any

  const createMockKernel = (accessToken: string | null = null): Partial<AuthKeeper> => ({
    getAccessToken: vi.fn().mockReturnValue(accessToken),
  })

  beforeEach(() => {
    plugin = new TokenDecoderPlugin()
    mockKernel = createMockKernel()
    api = plugin.install(mockKernel as AuthKeeper)
  })

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.name).toBe('token-decoder')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.type).toBe('core')
    })
  })

  describe('install()', () => {
    it('should return API object', () => {
      expect(api).toBeDefined()
      expect(typeof api.decode).toBe('function')
      expect(typeof api.getHeader).toBe('function')
      expect(typeof api.getClaim).toBe('function')
      expect(typeof api.getClaims).toBe('function')
      expect(typeof api.getExpiry).toBe('function')
      expect(typeof api.isExpired).toBe('function')
      expect(typeof api.getTokenInfo).toBe('function')
    })
  })

  describe('decode()', () => {
    it('should decode token payload from kernel', () => {
      const token = createTestToken({ sub: 'user-123', email: 'test@example.com' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const payload = api.decode()

      expect(payload).toBeDefined()
      expect(payload.sub).toBe('user-123')
      expect(payload.email).toBe('test@example.com')
    })

    it('should decode provided token', () => {
      const token = createTestToken({ sub: 'user-456' })

      const payload = api.decode(token)

      expect(payload).toBeDefined()
      expect(payload.sub).toBe('user-456')
      expect(mockKernel.getAccessToken).not.toHaveBeenCalled()
    })

    it('should return null when no token in kernel', () => {
      mockKernel = createMockKernel(null)
      api = plugin.install(mockKernel as AuthKeeper)

      const payload = api.decode()

      expect(payload).toBeNull()
    })

    it('should return null for invalid token', () => {
      const payload = api.decode('invalid-token')

      expect(payload).toBeNull()
    })

    it('should support generic type parameter', () => {
      interface CustomPayload extends TokenPayload {
        customField: string
      }

      const token = createTestToken({ customField: 'custom-value' })

      const payload = api.decode<CustomPayload>(token)

      expect(payload?.customField).toBe('custom-value')
    })
  })

  describe('getHeader()', () => {
    it('should decode token header from kernel', () => {
      const token = createTestToken({ sub: 'test' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const header = api.getHeader()

      expect(header).toBeDefined()
      expect(header.alg).toBe('HS256')
      expect(header.typ).toBe('JWT')
    })

    it('should decode header from provided token', () => {
      const token = createTestToken({ sub: 'test' })

      const header = api.getHeader(token)

      expect(header).toBeDefined()
      expect(header.alg).toBe('HS256')
    })

    it('should return null when no token', () => {
      mockKernel = createMockKernel(null)
      api = plugin.install(mockKernel as AuthKeeper)

      const header = api.getHeader()

      expect(header).toBeNull()
    })

    it('should return null for invalid token', () => {
      const header = api.getHeader('invalid')

      expect(header).toBeNull()
    })
  })

  describe('getClaim()', () => {
    it('should get claim from kernel token', () => {
      const token = createTestToken({ sub: 'user-123', email: 'test@example.com' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.getClaim('sub')).toBe('user-123')
      expect(api.getClaim('email')).toBe('test@example.com')
    })

    it('should get claim from provided token', () => {
      const token = createTestToken({ sub: 'user-456' })

      const sub = api.getClaim('sub', token)

      expect(sub).toBe('user-456')
    })

    it('should return undefined for non-existent claim', () => {
      const token = createTestToken({ sub: 'test' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.getClaim('nonexistent' as any)).toBeUndefined()
    })

    it('should return undefined when no token', () => {
      mockKernel = createMockKernel(null)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.getClaim('sub')).toBeUndefined()
    })

    it('should handle various claim types', () => {
      const token = createTestToken({
        sub: 'user-123',
        exp: 1234567890,
        roles: ['admin', 'user'],
        isActive: true,
      })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.getClaim('sub')).toBe('user-123')
      expect(api.getClaim('exp')).toBe(1234567890)
      expect(api.getClaim('roles')).toEqual(['admin', 'user'])
      expect(api.getClaim('isActive')).toBe(true)
    })
  })

  describe('getClaims()', () => {
    it('should get multiple claims from kernel token', () => {
      const token = createTestToken({
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const claims = api.getClaims(['sub', 'email'])

      expect(claims).toEqual({
        sub: 'user-123',
        email: 'test@example.com',
      })
    })

    it('should get claims from provided token', () => {
      const token = createTestToken({
        sub: 'user-456',
        exp: 1234567890,
      })

      const claims = api.getClaims(['sub', 'exp'], token)

      expect(claims).toEqual({
        sub: 'user-456',
        exp: 1234567890,
      })
    })

    it('should return empty object when no token', () => {
      mockKernel = createMockKernel(null)
      api = plugin.install(mockKernel as AuthKeeper)

      const claims = api.getClaims(['sub', 'email'])

      expect(claims).toEqual({})
    })

    it('should include undefined for non-existent claims', () => {
      const token = createTestToken({ sub: 'test' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const claims = api.getClaims(['sub', 'email' as any])

      expect(claims.sub).toBe('test')
      expect(claims.email).toBeUndefined()
    })

    it('should handle empty keys array', () => {
      const token = createTestToken({ sub: 'test' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const claims = api.getClaims([])

      expect(claims).toEqual({})
    })
  })

  describe('getExpiry()', () => {
    it('should get expiry from kernel token', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = createTestToken({ exp })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const expiry = api.getExpiry()

      expect(expiry).toBeInstanceOf(Date)
      expect(expiry.getTime()).toBe(exp * 1000)
    })

    it('should get expiry from provided token', () => {
      const exp = Math.floor(Date.now() / 1000) + 7200
      const token = createTestToken({ exp })

      const expiry = api.getExpiry(token)

      expect(expiry).toBeInstanceOf(Date)
      expect(expiry.getTime()).toBe(exp * 1000)
    })

    it('should return null when token has no exp claim', () => {
      const token = createTestToken({ sub: 'test' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const expiry = api.getExpiry()

      expect(expiry).toBeNull()
    })

    it('should return null when no token', () => {
      mockKernel = createMockKernel(null)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.getExpiry()).toBeNull()
    })
  })

  describe('isExpired()', () => {
    it('should return false for non-expired token', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const token = createTestToken({ exp })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.isExpired()).toBe(false)
    })

    it('should return true for expired token', () => {
      const exp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const token = createTestToken({ exp })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.isExpired()).toBe(true)
    })

    it('should check provided token', () => {
      const expiredToken = createTestToken({ exp: Math.floor(Date.now() / 1000) - 100 })
      const validToken = createTestToken({ exp: Math.floor(Date.now() / 1000) + 100 })

      expect(api.isExpired(expiredToken)).toBe(true)
      expect(api.isExpired(validToken)).toBe(false)
    })

    it('should return true when no token', () => {
      mockKernel = createMockKernel(null)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.isExpired()).toBe(true)
    })

    it('should return false when token has no exp claim', () => {
      const token = createTestToken({ sub: 'test' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      // Token without exp is considered not expired
      expect(api.isExpired()).toBe(false)
    })
  })

  describe('getTokenInfo()', () => {
    it('should get complete token info from kernel', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = createTestToken({ sub: 'user-123', exp })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const info = api.getTokenInfo()

      expect(info).toBeDefined()
      expect(info.raw).toBe(token)
      expect(info.header).toBeDefined()
      expect(info.header.alg).toBe('HS256')
      expect(info.payload).toBeDefined()
      expect(info.payload.sub).toBe('user-123')
      expect(info.expiresAt).toBeInstanceOf(Date)
      expect(info.isExpired).toBe(false)
      expect(info.expiresIn).toBeGreaterThan(0)
    })

    it('should get info from provided token', () => {
      const token = createTestToken({ sub: 'user-456' })

      const info = api.getTokenInfo(token)

      expect(info).toBeDefined()
      expect(info.raw).toBe(token)
      expect(info.payload.sub).toBe('user-456')
    })

    it('should return null when no token', () => {
      mockKernel = createMockKernel(null)
      api = plugin.install(mockKernel as AuthKeeper)

      expect(api.getTokenInfo()).toBeNull()
    })

    it('should return null for invalid token', () => {
      expect(api.getTokenInfo('invalid')).toBeNull()
    })

    it('should handle token without expiry', () => {
      const token = createTestToken({ sub: 'test' })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const info = api.getTokenInfo()

      expect(info).toBeDefined()
      expect(info.expiresAt).toBeNull()
      expect(info.isExpired).toBe(false)
      expect(info.expiresIn).toBeNull()
    })

    it('should calculate expiresIn correctly', () => {
      const exp = Math.floor(Date.now() / 1000) + 7200 // 2 hours
      const token = createTestToken({ exp })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      const info = api.getTokenInfo()

      expect(info.expiresIn).toBeGreaterThan(7190 * 1000) // Allow small margin
      expect(info.expiresIn).toBeLessThanOrEqual(7200 * 1000)
    })

    it('should show isExpired correctly', () => {
      const expiredToken = createTestToken({ exp: Math.floor(Date.now() / 1000) - 100 })
      const validToken = createTestToken({ exp: Math.floor(Date.now() / 1000) + 100 })

      const expiredInfo = api.getTokenInfo(expiredToken)
      const validInfo = api.getTokenInfo(validToken)

      expect(expiredInfo?.isExpired).toBe(true)
      expect(expiredInfo?.expiresIn).toBe(0)

      expect(validInfo?.isExpired).toBe(false)
      expect(validInfo?.expiresIn).toBeGreaterThan(0)
    })
  })

  describe('uninstall()', () => {
    it('should not throw on uninstall', () => {
      expect(() => plugin.uninstall()).not.toThrow()
    })
  })

  describe('createTokenDecoderPlugin()', () => {
    it('should create plugin instance', () => {
      const created = createTokenDecoderPlugin()
      expect(created).toBeInstanceOf(TokenDecoderPlugin)
      expect(created.name).toBe('token-decoder')
    })
  })

  describe('integration scenarios', () => {
    it('should work with complete token workflow', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = createTestToken({
        sub: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        roles: ['admin', 'user'],
        exp,
      })
      mockKernel = createMockKernel(token)
      api = plugin.install(mockKernel as AuthKeeper)

      // Decode full payload
      const payload = api.decode()
      expect(payload.sub).toBe('user-123')
      expect(payload.roles).toEqual(['admin', 'user'])

      // Get specific claims
      expect(api.getClaim('email')).toBe('user@example.com')

      // Get multiple claims
      const claims = api.getClaims(['sub', 'name'])
      expect(claims).toEqual({
        sub: 'user-123',
        name: 'Test User',
      })

      // Check expiry
      expect(api.isExpired()).toBe(false)
      const expiry = api.getExpiry()
      expect(expiry?.getTime()).toBe(exp * 1000)

      // Get complete info
      const info = api.getTokenInfo()
      expect(info?.header.alg).toBe('HS256')
      expect(info?.payload.sub).toBe('user-123')
      expect(info?.isExpired).toBe(false)
    })

    it('should handle token switching', () => {
      const token1 = createTestToken({ sub: 'user-1' })
      const token2 = createTestToken({ sub: 'user-2' })

      // Use token1 from kernel
      mockKernel = createMockKernel(token1)
      api = plugin.install(mockKernel as AuthKeeper)
      expect(api.getClaim('sub')).toBe('user-1')

      // Use token2 explicitly
      expect(api.getClaim('sub', token2)).toBe('user-2')

      // Kernel token unchanged
      expect(api.getClaim('sub')).toBe('user-1')
    })

    it('should handle malformed tokens gracefully', () => {
      const malformed = [
        'not-a-token',
        'only.two.parts',
        'four.parts.not.allowed',
        '',
        'eyJ..invalid-base64',
      ]

      malformed.forEach((token) => {
        expect(api.decode(token)).toBeNull()
        expect(api.getHeader(token)).toBeNull()
        expect(api.getTokenInfo(token)).toBeNull()
      })
    })
  })
})
