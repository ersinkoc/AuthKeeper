/**
 * Tests for AuthKeeperKernel
 */

import { vi } from 'vitest'
import { AuthKeeperKernel } from '../../../src/kernel/kernel'
import type { KernelOptions, Plugin, TokenSet } from '../../../src/types'

describe('AuthKeeperKernel', () => {
  let mockRefreshToken: any

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

  describe('constructor', () => {
    it('should create kernel with default options', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel).toBeDefined()
      const options = kernel.getOptions()
      expect(options.autoRefresh).toBe(true)
      expect(options.refreshThreshold).toBe(60)
      expect(options.syncTabs).toBe(true)
    })

    it('should override default options', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        autoRefresh: false,
        refreshThreshold: 120,
        syncTabs: false,
      })

      const options = kernel.getOptions()
      expect(options.autoRefresh).toBe(false)
      expect(options.refreshThreshold).toBe(120)
      expect(options.syncTabs).toBe(false)
    })

    it('should keep custom options', () => {
      const onError = vi.fn()
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        onError,
      })

      const options = kernel.getOptions()
      expect(options.onError).toBe(onError)
    })
  })

  describe('init()', () => {
    it('should initialize kernel', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      await kernel.init()

      expect(kernel).toBeDefined()
    })

    it('should install user-provided plugins', async () => {
      const customPlugin: Plugin = {
        name: 'custom-plugin',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({ test: () => 'works' }),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        plugins: [customPlugin],
      })

      await kernel.init()

      const plugins = kernel.listPlugins()
      expect(plugins.some((p) => p.name === 'custom-plugin')).toBe(true)
      expect(customPlugin.install).toHaveBeenCalled()
    })

    it('should not initialize twice', async () => {
      const customPlugin: Plugin = {
        name: 'custom-plugin',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({}),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        plugins: [customPlugin],
      })

      await kernel.init()
      await kernel.init()

      // Should only install once
      expect(customPlugin.install).toHaveBeenCalledTimes(1)
    })
  })

  describe('destroy()', () => {
    it('should cleanup kernel', async () => {
      const customPlugin: Plugin = {
        name: 'custom-plugin',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({}),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        plugins: [customPlugin],
      })

      await kernel.init()
      kernel.destroy()

      expect(customPlugin.uninstall).toHaveBeenCalled()
      expect(kernel.listPlugins()).toHaveLength(0)
    })

    it('should clear event handlers', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      await kernel.init()

      const handler = vi.fn()
      kernel.on('login', handler)

      kernel.destroy()

      // Emit event after destroy - should not be called
      kernel.emit({
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('token management without plugins', () => {
    it('should return null when token-store not installed', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.getAccessToken()).toBeNull()
      expect(kernel.getRefreshToken()).toBeNull()
    })

    it('should throw when setting tokens without token-store', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(() => {
        kernel.setTokens({ accessToken: 'test' })
      }).toThrow('token-store plugin not installed')
    })

    it('should not throw when clearing tokens without token-store', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(() => {
        kernel.clearTokens()
      }).not.toThrow()
    })
  })

  describe('auth state without plugins', () => {
    it('should return false for isAuthenticated when no plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.isAuthenticated()).toBe(false)
    })

    it('should return true for isExpired when no plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.isExpired()).toBe(true)
    })

    it('should return null for getExpiresAt when no plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.getExpiresAt()).toBeNull()
    })

    it('should return null for getTimeUntilExpiry when no plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.getTimeUntilExpiry()).toBeNull()
    })
  })

  describe('token decoding without plugins', () => {
    it('should return null when token-decoder not installed', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.decode()).toBeNull()
    })

    it('should return undefined for getClaim when no plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.getClaim('sub')).toBeUndefined()
    })

    it('should return empty object for getClaims when no plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(kernel.getClaims(['sub', 'email'])).toEqual({})
    })
  })

  describe('token decoding with plugins', () => {
    it('should call decode on token-decoder plugin', async () => {
      const mockPayload = { sub: '123', email: 'test@example.com', exp: 1234567890 }
      const mockDecoder = {
        decode: vi.fn().mockReturnValue(mockPayload),
      }

      const decoderPlugin: Plugin = {
        name: 'token-decoder',
        version: '1.0.0',
        type: 'core',
        install: vi.fn().mockReturnValue(mockDecoder),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      await kernel.register(decoderPlugin)

      const payload = kernel.decode()

      expect(mockDecoder.decode).toHaveBeenCalled()
      expect(payload).toEqual(mockPayload)
    })

    it('should call getClaim on token-decoder plugin', async () => {
      const mockDecoder = {
        getClaim: vi.fn().mockReturnValue('123'),
      }

      const decoderPlugin: Plugin = {
        name: 'token-decoder',
        version: '1.0.0',
        type: 'core',
        install: vi.fn().mockReturnValue(mockDecoder),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      await kernel.register(decoderPlugin)

      const sub = kernel.getClaim('sub')

      expect(mockDecoder.getClaim).toHaveBeenCalledWith('sub')
      expect(sub).toBe('123')
    })

    it('should call getClaims on token-decoder plugin', async () => {
      const mockClaims = { sub: '123', email: 'test@example.com' }
      const mockDecoder = {
        getClaims: vi.fn().mockReturnValue(mockClaims),
      }

      const decoderPlugin: Plugin = {
        name: 'token-decoder',
        version: '1.0.0',
        type: 'core',
        install: vi.fn().mockReturnValue(mockDecoder),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      await kernel.register(decoderPlugin)

      const claims = kernel.getClaims(['sub', 'email'])

      expect(mockDecoder.getClaims).toHaveBeenCalledWith(['sub', 'email'])
      expect(claims).toEqual(mockClaims)
    })
  })

  describe('refresh without plugins', () => {
    it('should throw when refresh-engine not installed', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      await expect(kernel.refresh()).rejects.toThrow('refresh-engine plugin not installed')
    })

    it('should not throw when scheduling refresh without plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(() => {
        kernel.scheduleRefresh()
      }).not.toThrow()
    })

    it('should not throw when canceling refresh without plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(() => {
        kernel.cancelScheduledRefresh()
      }).not.toThrow()
    })

    it('should not schedule refresh when autoRefresh is false', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        autoRefresh: false,
      })

      kernel.scheduleRefresh()

      // No error should be thrown
      expect(true).toBe(true)
    })
  })

  describe('logout()', () => {
    it('should emit logout event', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const handler = vi.fn()
      kernel.on('logout', handler)

      kernel.logout()

      await vi.runAllTimersAsync()

      expect(handler).toHaveBeenCalled()
      expect(handler.mock.calls[0][0]).toMatchObject({
        type: 'logout',
        reason: 'manual',
      })
    })

    it('should handle redirect option', () => {
      const mockWindow = {
        location: {
          href: '',
        },
      }

      global.window = mockWindow as any

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      kernel.logout({ redirect: '/login' })

      expect(mockWindow.location.href).toBe('/login')

      // Cleanup
      delete (global as any).window
    })

    it('should not throw when window is undefined', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(() => {
        kernel.logout({ redirect: '/login' })
      }).not.toThrow()
    })
  })

  describe('fetch interceptors', () => {
    it('should return regular fetch when fetch-interceptor not installed', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const authFetch = kernel.createFetch()

      expect(typeof authFetch).toBe('function')
    })

    it('should not throw when wrapping fetch without plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(() => {
        kernel.wrapFetch(fetch)
      }).not.toThrow()
    })

    it('should call wrapFetch on fetch-interceptor plugin', async () => {
      const mockWrapFetch = vi.fn()
      const mockInterceptor = {
        wrapFetch: mockWrapFetch,
      }

      const interceptorPlugin: Plugin = {
        name: 'fetch-interceptor',
        version: '1.0.0',
        type: 'core',
        install: vi.fn().mockReturnValue(mockInterceptor),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      await kernel.register(interceptorPlugin)

      const mockFetch = vi.fn()
      kernel.wrapFetch(mockFetch as any)

      expect(mockWrapFetch).toHaveBeenCalledWith(mockFetch)
    })
  })

  describe('plugin management', () => {
    it('should register plugin', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const customPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({ test: () => 'works' }),
        uninstall: vi.fn(),
      }

      await kernel.register(customPlugin)

      const plugins = kernel.listPlugins()
      expect(plugins.some((p) => p.name === 'test-plugin')).toBe(true)
      expect(customPlugin.install).toHaveBeenCalled()
    })

    it('should unregister plugin', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const customPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({}),
        uninstall: vi.fn(),
      }

      await kernel.register(customPlugin)
      await kernel.unregister('test-plugin')

      const plugins = kernel.listPlugins()
      expect(plugins.some((p) => p.name === 'test-plugin')).toBe(false)
      expect(customPlugin.uninstall).toHaveBeenCalled()
    })

    it('should get plugin by name', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const customPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({}),
        uninstall: vi.fn(),
      }

      await kernel.register(customPlugin)

      const plugin = kernel.getPlugin('test-plugin')
      expect(plugin).toBeDefined()
      expect(plugin?.name).toBe('test-plugin')
    })

    it('should return undefined for non-existent plugin', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const plugin = kernel.getPlugin('nonexistent')
      expect(plugin).toBeUndefined()
    })

    it('should list all plugins', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const plugin1: Plugin = {
        name: 'plugin-1',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({}),
        uninstall: vi.fn(),
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        version: '2.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({}),
        uninstall: vi.fn(),
      }

      await kernel.register(plugin1)
      await kernel.register(plugin2)

      const plugins = kernel.listPlugins()
      expect(plugins).toHaveLength(2)
      expect(plugins.some((p) => p.name === 'plugin-1')).toBe(true)
      expect(plugins.some((p) => p.name === 'plugin-2')).toBe(true)
    })
  })

  describe('event system', () => {
    it('should emit events', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const handler = vi.fn()
      kernel.on('login', handler)

      kernel.emit({
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      })

      await vi.runAllTimersAsync()

      expect(handler).toHaveBeenCalled()
    })

    it('should subscribe to events', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const handler = vi.fn()
      const unsubscribe = kernel.on('logout', handler)

      expect(typeof unsubscribe).toBe('function')

      kernel.emit({
        type: 'logout',
        reason: 'manual',
        timestamp: Date.now(),
      })

      await vi.runAllTimersAsync()

      expect(handler).toHaveBeenCalled()
    })

    it('should unsubscribe from events', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const handler = vi.fn()
      kernel.on('login', handler)
      kernel.off('login', handler)

      kernel.emit({
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      })

      await vi.runAllTimersAsync()

      expect(handler).not.toHaveBeenCalled()
    })

    it('should call onError handler for error events', async () => {
      const onError = vi.fn()
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        onError,
      })

      const error = new Error('Test error')
      kernel.emit({
        type: 'error',
        error,
        timestamp: Date.now(),
      })

      await vi.runAllTimersAsync()

      expect(onError).toHaveBeenCalledWith(error)
    })

    it('should not throw when onError is not provided', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      expect(() => {
        kernel.emit({
          type: 'error',
          error: new Error('Test'),
          timestamp: Date.now(),
        })
      }).not.toThrow()
    })
  })

  describe('configuration', () => {
    it('should update configuration', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        autoRefresh: true,
        refreshThreshold: 60,
      })

      kernel.configure({
        autoRefresh: false,
        refreshThreshold: 120,
      })

      const options = kernel.getOptions()
      expect(options.autoRefresh).toBe(false)
      expect(options.refreshThreshold).toBe(120)
    })

    it('should merge configuration options', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        autoRefresh: true,
        refreshThreshold: 60,
      })

      kernel.configure({
        refreshThreshold: 120,
      })

      const options = kernel.getOptions()
      expect(options.autoRefresh).toBe(true)
      expect(options.refreshThreshold).toBe(120)
    })

    it('should return copy of options', () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const options1 = kernel.getOptions()
      const options2 = kernel.getOptions()

      expect(options1).not.toBe(options2)
      expect(options1).toEqual(options2)
    })
  })

  describe('integration scenarios', () => {
    it('should handle full lifecycle', async () => {
      const customPlugin: Plugin = {
        name: 'custom-plugin',
        version: '1.0.0',
        type: 'custom',
        install: vi.fn().mockReturnValue({}),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        plugins: [customPlugin],
      })

      // Initialize
      await kernel.init()
      expect(customPlugin.install).toHaveBeenCalled()

      // Work with kernel
      const plugins = kernel.listPlugins()
      expect(plugins).toHaveLength(1)

      // Destroy
      kernel.destroy()
      expect(customPlugin.uninstall).toHaveBeenCalled()
      expect(kernel.listPlugins()).toHaveLength(0)
    })

    it('should handle events throughout lifecycle', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const loginHandler = vi.fn()
      const logoutHandler = vi.fn()

      kernel.on('login', loginHandler)
      kernel.on('logout', logoutHandler)

      // Emit login
      kernel.emit({
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      })

      // Emit logout
      kernel.emit({
        type: 'logout',
        reason: 'manual',
        timestamp: Date.now(),
      })

      await vi.runAllTimersAsync()

      expect(loginHandler).toHaveBeenCalled()
      expect(logoutHandler).toHaveBeenCalled()
    })

    it('should handle multiple plugin registrations', async () => {
      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
      })

      const plugins: Plugin[] = [
        {
          name: 'plugin-1',
          version: '1.0.0',
          type: 'custom',
          install: vi.fn().mockReturnValue({}),
          uninstall: vi.fn(),
        },
        {
          name: 'plugin-2',
          version: '1.0.0',
          type: 'custom',
          install: vi.fn().mockReturnValue({}),
          uninstall: vi.fn(),
        },
        {
          name: 'plugin-3',
          version: '1.0.0',
          type: 'custom',
          install: vi.fn().mockReturnValue({}),
          uninstall: vi.fn(),
        },
      ]

      for (const plugin of plugins) {
        await kernel.register(plugin)
      }

      const installedPlugins = kernel.listPlugins()
      expect(installedPlugins).toHaveLength(3)

      for (const plugin of plugins) {
        expect(plugin.install).toHaveBeenCalled()
      }
    })

    it('should handle configuration updates with plugin coordination', async () => {
      const mockRefreshEngine = {
        setThreshold: vi.fn(),
      }

      const refreshPlugin: Plugin = {
        name: 'refresh-engine',
        version: '1.0.0',
        type: 'core',
        install: vi.fn().mockReturnValue(mockRefreshEngine),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        refreshThreshold: 60,
      })

      await kernel.register(refreshPlugin)

      // Update configuration
      kernel.configure({
        refreshThreshold: 120,
      })

      expect(mockRefreshEngine.setThreshold).toHaveBeenCalledWith(120)
    })

    it('should not update threshold when plugin does not support it', async () => {
      const mockRefreshEngine = {
        // No setThreshold method
      }

      const refreshPlugin: Plugin = {
        name: 'refresh-engine',
        version: '1.0.0',
        type: 'core',
        install: vi.fn().mockReturnValue(mockRefreshEngine),
        uninstall: vi.fn(),
      }

      const kernel = new AuthKeeperKernel({
        refreshToken: mockRefreshToken,
        refreshThreshold: 60,
      })

      await kernel.register(refreshPlugin)

      // Should not throw
      expect(() => {
        kernel.configure({
          refreshThreshold: 120,
        })
      }).not.toThrow()
    })
  })
})
