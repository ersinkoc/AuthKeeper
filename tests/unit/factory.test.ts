/**
 * Tests for factory function
 */

import { vi } from 'vitest'
import { createAuthKeeper } from '../../src/factory'
import type { KernelOptions, RefreshTokenFn } from '../../src/types'

describe('createAuthKeeper()', () => {
  let mockRefreshToken: RefreshTokenFn

  beforeEach(() => {
    vi.useFakeTimers()
    mockRefreshToken = vi.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should create AuthKeeper instance', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    expect(auth).toBeDefined()
    expect(typeof auth.init).toBe('function')
    expect(typeof auth.setTokens).toBe('function')
    expect(typeof auth.getAccessToken).toBe('function')
    expect(typeof auth.refresh).toBe('function')
  })

  it('should register core plugins', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    // Check that core plugins are registered
    const plugins = auth.listPlugins()
    const pluginNames = plugins.map((p) => p.name)

    expect(pluginNames).toContain('token-store')
    expect(pluginNames).toContain('token-decoder')
    expect(pluginNames).toContain('refresh-engine')
    expect(pluginNames).toContain('fetch-interceptor')
  })

  it('should handle token operations', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    // Set tokens
    auth.setTokens({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    })

    // Get tokens
    expect(auth.getAccessToken()).toBe('test-access-token')
    expect(auth.getRefreshToken()).toBe('test-refresh-token')

    // Clear tokens
    auth.clearTokens()

    expect(auth.getAccessToken()).toBeNull()
    expect(auth.getRefreshToken()).toBeNull()
  })

  it('should support authentication status checks', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    // Initially not authenticated
    expect(auth.isAuthenticated()).toBe(false)

    // Set tokens
    auth.setTokens({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
    })

    // Now authenticated
    expect(auth.isAuthenticated()).toBe(true)
  })

  it('should handle token expiry checks', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    // Set token with expiry using expiresIn (seconds) instead of expiresAt
    auth.setTokens({
      accessToken: 'test-token',
      expiresIn: 3600, // 1 hour from now
    })

    expect(auth.isExpired()).toBe(false)

    // Check expiry date exists and is in the future
    const storedExpiry = auth.getExpiresAt()
    expect(storedExpiry).toBeTruthy()
    expect(storedExpiry!.getTime()).toBeGreaterThan(Date.now())

    expect(auth.getTimeUntilExpiry()).toBeGreaterThan(0)
  })

  it('should support refresh operation', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    // Set initial tokens
    auth.setTokens({
      accessToken: 'old-token',
      refreshToken: 'old-refresh',
    })

    // Refresh
    await auth.refresh()
    await vi.runAllTimersAsync()

    // Should have new tokens
    expect(mockRefreshToken).toHaveBeenCalledWith('old-refresh')
    expect(auth.getAccessToken()).toBe('new-access-token')
    expect(auth.getRefreshToken()).toBe('new-refresh-token')
  })

  it('should emit events', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    const handler = vi.fn()
    // Listen for 'login' event which is emitted when tokens are set
    auth.on('login', handler)

    auth.setTokens({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
    })

    // Events are emitted on next tick, advance timers
    await vi.runAllTimersAsync()

    // Check that login event was emitted
    expect(handler).toHaveBeenCalled()
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'login',
    })
  })

  it('should support logout', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    // Set tokens
    auth.setTokens({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
    })

    expect(auth.isAuthenticated()).toBe(true)

    // Logout
    auth.logout()

    expect(auth.isAuthenticated()).toBe(false)
    expect(auth.getAccessToken()).toBeNull()
  })

  it('should support createFetch', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    const authFetch = auth.createFetch()

    expect(typeof authFetch).toBe('function')
  })

  it('should support additional plugin registration', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
    }

    const auth = await createAuthKeeper(options)

    const initialCount = auth.listPlugins().length

    // Register custom plugin
    const customPlugin = {
      name: 'custom-plugin',
      version: '1.0.0',
      type: 'custom' as const,
      install: vi.fn().mockReturnValue({ test: () => 'works' }),
      uninstall: vi.fn(),
    }

    await auth.register(customPlugin)

    expect(auth.listPlugins().length).toBe(initialCount + 1)
    expect(auth.listPlugins().some((p) => p.name === 'custom-plugin')).toBe(true)
  })

  it('should pass refreshToken to kernel', async () => {
    const customRefreshFn = vi.fn().mockResolvedValue({
      accessToken: 'custom-token',
    })

    const options: KernelOptions = {
      refreshToken: customRefreshFn,
    }

    const auth = await createAuthKeeper(options)

    auth.setTokens({
      accessToken: 'old',
      refreshToken: 'old-refresh',
    })

    await auth.refresh()
    await vi.runAllTimersAsync()

    expect(customRefreshFn).toHaveBeenCalledWith('old-refresh')
  })

  it('should pass configuration options', async () => {
    const options: KernelOptions = {
      refreshToken: mockRefreshToken,
      refreshThreshold: 120,
    }

    const auth = await createAuthKeeper(options)

    const config = auth.getOptions()
    expect(config.refreshThreshold).toBe(120)
    expect(config.refreshToken).toBe(mockRefreshToken)
  })

  describe('integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      const options: KernelOptions = {
        refreshToken: mockRefreshToken,
      }

      const auth = await createAuthKeeper(options)

      // 1. Not authenticated initially
      expect(auth.isAuthenticated()).toBe(false)

      // 2. Set tokens
      auth.setTokens({
        accessToken: 'initial-access',
        refreshToken: 'initial-refresh',
        expiresIn: 3600,
      })

      expect(auth.isAuthenticated()).toBe(true)
      expect(auth.getAccessToken()).toBe('initial-access')

      // 3. Refresh tokens
      mockRefreshToken.mockResolvedValueOnce({
        accessToken: 'refreshed-access',
        refreshToken: 'refreshed-refresh',
      })

      await auth.refresh()
      await vi.runAllTimersAsync()

      expect(auth.getAccessToken()).toBe('refreshed-access')

      // 4. Logout
      auth.logout()

      expect(auth.isAuthenticated()).toBe(false)
    })

    it('should handle all core plugins working together', async () => {
      const options: KernelOptions = {
        refreshToken: mockRefreshToken,
      }

      const auth = await createAuthKeeper(options)

      // All core plugins should be registered and installed
      const plugins = auth.listPlugins()
      expect(plugins.length).toBe(4)

      // token-store: manages token state
      auth.setTokens({ accessToken: 'test' })
      expect(auth.getAccessToken()).toBe('test')

      // refresh-engine: handles refresh (tested above)
      // fetch-interceptor: creates auth fetch
      const authFetch = auth.createFetch()
      expect(typeof authFetch).toBe('function')

      // All working together
      expect(auth.isAuthenticated()).toBe(true)
    })
  })
})
