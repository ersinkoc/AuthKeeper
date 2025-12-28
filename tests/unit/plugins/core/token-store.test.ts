/**
 * Tests for TokenStorePlugin
 */

import { vi } from 'vitest'
import { TokenStorePlugin, createTokenStorePlugin } from '../../../../src/plugins/core/token-store'
import type { AuthKeeper, TokenSet } from '../../../../src/types'

describe('TokenStorePlugin', () => {
  let plugin: TokenStorePlugin
  let mockKernel: AuthKeeper
  let api: any

  beforeEach(() => {
    plugin = new TokenStorePlugin()
    mockKernel = {} as AuthKeeper
    api = plugin.install(mockKernel)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.name).toBe('token-store')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.type).toBe('core')
    })
  })

  describe('install()', () => {
    it('should return API object', () => {
      expect(api).toBeDefined()
      expect(typeof api.set).toBe('function')
      expect(typeof api.get).toBe('function')
      expect(typeof api.clear).toBe('function')
      expect(typeof api.getAccessToken).toBe('function')
      expect(typeof api.getRefreshToken).toBe('function')
      expect(typeof api.getTokenType).toBe('function')
      expect(typeof api.getExpiresAt).toBe('function')
      expect(typeof api.getExpiresIn).toBe('function')
      expect(typeof api.isExpired).toBe('function')
      expect(typeof api.getSetAt).toBe('function')
      expect(typeof api.getRefreshCount).toBe('function')
    })
  })

  describe('set() and get()', () => {
    it('should store and retrieve tokens', () => {
      const tokens: TokenSet = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      }

      api.set(tokens)
      const stored = api.get()

      expect(stored).toBeDefined()
      expect(stored.accessToken).toBe('access-123')
      expect(stored.refreshToken).toBe('refresh-456')
    })

    it('should handle tokens without refreshToken', () => {
      const tokens: TokenSet = {
        accessToken: 'access-only',
      }

      api.set(tokens)
      const stored = api.get()

      expect(stored.accessToken).toBe('access-only')
      expect(stored.refreshToken).toBeNull()
    })

    it('should set default tokenType to Bearer', () => {
      api.set({ accessToken: 'test' })
      const stored = api.get()

      expect(stored.tokenType).toBe('Bearer')
    })

    it('should use custom tokenType if provided', () => {
      api.set({
        accessToken: 'test',
        tokenType: 'Custom',
      })

      const stored = api.get()
      expect(stored.tokenType).toBe('Custom')
    })

    it('should calculate expiresAt from expiresIn', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 3600, // 1 hour in seconds
      })

      const stored = api.get()
      expect(stored.expiresAt).toBe(now + 3600 * 1000)
    })

    it('should convert expiresAt from seconds to milliseconds', () => {
      const expiresAtSeconds = Math.floor(Date.now() / 1000) + 3600 // Unix timestamp in seconds

      api.set({
        accessToken: 'test',
        expiresAt: expiresAtSeconds,
      })

      const stored = api.get()
      expect(stored.expiresAt).toBe(expiresAtSeconds * 1000)
    })

    it('should prioritize expiresAt over expiresIn', () => {
      const expiresAtSeconds = Math.floor(Date.now() / 1000) + 7200

      api.set({
        accessToken: 'test',
        expiresAt: expiresAtSeconds,
        expiresIn: 3600, // Should be ignored
      })

      const stored = api.get()
      expect(stored.expiresAt).toBe(expiresAtSeconds * 1000)
    })

    it('should set expiresAt to null if neither expiresAt nor expiresIn provided', () => {
      api.set({ accessToken: 'test' })
      const stored = api.get()

      expect(stored.expiresAt).toBeNull()
    })

    it('should set setAt timestamp', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({ accessToken: 'test' })
      const stored = api.get()

      expect(stored.setAt).toBe(now)
    })

    it('should increment refreshCount on each set', () => {
      api.set({ accessToken: 'token1' })
      expect(api.get().refreshCount).toBe(1)

      api.set({ accessToken: 'token2' })
      expect(api.get().refreshCount).toBe(2)

      api.set({ accessToken: 'token3' })
      expect(api.get().refreshCount).toBe(3)
    })

    it('should reset refreshCount after clear', () => {
      api.set({ accessToken: 'token1' })
      api.set({ accessToken: 'token2' })
      expect(api.get().refreshCount).toBe(2)

      api.clear()
      api.set({ accessToken: 'token3' })
      expect(api.get().refreshCount).toBe(1)
    })
  })

  describe('clear()', () => {
    it('should clear all tokens', () => {
      api.set({ accessToken: 'test' })
      expect(api.get()).not.toBeNull()

      api.clear()
      expect(api.get()).toBeNull()
    })

    it('should make all getters return null/default after clear', () => {
      api.set({
        accessToken: 'test',
        refreshToken: 'refresh',
        expiresIn: 3600,
      })

      api.clear()

      expect(api.getAccessToken()).toBeNull()
      expect(api.getRefreshToken()).toBeNull()
      expect(api.getExpiresAt()).toBeNull()
      expect(api.getExpiresIn()).toBeNull()
      expect(api.getSetAt()).toBeNull()
      expect(api.getRefreshCount()).toBe(0)
    })
  })

  describe('getAccessToken()', () => {
    it('should return access token', () => {
      api.set({ accessToken: 'my-access-token' })
      expect(api.getAccessToken()).toBe('my-access-token')
    })

    it('should return null when no tokens', () => {
      expect(api.getAccessToken()).toBeNull()
    })
  })

  describe('getRefreshToken()', () => {
    it('should return refresh token', () => {
      api.set({
        accessToken: 'access',
        refreshToken: 'my-refresh-token',
      })
      expect(api.getRefreshToken()).toBe('my-refresh-token')
    })

    it('should return null when no refresh token', () => {
      api.set({ accessToken: 'access' })
      expect(api.getRefreshToken()).toBeNull()
    })
  })

  describe('getTokenType()', () => {
    it('should return token type', () => {
      api.set({
        accessToken: 'test',
        tokenType: 'Custom',
      })
      expect(api.getTokenType()).toBe('Custom')
    })

    it('should return Bearer as default', () => {
      api.set({ accessToken: 'test' })
      expect(api.getTokenType()).toBe('Bearer')
    })

    it('should return Bearer when no tokens', () => {
      expect(api.getTokenType()).toBe('Bearer')
    })
  })

  describe('getExpiresAt()', () => {
    it('should return expiry date', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 3600,
      })

      const expiresAt = api.getExpiresAt()
      expect(expiresAt).toBeInstanceOf(Date)
      expect(expiresAt?.getTime()).toBe(now + 3600 * 1000)
    })

    it('should return null when no expiry', () => {
      api.set({ accessToken: 'test' })
      expect(api.getExpiresAt()).toBeNull()
    })

    it('should return null when no tokens', () => {
      expect(api.getExpiresAt()).toBeNull()
    })
  })

  describe('getExpiresIn()', () => {
    it('should return time until expiry in milliseconds', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 3600,
      })

      expect(api.getExpiresIn()).toBe(3600 * 1000)
    })

    it('should return 0 for already expired token', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 10,
      })

      // Advance time past expiry
      vi.setSystemTime(now + 20 * 1000)

      expect(api.getExpiresIn()).toBe(0)
    })

    it('should return null when no expiry', () => {
      api.set({ accessToken: 'test' })
      expect(api.getExpiresIn()).toBeNull()
    })

    it('should return null when no tokens', () => {
      expect(api.getExpiresIn()).toBeNull()
    })

    it('should update as time passes', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 3600,
      })

      expect(api.getExpiresIn()).toBe(3600 * 1000)

      // Advance 30 minutes
      vi.setSystemTime(now + 30 * 60 * 1000)

      expect(api.getExpiresIn()).toBe(30 * 60 * 1000)
    })
  })

  describe('isExpired()', () => {
    it('should return false for non-expired token', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 3600,
      })

      expect(api.isExpired()).toBe(false)
    })

    it('should return true for expired token', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 10,
      })

      // Advance past expiry
      vi.setSystemTime(now + 20 * 1000)

      expect(api.isExpired()).toBe(true)
    })

    it('should return false when no expiry', () => {
      api.set({ accessToken: 'test' })
      expect(api.isExpired()).toBe(false)
    })

    it('should return false when no tokens', () => {
      expect(api.isExpired()).toBe(false)
    })

    it('should return true at exact expiry time', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'test',
        expiresIn: 3600,
      })

      // Advance to exact expiry
      vi.setSystemTime(now + 3600 * 1000)

      expect(api.isExpired()).toBe(true)
    })
  })

  describe('getSetAt()', () => {
    it('should return when tokens were set', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({ accessToken: 'test' })

      const setAt = api.getSetAt()
      expect(setAt).toBeInstanceOf(Date)
      expect(setAt?.getTime()).toBe(now)
    })

    it('should return null when no tokens', () => {
      expect(api.getSetAt()).toBeNull()
    })

    it('should update when tokens are refreshed', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({ accessToken: 'token1' })
      expect(api.getSetAt()?.getTime()).toBe(now)

      // Advance time
      vi.setSystemTime(now + 1000)

      api.set({ accessToken: 'token2' })
      expect(api.getSetAt()?.getTime()).toBe(now + 1000)
    })
  })

  describe('getRefreshCount()', () => {
    it('should return 0 when no tokens', () => {
      expect(api.getRefreshCount()).toBe(0)
    })

    it('should return 1 for first set', () => {
      api.set({ accessToken: 'test' })
      expect(api.getRefreshCount()).toBe(1)
    })

    it('should increment on each refresh', () => {
      api.set({ accessToken: 'token1' })
      expect(api.getRefreshCount()).toBe(1)

      api.set({ accessToken: 'token2' })
      expect(api.getRefreshCount()).toBe(2)

      api.set({ accessToken: 'token3' })
      expect(api.getRefreshCount()).toBe(3)
    })
  })

  describe('callbacks', () => {
    it('should call onSet callback when tokens are set', () => {
      const onSet = vi.fn()
      const pluginWithCallback = new TokenStorePlugin({ onSet })
      const callbackApi = pluginWithCallback.install(mockKernel)

      callbackApi.set({ accessToken: 'test' })

      expect(onSet).toHaveBeenCalledTimes(1)
      expect(onSet).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'test',
        })
      )
    })

    it('should call onClear callback when tokens are cleared', () => {
      const onClear = vi.fn()
      const pluginWithCallback = new TokenStorePlugin({ onClear })
      const callbackApi = pluginWithCallback.install(mockKernel)

      callbackApi.set({ accessToken: 'test' })
      callbackApi.clear()

      expect(onClear).toHaveBeenCalledTimes(1)
    })

    it('should not throw if callbacks are not provided', () => {
      expect(() => {
        api.set({ accessToken: 'test' })
        api.clear()
      }).not.toThrow()
    })
  })

  describe('uninstall()', () => {
    it('should clear tokens on uninstall', () => {
      api.set({ accessToken: 'test' })
      expect(api.get()).not.toBeNull()

      plugin.uninstall()

      expect(api.get()).toBeNull()
    })

    it('should call onClear callback on uninstall', () => {
      const onClear = vi.fn()
      const pluginWithCallback = new TokenStorePlugin({ onClear })
      pluginWithCallback.install(mockKernel)

      pluginWithCallback.uninstall()

      expect(onClear).toHaveBeenCalled()
    })
  })

  describe('createTokenStorePlugin()', () => {
    it('should create plugin instance', () => {
      const created = createTokenStorePlugin()
      expect(created).toBeInstanceOf(TokenStorePlugin)
      expect(created.name).toBe('token-store')
    })

    it('should pass options to plugin', () => {
      const onSet = vi.fn()
      const created = createTokenStorePlugin({ onSet })
      const createdApi = created.install(mockKernel)

      createdApi.set({ accessToken: 'test' })

      expect(onSet).toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete token lifecycle', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      // Initial set
      api.set({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresIn: 3600,
      })

      expect(api.getAccessToken()).toBe('access-1')
      expect(api.getRefreshCount()).toBe(1)
      expect(api.isExpired()).toBe(false)

      // Advance time
      vi.setSystemTime(now + 1800 * 1000) // 30 minutes

      expect(api.isExpired()).toBe(false)
      expect(api.getExpiresIn()).toBe(1800 * 1000)

      // Refresh tokens
      api.set({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        expiresIn: 3600,
      })

      expect(api.getAccessToken()).toBe('access-2')
      expect(api.getRefreshCount()).toBe(2)

      // Clear
      api.clear()

      expect(api.getAccessToken()).toBeNull()
      expect(api.getRefreshCount()).toBe(0)
    })

    it('should handle token expiry correctly', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      api.set({
        accessToken: 'expiring-token',
        expiresIn: 60, // 1 minute
      })

      // Not expired yet
      expect(api.isExpired()).toBe(false)
      expect(api.getExpiresIn()).toBe(60 * 1000)

      // Advance to 30 seconds
      vi.setSystemTime(now + 30 * 1000)
      expect(api.isExpired()).toBe(false)
      expect(api.getExpiresIn()).toBe(30 * 1000)

      // Advance to 59 seconds
      vi.setSystemTime(now + 59 * 1000)
      expect(api.isExpired()).toBe(false)
      expect(api.getExpiresIn()).toBe(1000)

      // Advance to exact expiry
      vi.setSystemTime(now + 60 * 1000)
      expect(api.isExpired()).toBe(true)
      expect(api.getExpiresIn()).toBe(0)

      // Past expiry
      vi.setSystemTime(now + 120 * 1000)
      expect(api.isExpired()).toBe(true)
      expect(api.getExpiresIn()).toBe(0)
    })
  })
})
