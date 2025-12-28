/**
 * Tests for FetchInterceptorPlugin
 */

import { vi } from 'vitest'
import { FetchInterceptorPlugin, createFetchInterceptorPlugin } from '../../../../src/plugins/core/fetch-interceptor'
import type { AuthKeeper, AuthFetch } from '../../../../src/types'

describe('FetchInterceptorPlugin', () => {
  let plugin: FetchInterceptorPlugin
  let mockKernel: Partial<AuthKeeper>
  let mockFetch: ReturnType<typeof vi.fn>
  let api: any

  const createMockKernel = (accessToken: string | null = 'access-token-123'): Partial<AuthKeeper> => ({
    getAccessToken: vi.fn().mockReturnValue(accessToken),
    refresh: vi.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }),
  })

  const createMockResponse = (status: number, body?: any): Response => ({
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as any)

  beforeEach(() => {
    plugin = new FetchInterceptorPlugin()
    mockKernel = createMockKernel()
    mockFetch = vi.fn().mockResolvedValue(createMockResponse(200, { data: 'success' }))

    // Mock global fetch
    globalThis.fetch = mockFetch as any

    api = plugin.install(mockKernel as AuthKeeper)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.name).toBe('fetch-interceptor')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.type).toBe('core')
    })
  })

  describe('install()', () => {
    it('should return API object', () => {
      expect(api).toBeDefined()
      expect(typeof api.createFetch).toBe('function')
      expect(typeof api.wrapFetch).toBe('function')
      expect(typeof api.unwrapFetch).toBe('function')
    })
  })

  describe('createFetch()', () => {
    it('should inject Authorization header by default', async () => {
      const authFetch = api.createFetch()

      await authFetch('https://api.example.com/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      )

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('Authorization')).toBe('Bearer access-token-123')
    })

    it('should use custom header name', async () => {
      const authFetch = api.createFetch({ headerName: 'X-Auth-Token' })

      await authFetch('https://api.example.com/users')

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('X-Auth-Token')).toBe('Bearer access-token-123')
      expect(callHeaders.get('Authorization')).toBeNull()
    })

    it('should use custom header prefix', async () => {
      const authFetch = api.createFetch({ headerPrefix: 'Token ' })

      await authFetch('https://api.example.com/users')

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('Authorization')).toBe('Token access-token-123')
    })

    it('should not add header when no token', async () => {
      mockKernel.getAccessToken = vi.fn().mockReturnValue(null)
      const authFetch = api.createFetch()

      await authFetch('https://api.example.com/users')

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('Authorization')).toBeNull()
    })

    it('should preserve existing headers', async () => {
      const authFetch = api.createFetch()

      await authFetch('https://api.example.com/users', {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        },
      })

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('Authorization')).toBe('Bearer access-token-123')
      expect(callHeaders.get('Content-Type')).toBe('application/json')
      expect(callHeaders.get('X-Custom')).toBe('value')
    })

    it('should handle Request objects', async () => {
      const authFetch = api.createFetch()
      const request = new Request('https://api.example.com/users')

      await authFetch(request)

      expect(mockFetch).toHaveBeenCalled()
      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('Authorization')).toBe('Bearer access-token-123')
    })

    it('should handle URL objects', async () => {
      const authFetch = api.createFetch()
      const url = new URL('https://api.example.com/users')

      await authFetch(url)

      expect(mockFetch).toHaveBeenCalled()
      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('Authorization')).toBe('Bearer access-token-123')
    })
  })

  describe('URL filtering', () => {
    it('should include all URLs by default', async () => {
      const authFetch = api.createFetch()

      await authFetch('https://api.example.com/users')
      await authFetch('https://other-api.com/data')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBeTruthy()
      expect(mockFetch.mock.calls[1][1].headers.get('Authorization')).toBeTruthy()
    })

    it('should filter by includeUrls string patterns', async () => {
      const authFetch = api.createFetch({
        includeUrls: ['api.example.com'],
      })

      await authFetch('https://api.example.com/users')
      await authFetch('https://other-api.com/data')

      // First call should have auth header
      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token-123')

      // Second call should NOT have auth header (not included)
      const secondCallHeaders = mockFetch.mock.calls[1][1]?.headers
      expect(secondCallHeaders).toBeUndefined()
    })

    it('should filter by includeUrls RegExp patterns', async () => {
      const authFetch = api.createFetch({
        includeUrls: [/^https:\/\/api\.example\.com/],
      })

      await authFetch('https://api.example.com/users')
      await authFetch('https://other-api.com/data')

      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[1][1]?.headers).toBeUndefined()
    })

    it('should filter by excludeUrls string patterns', async () => {
      const authFetch = api.createFetch({
        excludeUrls: ['public'],
      })

      await authFetch('https://api.example.com/users')
      await authFetch('https://api.example.com/public/data')

      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[1][1]?.headers).toBeUndefined()
    })

    it('should filter by excludeUrls RegExp patterns', async () => {
      const authFetch = api.createFetch({
        excludeUrls: [/\/public\//],
      })

      await authFetch('https://api.example.com/users')
      await authFetch('https://api.example.com/public/data')

      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[1][1]?.headers).toBeUndefined()
    })

    it('should exclude taking precedence over include', async () => {
      const authFetch = api.createFetch({
        includeUrls: ['api.example.com'],
        excludeUrls: ['/public/'],
      })

      await authFetch('https://api.example.com/users')
      await authFetch('https://api.example.com/public/data')

      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[1][1]?.headers).toBeUndefined()
    })

    it('should handle mixed string and RegExp patterns', async () => {
      const authFetch = api.createFetch({
        includeUrls: ['api.example.com', /secure/],
        excludeUrls: ['public', /\/guest\//],
      })

      await authFetch('https://api.example.com/users') // included
      await authFetch('https://secure.example.com/data') // included
      await authFetch('https://public.example.com/data') // excluded
      await authFetch('https://api.example.com/guest/data') // excluded
      await authFetch('https://other.com/data') // not included

      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[2][1]?.headers).toBeUndefined()
      expect(mockFetch.mock.calls[3][1]?.headers).toBeUndefined()
      expect(mockFetch.mock.calls[4][1]?.headers).toBeUndefined()
    })
  })

  describe('401 retry', () => {
    it('should retry on 401 response', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(401))
        .mockResolvedValueOnce(createMockResponse(200, { data: 'success' }))

      const authFetch = api.createFetch()
      const response = await authFetch('https://api.example.com/users')

      expect(mockKernel.refresh).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(response.status).toBe(200)
    })

    it('should use new token after refresh', async () => {
      // Clear previous mock calls
      mockFetch.mockClear()

      // Track headers for each call
      const headerSnapshots: string[] = []
      mockFetch.mockImplementation(async (input, init: any) => {
        // Capture header at the time of the call
        const authHeader = init?.headers?.get('Authorization') || 'none'
        headerSnapshots.push(authHeader)

        // Return 401 for first call, 200 for second
        if (headerSnapshots.length === 1) {
          return createMockResponse(401)
        }
        return createMockResponse(200)
      })

      // Create fresh kernel for this test
      let refreshCalled = false
      const testKernel: Partial<AuthKeeper> = {
        getAccessToken: vi.fn().mockImplementation(() => {
          return refreshCalled ? 'new-access-token' : 'old-token'
        }),
        refresh: vi.fn().mockImplementation(async () => {
          refreshCalled = true
          return { accessToken: 'new-access-token' }
        }),
      }

      const testPlugin = new FetchInterceptorPlugin()
      const testApi = testPlugin.install(testKernel as AuthKeeper)

      const authFetch = testApi.createFetch()
      await authFetch('https://api.example.com/users')

      // Verify we made exactly 2 calls
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // First call uses old token
      expect(headerSnapshots[0]).toBe('Bearer old-token')

      // Second call (retry) uses new token
      expect(headerSnapshots[1]).toBe('Bearer new-access-token')
    })

    it('should not retry when retry401 is false', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(401))

      const authFetch = api.createFetch({ retry401: false })
      const response = await authFetch('https://api.example.com/users')

      expect(mockKernel.refresh).not.toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(401)
    })

    it('should not retry when maxRetries is 0', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(401))

      const authFetch = api.createFetch({ maxRetries: 0 })
      const response = await authFetch('https://api.example.com/users')

      expect(mockKernel.refresh).not.toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(401)
    })

    it('should call onUnauthorized callback on 401', async () => {
      const onUnauthorized = vi.fn()
      mockFetch.mockResolvedValueOnce(createMockResponse(401))

      const authFetch = api.createFetch({ onUnauthorized })
      await authFetch('https://api.example.com/users')

      expect(onUnauthorized).toHaveBeenCalled()
      expect(onUnauthorized.mock.calls[0][0].status).toBe(401)
    })

    it('should return original 401 when refresh fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const originalResponse = createMockResponse(401)
      mockFetch.mockResolvedValueOnce(originalResponse)
      mockKernel.refresh = vi.fn().mockRejectedValue(new Error('Refresh failed'))

      const authFetch = api.createFetch()
      const response = await authFetch('https://api.example.com/users')

      expect(response.status).toBe(401)
      expect(mockFetch).toHaveBeenCalledTimes(1) // No retry on refresh failure
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should not retry on other error status codes', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(403))

      const authFetch = api.createFetch()
      const response = await authFetch('https://api.example.com/users')

      expect(mockKernel.refresh).not.toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(403)
    })

    it('should handle 401 retry with Request object', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(401))
        .mockResolvedValueOnce(createMockResponse(200))

      const authFetch = api.createFetch()
      const request = new Request('https://api.example.com/users', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      })

      const response = await authFetch(request)

      expect(mockKernel.refresh).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })
  })

  describe('wrapFetch()', () => {
    it('should wrap global fetch', () => {
      const originalFetch = globalThis.fetch
      api.wrapFetch(originalFetch)

      // Verify fetch was replaced
      expect(globalThis.fetch).not.toBe(originalFetch)
      expect(typeof globalThis.fetch).toBe('function')

      // Clean up
      api.unwrapFetch()
    })

    it('should store original fetch only once', () => {
      const originalFetch = globalThis.fetch
      api.wrapFetch(originalFetch)
      const wrappedOnce = globalThis.fetch

      api.wrapFetch(wrappedOnce)

      // Should still be able to unwrap to original
      api.unwrapFetch()
      expect(globalThis.fetch).toBe(originalFetch)
    })
  })

  describe('unwrapFetch()', () => {
    it('should restore original fetch', () => {
      const originalFetch = globalThis.fetch
      api.wrapFetch(originalFetch)

      expect(globalThis.fetch).not.toBe(originalFetch)

      api.unwrapFetch()
      expect(globalThis.fetch).toBe(originalFetch)
    })

    it('should not throw when called without wrapping', () => {
      expect(() => api.unwrapFetch()).not.toThrow()
    })

    it('should allow wrapping again after unwrapping', () => {
      const originalFetch = globalThis.fetch

      api.wrapFetch(originalFetch)
      api.unwrapFetch()
      expect(globalThis.fetch).toBe(originalFetch)

      api.wrapFetch(globalThis.fetch)
      expect(globalThis.fetch).not.toBe(originalFetch)

      // Clean up
      api.unwrapFetch()
    })
  })

  describe('uninstall()', () => {
    it('should unwrap fetch on uninstall', () => {
      const originalFetch = globalThis.fetch
      api.wrapFetch(originalFetch)

      plugin.uninstall()

      expect(globalThis.fetch).toBe(originalFetch)
    })
  })

  describe('createFetchInterceptorPlugin()', () => {
    it('should create plugin instance', () => {
      const created = createFetchInterceptorPlugin()
      expect(created).toBeInstanceOf(FetchInterceptorPlugin)
      expect(created.name).toBe('fetch-interceptor')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete authenticated request flow', async () => {
      const authFetch = api.createFetch({
        headerName: 'Authorization',
        headerPrefix: 'Bearer ',
      })

      const response = await authFetch('https://api.example.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test User' }),
      })

      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test User' }),
        })
      )

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.get('Authorization')).toBe('Bearer access-token-123')
      expect(callHeaders.get('Content-Type')).toBe('application/json')
    })

    it('should handle 401 retry with success', async () => {
      // Clear previous mock calls
      mockFetch.mockClear()

      const onUnauthorized = vi.fn()
      mockFetch
        .mockResolvedValueOnce(createMockResponse(401))
        .mockResolvedValueOnce(createMockResponse(200, { data: 'success after retry' }))

      // Create fresh kernel for this test
      let refreshCalled = false
      const testKernel: Partial<AuthKeeper> = {
        getAccessToken: vi.fn().mockImplementation(() => {
          return refreshCalled ? 'new-token' : 'old-token'
        }),
        refresh: vi.fn().mockImplementation(async () => {
          refreshCalled = true
          return { accessToken: 'new-token' }
        }),
      }

      const testPlugin = new FetchInterceptorPlugin()
      const testApi = testPlugin.install(testKernel as AuthKeeper)

      const authFetch = testApi.createFetch({ onUnauthorized })
      const response = await authFetch('https://api.example.com/protected')

      expect(onUnauthorized).toHaveBeenCalled()
      expect(testKernel.refresh).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Verify token was updated in retry
      expect(mockFetch.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer new-token')
    })

    it('should handle URL filtering with multiple patterns', async () => {
      const authFetch = api.createFetch({
        includeUrls: ['api.example.com', /secure/],
        excludeUrls: ['/public/', /guest/],
      })

      const urls = [
        'https://api.example.com/users',        // ✓ included
        'https://api.example.com/public/info',  // ✗ excluded
        'https://secure.site.com/data',         // ✓ included
        'https://secure.site.com/guest/data',   // ✗ excluded
        'https://random.com/api',               // ✗ not included
      ]

      for (const url of urls) {
        await authFetch(url)
      }

      // Check which calls have auth headers
      expect(mockFetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[1][1]?.headers).toBeUndefined()
      expect(mockFetch.mock.calls[2][1].headers.get('Authorization')).toBe('Bearer access-token-123')
      expect(mockFetch.mock.calls[3][1]?.headers).toBeUndefined()
      expect(mockFetch.mock.calls[4][1]?.headers).toBeUndefined()
    })

    it('should work with wrapped global fetch', () => {
      const originalFetch = globalThis.fetch
      api.wrapFetch(originalFetch)

      // Verify fetch was wrapped
      expect(globalThis.fetch).not.toBe(originalFetch)
      expect(typeof globalThis.fetch).toBe('function')

      // Cleanup
      api.unwrapFetch()
      expect(globalThis.fetch).toBe(originalFetch)
    })

    it('should handle complex 401 retry scenario', async () => {
      const onUnauthorized = vi.fn()

      // First request succeeds
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { data: 'first' }))

      // Second request gets 401, then succeeds on retry
      mockFetch.mockResolvedValueOnce(createMockResponse(401))
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { data: 'second retry' }))

      const authFetch = api.createFetch({ onUnauthorized })

      // First request
      const response1 = await authFetch('https://api.example.com/data1')
      expect(response1.status).toBe(200)
      expect(onUnauthorized).not.toHaveBeenCalled()

      // Second request with 401 retry
      const response2 = await authFetch('https://api.example.com/data2')
      expect(response2.status).toBe(200)
      expect(onUnauthorized).toHaveBeenCalledTimes(1)
      expect(mockKernel.refresh).toHaveBeenCalledTimes(1)
    })
  })
})
