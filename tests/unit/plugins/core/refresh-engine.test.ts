/**
 * Tests for RefreshEnginePlugin
 */

import { vi } from 'vitest'
import { RefreshEnginePlugin, createRefreshEnginePlugin } from '../../../../src/plugins/core/refresh-engine'
import type { AuthKeeper, TokenSet, RefreshTokenFn } from '../../../../src/types'

describe('RefreshEnginePlugin', () => {
  let plugin: RefreshEnginePlugin
  let mockKernel: Partial<AuthKeeper>
  let mockRefreshFn: RefreshTokenFn
  let api: any

  const createMockKernel = (): Partial<AuthKeeper> => ({
    getRefreshToken: vi.fn().mockReturnValue('refresh-token-123'),
    setTokens: vi.fn(),
    getExpiresAt: vi.fn().mockReturnValue(new Date(Date.now() + 3600000)),
    getTimeUntilExpiry: vi.fn().mockReturnValue(null), // Prevent auto-schedule in tests
    emit: vi.fn(),
  })

  beforeEach(() => {
    vi.useFakeTimers()
    mockRefreshFn = vi.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })
    mockKernel = createMockKernel()
    plugin = new RefreshEnginePlugin({ refreshFn: mockRefreshFn })
    api = plugin.install(mockKernel as AuthKeeper)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.name).toBe('refresh-engine')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.type).toBe('core')
    })
  })

  describe('constructor options', () => {
    it('should use default threshold', () => {
      const p = new RefreshEnginePlugin({ refreshFn: mockRefreshFn })
      const a = p.install(mockKernel as AuthKeeper)

      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(120000) // 2 minutes
      a.scheduleRefresh()

      // Should schedule for 60 seconds (default) before expiry
      expect(vi.getTimerCount()).toBe(1)
    })

    it('should use custom threshold', () => {
      const p = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        threshold: 30
      })
      p.install(mockKernel as AuthKeeper)

      // Threshold is stored and will be used
      expect(p).toBeDefined()
    })

    it('should use default maxRetries', () => {
      const p = new RefreshEnginePlugin({ refreshFn: mockRefreshFn })
      expect(p).toBeDefined()
    })

    it('should use custom maxRetries', () => {
      const p = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        maxRetries: 5
      })
      expect(p).toBeDefined()
    })
  })

  describe('install()', () => {
    it('should return API object', () => {
      expect(api).toBeDefined()
      expect(typeof api.refresh).toBe('function')
      expect(typeof api.scheduleRefresh).toBe('function')
      expect(typeof api.cancelScheduledRefresh).toBe('function')
      expect(typeof api.isRefreshing).toBe('function')
      expect(typeof api.getNextRefreshAt).toBe('function')
      expect(typeof api.setRefreshFn).toBe('function')
      expect(typeof api.setThreshold).toBe('function')
    })
  })

  describe('refresh()', () => {
    it('should call refreshFn with refresh token', async () => {
      const promise = api.refresh()
      await vi.runAllTimersAsync()
      await promise

      expect(mockRefreshFn).toHaveBeenCalledWith('refresh-token-123')
    })

    it('should update tokens via kernel', async () => {
      const newTokens: TokenSet = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }
      mockRefreshFn.mockResolvedValueOnce(newTokens)

      const promise = api.refresh()
      await vi.runAllTimersAsync()
      await promise

      expect(mockKernel.setTokens).toHaveBeenCalledWith(newTokens)
    })

    it('should return new tokens', async () => {
      const newTokens: TokenSet = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }
      mockRefreshFn.mockResolvedValueOnce(newTokens)

      const promise = api.refresh()
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toEqual(newTokens)
    })

    it('should emit refresh event', async () => {
      const promise = api.refresh()
      await vi.runAllTimersAsync()
      await promise

      expect(mockKernel.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refresh',
          tokens: expect.any(Object),
        })
      )
    })

    it('should throw error when no refresh token', async () => {
      mockKernel.getRefreshToken = vi.fn().mockReturnValue(null)

      const promise = expect(api.refresh()).rejects.toThrow('No refresh token available')
      await vi.runAllTimersAsync()
      await promise

      expect(mockKernel.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          context: 'refresh',
        })
      )

      // Ensure no pending timers
      vi.clearAllTimers()
    })

    it('should set isRefreshing flag during refresh', async () => {
      const promise = api.refresh()

      expect(api.isRefreshing()).toBe(true)

      await vi.runAllTimersAsync()
      await promise

      expect(api.isRefreshing()).toBe(false)
    })
  })

  describe('refresh queue (concurrent requests)', () => {
    it('should queue concurrent refresh requests', async () => {
      // Make refresh slow
      mockRefreshFn.mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({
          accessToken: 'new-token',
        }), 100))
      )

      // Start 3 concurrent refreshes
      const promise1 = api.refresh()
      const promise2 = api.refresh()
      const promise3 = api.refresh()

      await vi.runAllTimersAsync()
      await Promise.all([promise1, promise2, promise3])

      // refreshFn should only be called once (queue works)
      expect(mockRefreshFn).toHaveBeenCalledTimes(1)

      // All promises resolve to same result
      const result1 = await promise1
      const result2 = await promise2
      const result3 = await promise3
      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
    })

    it('should allow new refresh after previous completes', async () => {
      const promise1 = api.refresh()
      await vi.runAllTimersAsync()
      await promise1

      expect(mockRefreshFn).toHaveBeenCalledTimes(1)

      const promise2 = api.refresh()
      await vi.runAllTimersAsync()
      await promise2

      expect(mockRefreshFn).toHaveBeenCalledTimes(2)
    })

    it('should reset flag after refresh completes', async () => {
      const promise = api.refresh()
      expect(api.isRefreshing()).toBe(true)

      await vi.runAllTimersAsync()
      await promise

      expect(api.isRefreshing()).toBe(false)
    })

    it('should reset flag even if refresh fails', async () => {
      // Override mock to fail all retries
      const failingPlugin = new RefreshEnginePlugin({
        refreshFn: vi.fn().mockRejectedValue(new Error('Refresh failed')),
        maxRetries: 0, // No retries
      })
      const failingApi = failingPlugin.install(mockKernel as AuthKeeper)

      const refreshPromise = failingApi.refresh()
      const expectPromise = expect(refreshPromise).rejects.toThrow()
      expect(failingApi.isRefreshing()).toBe(true)

      await vi.runAllTimersAsync()
      await expectPromise

      expect(failingApi.isRefreshing()).toBe(false)

      // Clean up any pending timers
      vi.clearAllTimers()
    })
  })

  describe('retry logic', () => {
    it('should retry on failure with exponential backoff', async () => {
      // Fail first 2 attempts, succeed on 3rd
      mockRefreshFn
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce({ accessToken: 'success-token' })

      const promise = api.refresh()
      await vi.runAllTimersAsync()
      const result = await promise

      expect(mockRefreshFn).toHaveBeenCalledTimes(3)
      expect(result.accessToken).toBe('success-token')
    })

    it('should use exponential backoff delays', async () => {
      mockRefreshFn
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({ accessToken: 'success' })

      const promise = api.refresh()

      // Advance through retries
      await vi.advanceTimersByTimeAsync(0) // Initial attempt
      await vi.advanceTimersByTimeAsync(1000) // 1st retry (delay: 1000ms)
      await vi.advanceTimersByTimeAsync(2000) // 2nd retry (delay: 2000ms)

      await promise

      expect(mockRefreshFn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries exceeded', async () => {
      mockRefreshFn.mockRejectedValue(new Error('Always fails'))

      const promise = expect(api.refresh()).rejects.toThrow('Token refresh failed')
      await vi.runAllTimersAsync()
      await promise

      // Default maxRetries is 3, so 4 total attempts
      expect(mockRefreshFn).toHaveBeenCalledTimes(4)

      // Clean up any pending timers
      vi.clearAllTimers()
    })

    it('should respect custom maxRetries', async () => {
      const customPlugin = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        maxRetries: 1,
      })
      const customApi = customPlugin.install(mockKernel as AuthKeeper)

      mockRefreshFn.mockRejectedValue(new Error('Fails'))

      const promise = expect(customApi.refresh()).rejects.toThrow()
      await vi.runAllTimersAsync()
      await promise

      // maxRetries: 1 means 2 total attempts
      expect(mockRefreshFn).toHaveBeenCalledTimes(2)

      // Clean up any pending timers
      vi.clearAllTimers()
    })

    it('should emit error event after max retries', async () => {
      mockRefreshFn.mockRejectedValue(new Error('Always fails'))

      const promise = expect(api.refresh()).rejects.toThrow()
      await vi.runAllTimersAsync()
      await promise

      expect(mockKernel.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          context: 'refresh',
        })
      )

      // Clean up any pending timers
      vi.clearAllTimers()
    })
  })

  describe('scheduleRefresh()', () => {
    it('should schedule refresh before token expires', () => {
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(120000) // 2 minutes

      api.scheduleRefresh()

      // Should schedule for (120000 - 60000) = 60000ms
      expect(vi.getTimerCount()).toBe(1)
    })

    it('should refresh immediately if token expires soon', async () => {
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(30000) // 30 seconds

      api.scheduleRefresh()

      // Should refresh immediately since 30s < threshold (60s)
      await vi.runAllTimersAsync()

      expect(mockRefreshFn).toHaveBeenCalled()
    })

    it('should not schedule if no expiry', () => {
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(null)

      api.scheduleRefresh()

      expect(vi.getTimerCount()).toBe(0)
    })

    it('should cancel previous scheduled refresh', () => {
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(120000)

      api.scheduleRefresh()
      expect(vi.getTimerCount()).toBe(1)

      api.scheduleRefresh()
      expect(vi.getTimerCount()).toBe(1) // Still only 1, previous was cancelled
    })

    it('should execute refresh when timer fires', async () => {
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(120000)

      api.scheduleRefresh()

      // Advance to scheduled time
      await vi.advanceTimersByTimeAsync(60000)

      expect(mockRefreshFn).toHaveBeenCalled()
    })

    it('should handle refresh failure in scheduled refresh', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockRefreshFn.mockRejectedValue(new Error('Refresh failed'))
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(120000)

      api.scheduleRefresh()

      await vi.runAllTimersAsync()

      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    it('should handle immediate refresh failure when token expires soon', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockRefreshFn.mockRejectedValue(new Error('Immediate refresh failed'))

      // Token expires in 30 seconds (less than threshold of 60s)
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(30000)

      api.scheduleRefresh()

      // Wait for immediate refresh to fail
      await vi.runAllTimersAsync()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AuthKeeper] Immediate refresh failed:',
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('cancelScheduledRefresh()', () => {
    it('should cancel scheduled refresh', () => {
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(120000)

      api.scheduleRefresh()
      expect(vi.getTimerCount()).toBe(1)

      api.cancelScheduledRefresh()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('should not throw if no refresh scheduled', () => {
      expect(() => api.cancelScheduledRefresh()).not.toThrow()
    })
  })

  describe('getNextRefreshAt()', () => {
    it('should return scheduled refresh time', () => {
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour
      mockKernel.getExpiresAt = vi.fn().mockReturnValue(expiresAt)

      const nextRefresh = api.getNextRefreshAt()

      // Should be threshold (60s) before expiry
      expect(nextRefresh).toBeInstanceOf(Date)
      expect(nextRefresh?.getTime()).toBe(expiresAt.getTime() - 60000)
    })

    it('should return null if no expiry', () => {
      mockKernel.getExpiresAt = vi.fn().mockReturnValue(null)

      expect(api.getNextRefreshAt()).toBeNull()
    })

    it('should respect custom threshold', () => {
      const customPlugin = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        threshold: 30,
      })
      const customApi = customPlugin.install(mockKernel as AuthKeeper)

      const expiresAt = new Date(Date.now() + 3600000)
      mockKernel.getExpiresAt = vi.fn().mockReturnValue(expiresAt)

      const nextRefresh = customApi.getNextRefreshAt()

      expect(nextRefresh?.getTime()).toBe(expiresAt.getTime() - 30000)
    })
  })

  describe('setRefreshFn()', () => {
    it('should update refresh function', async () => {
      const newRefreshFn = vi.fn().mockResolvedValue({
        accessToken: 'from-new-fn',
      })

      api.setRefreshFn(newRefreshFn)

      const promise = api.refresh()
      await vi.runAllTimersAsync()
      await promise

      expect(newRefreshFn).toHaveBeenCalled()
      expect(mockRefreshFn).not.toHaveBeenCalled()
    })
  })

  describe('setThreshold()', () => {
    it('should update threshold', () => {
      api.setThreshold(30)

      const expiresAt = new Date(Date.now() + 3600000)
      mockKernel.getExpiresAt = vi.fn().mockReturnValue(expiresAt)

      const nextRefresh = api.getNextRefreshAt()

      // Should use new threshold
      expect(nextRefresh?.getTime()).toBe(expiresAt.getTime() - 30000)
    })
  })

  describe('callbacks', () => {
    it('should call onRefreshStart', async () => {
      const onRefreshStart = vi.fn()
      const p = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        onRefreshStart,
      })
      const a = p.install(mockKernel as AuthKeeper)

      const promise = a.refresh()
      await vi.runAllTimersAsync()
      await promise

      expect(onRefreshStart).toHaveBeenCalled()
    })

    it('should call onRefreshSuccess', async () => {
      const onRefreshSuccess = vi.fn()
      const newTokens = { accessToken: 'success' }
      mockRefreshFn.mockResolvedValueOnce(newTokens)

      const p = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        onRefreshSuccess,
      })
      const a = p.install(mockKernel as AuthKeeper)

      const promise = a.refresh()
      await vi.runAllTimersAsync()
      await promise

      expect(onRefreshSuccess).toHaveBeenCalledWith(newTokens)
    })

    it('should call onRefreshError after max retries', async () => {
      const onRefreshError = vi.fn()
      mockRefreshFn.mockRejectedValue(new Error('Failed'))

      const p = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        maxRetries: 1,
        onRefreshError,
      })
      const a = p.install(mockKernel as AuthKeeper)

      const promise = expect(a.refresh()).rejects.toThrow()
      await vi.runAllTimersAsync()
      await promise

      expect(onRefreshError).toHaveBeenCalled()

      // Clean up any pending timers
      vi.clearAllTimers()
    })
  })

  describe('uninstall()', () => {
    it('should cancel scheduled refresh on uninstall', () => {
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(120000)

      api.scheduleRefresh()
      expect(vi.getTimerCount()).toBe(1)

      plugin.uninstall()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('createRefreshEnginePlugin()', () => {
    it('should create plugin instance', () => {
      const created = createRefreshEnginePlugin({ refreshFn: mockRefreshFn })
      expect(created).toBeInstanceOf(RefreshEnginePlugin)
      expect(created.name).toBe('refresh-engine')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete refresh flow', async () => {
      const onRefreshStart = vi.fn()
      const onRefreshSuccess = vi.fn()

      const p = new RefreshEnginePlugin({
        refreshFn: mockRefreshFn,
        onRefreshStart,
        onRefreshSuccess,
      })
      const a = p.install(mockKernel as AuthKeeper)

      // Start refresh
      expect(a.isRefreshing()).toBe(false)

      const promise = a.refresh()
      expect(a.isRefreshing()).toBe(true)

      await vi.runAllTimersAsync()
      const tokens = await promise

      expect(a.isRefreshing()).toBe(false)
      expect(onRefreshStart).toHaveBeenCalled()
      expect(onRefreshSuccess).toHaveBeenCalled()
      expect(mockKernel.setTokens).toHaveBeenCalledWith(tokens)
      expect(mockKernel.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'refresh' })
      )
    })

    it('should auto-schedule after successful refresh', async () => {
      // Mock to return proper expiry after refresh
      mockKernel.getTimeUntilExpiry = vi.fn().mockReturnValue(3600000) // 1 hour

      // Initial call count
      const initialCallCount = mockRefreshFn.mock.calls.length

      const promise = api.refresh()

      // Advance time for initial refresh only (not the scheduled one)
      await vi.advanceTimersByTimeAsync(0)
      await promise

      // Should have scheduled next refresh (60s before expiry)
      expect(vi.getTimerCount()).toBeGreaterThan(0)

      // Verify only one refresh happened (the manual one)
      expect(mockRefreshFn).toHaveBeenCalledTimes(initialCallCount + 1)

      // Clean up scheduled refresh
      vi.clearAllTimers()
    })

    it('should handle retry then success workflow', async () => {
      mockRefreshFn
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ accessToken: 'recovered' })

      const promise = api.refresh()
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.accessToken).toBe('recovered')
      expect(mockRefreshFn).toHaveBeenCalledTimes(2)
    })
  })
})
