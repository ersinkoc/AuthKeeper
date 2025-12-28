/**
 * AuthKeeper - Zero-dependency token & auth management toolkit
 *
 * @packageDocumentation
 */

// Main factory function
export { createAuthKeeper } from './factory'

// Core types
export type {
  AuthKeeper,
  TokenSet,
  TokenPayload,
  TokenHeader,
  TokenInfo,
  StoredTokens,
  AuthErrorCode,
  AuthErrorOptions,
  EventType,
  AuthEvent,
  LoginEvent,
  LogoutEvent,
  RefreshEvent,
  ExpiredEvent,
  ErrorEvent,
  StorageChangeEvent,
  TabSyncEvent,
  EventHandler,
  Unsubscribe,
  StorageAdapter,
  StorageType,
  Plugin,
  PluginInfo,
  KernelOptions,
  LogoutOptions,
  AuthFetch,
  FetchInterceptorOptions,
  LoginOptions,
  UserInfo,
  RefreshTokenFn,
} from './types'

// Export AuthError class
export { AuthError } from './types'

// Kernel exports (for advanced usage)
export { AuthKeeperKernel, EventBus, PluginRegistry } from './kernel'

// Core plugin exports (for advanced usage)
export {
  TokenStorePlugin,
  TokenDecoderPlugin,
  RefreshEnginePlugin,
  MemoryStorageAdapter,
  FetchInterceptorPlugin,
  createTokenStorePlugin,
  createTokenDecoderPlugin,
  createRefreshEnginePlugin,
  createMemoryStorage,
  createFetchInterceptorPlugin,
} from './plugins/core'

// Export plugin API types
export type {
  TokenStoreAPI,
  TokenStoreOptions,
  TokenDecoderAPI,
  RefreshEngineAPI,
  RefreshEngineOptions,
  MemoryStorageOptions,
  FetchInterceptorAPI,
} from './plugins/core'

// Utility exports (for advanced usage)
export {
  base64UrlEncode,
  base64UrlDecode,
  stringToBase64Url,
  base64UrlDecodeToBytes,
  decodeJwt,
  decodePayload,
  decodeHeader,
  isValidJwtFormat,
  getTokenExpiry,
  isTokenExpired,
  getTimeUntilExpiry,
  getClaim,
  getClaims,
  isExpired,
  getExpiresIn,
  secondsToMs,
  msToSeconds,
  calculateExpiresAt,
  formatTimeRemaining,
  generateCodeVerifier,
  generateCodeChallenge,
  generateRandomString,
  generateUuid,
} from './utils'
