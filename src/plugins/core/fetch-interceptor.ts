/**
 * Fetch Interceptor Plugin
 *
 * Core plugin for fetch() wrapper with auth header injection and 401 retry.
 * - Injects Authorization header
 * - URL filtering (include/exclude)
 * - 401 retry after token refresh
 */

import type { Plugin, AuthKeeper, AuthFetch, FetchInterceptorOptions } from '../../types'

/**
 * Fetch Interceptor API
 */
export interface FetchInterceptorAPI {
  createFetch(options?: FetchInterceptorOptions): AuthFetch
  wrapFetch(fetch: typeof globalThis.fetch): void
  unwrapFetch(): void
}

/**
 * FetchInterceptorPlugin class
 */
export class FetchInterceptorPlugin implements Plugin {
  name = 'fetch-interceptor'
  version = '1.0.0'
  type = 'core' as const

  private kernel!: AuthKeeper
  private originalFetch: typeof globalThis.fetch | null = null

  install(kernel: AuthKeeper): FetchInterceptorAPI {
    this.kernel = kernel

    return {
      createFetch: this.createFetch.bind(this),
      wrapFetch: this.wrapFetch.bind(this),
      unwrapFetch: this.unwrapFetch.bind(this),
    }
  }

  /**
   * Create authenticated fetch function
   */
  private createFetch(options: FetchInterceptorOptions = {}): AuthFetch {
    const {
      headerName = 'Authorization',
      headerPrefix = 'Bearer ',
      includeUrls = [],
      excludeUrls = [],
      retry401 = true,
      maxRetries = 1,
      onUnauthorized,
    } = options

    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Determine URL
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      // Check if we should add auth header
      const shouldInclude =
        includeUrls.length === 0 ||
        includeUrls.some((pattern) =>
          typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)
        )

      const shouldExclude = excludeUrls.some((pattern) =>
        typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)
      )

      // If excluded or not included, just call fetch normally
      if (!shouldInclude || shouldExclude) {
        return fetch(input, init)
      }

      // Add auth header
      const accessToken = this.kernel.getAccessToken()
      const headers = new Headers(init?.headers)

      if (accessToken) {
        headers.set(headerName, headerPrefix + accessToken)
      }

      // Make request
      let response = await fetch(input, {
        ...init,
        headers,
      })

      // Handle 401 with retry
      if (response.status === 401 && retry401 && maxRetries > 0) {
        // Call onUnauthorized callback
        if (onUnauthorized) {
          onUnauthorized(response)
        }

        try {
          // Refresh token
          await this.kernel.refresh()

          // Retry request with new token
          const newToken = this.kernel.getAccessToken()
          if (newToken) {
            headers.set(headerName, headerPrefix + newToken)

            response = await fetch(input, {
              ...init,
              headers,
            })
          }
        } catch (error) {
          // Refresh failed, return original 401
          console.error('[AuthKeeper] Token refresh failed during 401 retry:', error)
        }
      }

      return response
    }
  }

  /**
   * Wrap global fetch with auth
   */
  private wrapFetch(fetch: typeof globalThis.fetch): void {
    if (!this.originalFetch) {
      this.originalFetch = fetch
    }

    const authFetch = this.createFetch()
    ;(globalThis as any).fetch = authFetch
  }

  /**
   * Restore original fetch
   */
  private unwrapFetch(): void {
    if (this.originalFetch) {
      (globalThis as any).fetch = this.originalFetch
      this.originalFetch = null
    }
  }

  uninstall(): void {
    this.unwrapFetch()
  }
}

/**
 * Create fetch-interceptor plugin
 */
export function createFetchInterceptorPlugin(): FetchInterceptorPlugin {
  return new FetchInterceptorPlugin()
}
