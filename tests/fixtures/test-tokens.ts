/**
 * Test JWT tokens for use in tests
 *
 * These are real JWT tokens (but with fake signatures).
 * They can be decoded but not validated.
 */

import { stringToBase64Url } from '../../src/utils/base64'

/**
 * Create a test JWT token
 *
 * @param payload - Token payload
 * @param header - Token header (optional)
 * @returns JWT string
 */
export function createTestToken(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' }
): string {
  const headerStr = stringToBase64Url(JSON.stringify(header))
  const payloadStr = stringToBase64Url(JSON.stringify(payload))
  const signature = 'fake_signature'
  return `${headerStr}.${payloadStr}.${signature}`
}

/**
 * Valid access token (expires far in the future)
 */
export const TEST_ACCESS_TOKEN = createTestToken({
  sub: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['user', 'admin'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
})

/**
 * Expired access token
 */
export const TEST_EXPIRED_TOKEN = createTestToken({
  sub: 'user-123',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000) - 7200, // Issued 2 hours ago
  exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
})

/**
 * Token without expiry
 */
export const TEST_NO_EXPIRY_TOKEN = createTestToken({
  sub: 'user-123',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  // No exp claim
})

/**
 * Token with custom claims
 */
export const TEST_CUSTOM_CLAIMS_TOKEN = createTestToken({
  sub: 'user-123',
  email: 'test@example.com',
  customClaim: 'customValue',
  nestedClaim: {
    foo: 'bar',
    baz: 123,
  },
  exp: Math.floor(Date.now() / 1000) + 3600,
})

/**
 * Refresh token (longer expiry)
 */
export const TEST_REFRESH_TOKEN = createTestToken({
  sub: 'user-123',
  type: 'refresh',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400 * 7, // Expires in 7 days
})

/**
 * Malformed tokens for error testing
 */
export const MALFORMED_TOKENS = {
  /** Only 2 parts instead of 3 */
  twoparts: 'header.payload',
  /** 4 parts instead of 3 */
  fourParts: 'header.payload.signature.extra',
  /** Empty string */
  empty: '',
  /** Invalid base64 */
  invalidBase64: 'invalid!!!.invalid!!!.signature',
  /** Not JSON */
  notJson: stringToBase64Url('not json') + '.' + stringToBase64Url('not json') + '.signature',
}

/**
 * Sample token set for login/refresh flows
 */
export const TEST_TOKEN_SET = {
  accessToken: TEST_ACCESS_TOKEN,
  refreshToken: TEST_REFRESH_TOKEN,
  expiresIn: 3600,
  tokenType: 'Bearer',
}
