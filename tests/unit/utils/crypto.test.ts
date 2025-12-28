/**
 * Tests for cryptographic utilities (PKCE)
 */

import { vi } from 'vitest'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateRandomString,
  generateUuid,
} from '../../../src/utils/crypto'

describe('crypto utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate code verifier with default length', () => {
      const verifier = generateCodeVerifier()
      expect(verifier).toBeTruthy()
      expect(verifier.length).toBe(64)
    })

    it('should generate code verifier with custom length', () => {
      const verifier43 = generateCodeVerifier(43)
      expect(verifier43.length).toBe(43)

      const verifier100 = generateCodeVerifier(100)
      expect(verifier100.length).toBe(100)

      const verifier128 = generateCodeVerifier(128)
      expect(verifier128.length).toBe(128)
    })

    it('should only contain base64url characters', () => {
      const verifier = generateCodeVerifier()
      // Base64URL alphabet: A-Z, a-z, 0-9, -, _
      const base64UrlRegex = /^[A-Za-z0-9\-_]+$/
      expect(verifier).toMatch(base64UrlRegex)
    })

    it('should throw error for length < 43', () => {
      expect(() => generateCodeVerifier(42)).toThrow(
        'Code verifier length must be between 43 and 128 characters'
      )
      expect(() => generateCodeVerifier(0)).toThrow()
      expect(() => generateCodeVerifier(-1)).toThrow()
    })

    it('should throw error for length > 128', () => {
      expect(() => generateCodeVerifier(129)).toThrow(
        'Code verifier length must be between 43 and 128 characters'
      )
      expect(() => generateCodeVerifier(200)).toThrow()
    })

    it('should generate different verifiers on each call', () => {
      const verifier1 = generateCodeVerifier()
      const verifier2 = generateCodeVerifier()
      const verifier3 = generateCodeVerifier()

      // Very unlikely to be the same if random
      expect(verifier1).not.toBe(verifier2)
      expect(verifier2).not.toBe(verifier3)
      expect(verifier1).not.toBe(verifier3)
    })

    it('should handle boundary lengths', () => {
      const min = generateCodeVerifier(43)
      expect(min.length).toBe(43)

      const max = generateCodeVerifier(128)
      expect(max.length).toBe(128)
    })
  })

  describe('generateCodeChallenge', () => {
    it('should generate code challenge from verifier', async () => {
      const verifier = 'test-code-verifier-123456789'
      const challenge = await generateCodeChallenge(verifier)

      expect(challenge).toBeTruthy()
      expect(typeof challenge).toBe('string')
    })

    it('should only contain base64url characters', async () => {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)

      // Base64URL alphabet: A-Z, a-z, 0-9, -, _
      const base64UrlRegex = /^[A-Za-z0-9\-_]+$/
      expect(challenge).toMatch(base64UrlRegex)
    })

    it('should generate same challenge for same verifier', async () => {
      const verifier = 'consistent-verifier-for-testing'
      const challenge1 = await generateCodeChallenge(verifier)
      const challenge2 = await generateCodeChallenge(verifier)

      expect(challenge1).toBe(challenge2)
    })

    it('should generate different challenges for different verifiers', async () => {
      const verifier1 = 'verifier-one'
      const verifier2 = 'verifier-two'

      const challenge1 = await generateCodeChallenge(verifier1)
      const challenge2 = await generateCodeChallenge(verifier2)

      expect(challenge1).not.toBe(challenge2)
    })

    it('should produce fixed length output (SHA-256 base64url)', async () => {
      // SHA-256 produces 32 bytes, which in base64url is 43 characters (without padding)
      const verifier1 = generateCodeVerifier(43)
      const verifier2 = generateCodeVerifier(128)

      const challenge1 = await generateCodeChallenge(verifier1)
      const challenge2 = await generateCodeChallenge(verifier2)

      // SHA-256 hash is always 32 bytes = 43 chars in base64url
      expect(challenge1.length).toBe(43)
      expect(challenge2.length).toBe(43)
    })

    it('should handle empty string verifier', async () => {
      const challenge = await generateCodeChallenge('')
      expect(challenge).toBeTruthy()
      expect(challenge.length).toBe(43)
    })

    it('should handle unicode in verifier', async () => {
      const verifier = 'test-🚀-emoji-verifier'
      const challenge = await generateCodeChallenge(verifier)
      expect(challenge).toBeTruthy()
      expect(challenge.length).toBe(43)
    })
  })

  describe('generateRandomString', () => {
    it('should generate random string with specified length', () => {
      const str10 = generateRandomString(10)
      expect(str10.length).toBe(10)

      const str32 = generateRandomString(32)
      expect(str32.length).toBe(32)

      const str64 = generateRandomString(64)
      expect(str64.length).toBe(64)
    })

    it('should only contain base64url characters', () => {
      const randomStr = generateRandomString(50)
      const base64UrlRegex = /^[A-Za-z0-9\-_]+$/
      expect(randomStr).toMatch(base64UrlRegex)
    })

    it('should generate different strings on each call', () => {
      const str1 = generateRandomString(32)
      const str2 = generateRandomString(32)
      const str3 = generateRandomString(32)

      expect(str1).not.toBe(str2)
      expect(str2).not.toBe(str3)
      expect(str1).not.toBe(str3)
    })

    it('should handle length of 1', () => {
      const str = generateRandomString(1)
      expect(str.length).toBe(1)
    })

    it('should handle very large lengths', () => {
      const str = generateRandomString(200)
      expect(str.length).toBe(200)
    })
  })

  describe('generateUuid', () => {
    it('should generate valid UUID v4 format', () => {
      const uuid = generateUuid()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is 8, 9, a, or b
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuid).toMatch(uuidRegex)
    })

    it('should include version 4 identifier', () => {
      const uuid = generateUuid()
      // Character at position 14 should be '4'
      expect(uuid[14]).toBe('4')
    })

    it('should include correct variant bits', () => {
      const uuid = generateUuid()
      // Character at position 19 should be 8, 9, a, or b
      const variantChar = uuid[19]?.toLowerCase()
      expect(['8', '9', 'a', 'b']).toContain(variantChar)
    })

    it('should generate different UUIDs on each call', () => {
      const uuid1 = generateUuid()
      const uuid2 = generateUuid()
      const uuid3 = generateUuid()

      expect(uuid1).not.toBe(uuid2)
      expect(uuid2).not.toBe(uuid3)
      expect(uuid1).not.toBe(uuid3)
    })

    it('should have correct structure with dashes', () => {
      const uuid = generateUuid()
      const parts = uuid.split('-')

      expect(parts.length).toBe(5)
      expect(parts[0]?.length).toBe(8)
      expect(parts[1]?.length).toBe(4)
      expect(parts[2]?.length).toBe(4)
      expect(parts[3]?.length).toBe(4)
      expect(parts[4]?.length).toBe(12)
    })

    it('should only contain hex characters and dashes', () => {
      const uuid = generateUuid()
      const hexRegex = /^[0-9a-f-]+$/i
      expect(uuid).toMatch(hexRegex)
    })

    it('should use crypto.randomUUID if available', () => {
      // Save original
      const originalRandomUUID = crypto.randomUUID

      try {
        // Mock crypto.randomUUID
        const mockUUID = '550e8400-e29b-41d4-a716-446655440000'
        crypto.randomUUID = vi.fn().mockReturnValue(mockUUID)

        const uuid = generateUuid()
        expect(uuid).toBe(mockUUID)
        expect(crypto.randomUUID).toHaveBeenCalled()
      } finally {
        // Restore original
        crypto.randomUUID = originalRandomUUID
      }
    })

    it('should fallback to manual generation if randomUUID unavailable', () => {
      // Save original
      const originalRandomUUID = crypto.randomUUID

      try {
        // Remove crypto.randomUUID
        ;(crypto as any).randomUUID = undefined

        const uuid = generateUuid()

        // Should still generate valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        expect(uuid).toMatch(uuidRegex)
      } finally {
        // Restore original
        crypto.randomUUID = originalRandomUUID
      }
    })
  })

  describe('integration scenarios', () => {
    it('should generate valid PKCE pair', async () => {
      // Generate verifier and challenge
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)

      // Verifier validations
      expect(verifier.length).toBeGreaterThanOrEqual(43)
      expect(verifier.length).toBeLessThanOrEqual(128)

      // Challenge validations
      expect(challenge.length).toBe(43)

      // Both should be base64url
      const base64UrlRegex = /^[A-Za-z0-9\-_]+$/
      expect(verifier).toMatch(base64UrlRegex)
      expect(challenge).toMatch(base64UrlRegex)
    })

    it('should generate multiple unique PKCE pairs', async () => {
      const pair1 = {
        verifier: generateCodeVerifier(),
        challenge: '',
      }
      pair1.challenge = await generateCodeChallenge(pair1.verifier)

      const pair2 = {
        verifier: generateCodeVerifier(),
        challenge: '',
      }
      pair2.challenge = await generateCodeChallenge(pair2.verifier)

      // Verifiers should be different
      expect(pair1.verifier).not.toBe(pair2.verifier)

      // Challenges should be different
      expect(pair1.challenge).not.toBe(pair2.challenge)
    })

    it('should generate state and nonce for OAuth flow', () => {
      const state = generateRandomString(32)
      const nonce = generateRandomString(32)

      expect(state.length).toBe(32)
      expect(nonce.length).toBe(32)
      expect(state).not.toBe(nonce)
    })

    it('should generate correlation IDs', () => {
      const requestId = generateUuid()
      const correlationId = generateUuid()

      expect(requestId).toMatch(/^[0-9a-f-]+$/i)
      expect(correlationId).toMatch(/^[0-9a-f-]+$/i)
      expect(requestId).not.toBe(correlationId)
    })
  })
})
