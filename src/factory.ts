/**
 * Factory Function
 *
 * Creates and initializes an AuthKeeper instance with core plugins.
 */

import { AuthKeeperKernel } from './kernel'
import {
  createTokenStorePlugin,
  createTokenDecoderPlugin,
  createRefreshEnginePlugin,
  createFetchInterceptorPlugin,
} from './plugins/core'
import type { AuthKeeper, KernelOptions } from './types'

/**
 * Create an AuthKeeper instance
 *
 * Automatically installs core plugins:
 * - token-store: Token state management
 * - token-decoder: JWT decoding
 * - refresh-engine: Auto-refresh with queue
 * - storage-memory: Default secure storage
 * - fetch-interceptor: Auth header injection and 401 retry
 *
 * @param options - Configuration options
 * @returns AuthKeeper instance
 *
 * @example
 * ```typescript
 * const auth = createAuthKeeper({
 *   storage: 'memory',
 *   refreshToken: async (token) => {
 *     const res = await fetch('/api/auth/refresh', {
 *       method: 'POST',
 *       body: JSON.stringify({ refreshToken: token }),
 *     })
 *     return res.json()
 *   },
 *   autoRefresh: true,
 *   refreshThreshold: 60,
 * })
 *
 * await auth.init()
 * ```
 */
export async function createAuthKeeper(options: KernelOptions): Promise<AuthKeeper> {
  // Create kernel
  const kernel = new AuthKeeperKernel(options)

  // Register and install core plugins
  // 1. token-store
  await kernel.register(createTokenStorePlugin())

  // 2. token-decoder
  await kernel.register(createTokenDecoderPlugin())

  // 3. refresh-engine
  await kernel.register(
    createRefreshEnginePlugin({
      refreshFn: options.refreshToken,
      threshold: options.refreshThreshold,
    })
  )

  // 4. storage-memory (if no custom storage provided)
  // Note: In future, we'll support other storage types here

  // 5. fetch-interceptor
  await kernel.register(createFetchInterceptorPlugin())

  // Initialize kernel
  await kernel.init()

  return kernel
}

// Storage adapter creation (for future use with optional plugins)
// function createStorageAdapter(
//   storage: string | StorageAdapter
// ): StorageAdapter {
//   if (typeof storage === 'object') {
//     return storage
//   }
//
//   switch (storage) {
//     case 'memory':
//       return createMemoryStorage()
//     case 'localStorage':
//       // Will be implemented in optional plugins
//       throw new Error('localStorage storage requires plugin')
//     case 'sessionStorage':
//       // Will be implemented in optional plugins
//       throw new Error('sessionStorage storage requires plugin')
//     case 'cookie':
//       // Will be implemented in optional plugins
//       throw new Error('cookie storage requires plugin')
//     default:
//       throw new Error(`Unknown storage type: ${storage}`)
//   }
// }
