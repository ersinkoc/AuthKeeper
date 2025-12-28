import {
  base64UrlEncode,
  base64UrlDecode,
  stringToBase64Url,
  base64UrlDecodeToBytes,
} from '../../../src/utils/base64'

describe('base64 utilities', () => {
  describe('base64UrlEncode', () => {
    it('should encode Uint8Array to base64url', () => {
      const data = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
      const encoded = base64UrlEncode(data)
      expect(encoded).toBe('aGVsbG8')
    })

    it('should handle empty array', () => {
      const data = new Uint8Array([])
      const encoded = base64UrlEncode(data)
      expect(encoded).toBe('')
    })

    it('should replace + with - and / with _', () => {
      // Data that would produce + and / in standard base64
      const data = new Uint8Array([251, 255, 191, 255]) // produces +/
      const encoded = base64UrlEncode(data)
      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).toMatch(/^[-_A-Za-z0-9]*$/)
    })

    it('should remove padding', () => {
      const data1 = new Uint8Array([104]) // "h" - would have == padding
      const encoded1 = base64UrlEncode(data1)
      expect(encoded1).not.toContain('=')

      const data2 = new Uint8Array([104, 101]) // "he" - would have = padding
      const encoded2 = base64UrlEncode(data2)
      expect(encoded2).not.toContain('=')
    })

    it('should handle binary data', () => {
      const data = new Uint8Array([0, 1, 2, 3, 255, 254, 253])
      const encoded = base64UrlEncode(data)
      expect(encoded).toBeTruthy()
      expect(typeof encoded).toBe('string')
    })
  })

  describe('base64UrlDecode', () => {
    it('should decode base64url to string', () => {
      const encoded = 'aGVsbG8'
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBe('hello')
    })

    it('should handle empty string', () => {
      const decoded = base64UrlDecode('')
      expect(decoded).toBe('')
    })

    it('should handle strings without padding', () => {
      const decoded1 = base64UrlDecode('aA') // Missing ==
      expect(decoded1).toBeTruthy()

      const decoded2 = base64UrlDecode('aGU') // Missing =
      expect(decoded2).toBeTruthy()
    })

    it('should handle URL-safe characters', () => {
      // Contains - and _ (URL-safe versions of + and /)
      const encoded = 'PDw_Pz4-'
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBeTruthy()
    })

    it('should handle UTF-8 characters', () => {
      const original = 'Hello 世界 🌍'
      const encoded = stringToBase64Url(original)
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBe(original)
    })

    it('should be reverse of encode', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100])
      const encoded = base64UrlEncode(data)
      const decoded = base64UrlDecode(encoded)
      const expected = 'Hello World'
      expect(decoded).toBe(expected)
    })
  })

  describe('stringToBase64Url', () => {
    it('should encode string to base64url', () => {
      const str = 'hello'
      const encoded = stringToBase64Url(str)
      expect(encoded).toBe('aGVsbG8')
    })

    it('should handle empty string', () => {
      const encoded = stringToBase64Url('')
      expect(encoded).toBe('')
    })

    it('should handle UTF-8 strings', () => {
      const str = 'Hello 世界'
      const encoded = stringToBase64Url(str)
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBe(str)
    })

    it('should handle special characters', () => {
      const str = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const encoded = stringToBase64Url(str)
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBe(str)
    })

    it('should handle emoji', () => {
      const str = '🔐🔑🛡️'
      const encoded = stringToBase64Url(str)
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBe(str)
    })
  })

  describe('base64UrlDecodeToBytes', () => {
    it('should decode base64url to Uint8Array', () => {
      const encoded = 'aGVsbG8'
      const decoded = base64UrlDecodeToBytes(encoded)
      expect(decoded).toBeInstanceOf(Uint8Array)
      expect(Array.from(decoded)).toEqual([104, 101, 108, 108, 111])
    })

    it('should handle empty string', () => {
      const decoded = base64UrlDecodeToBytes('')
      expect(decoded).toBeInstanceOf(Uint8Array)
      expect(decoded.length).toBe(0)
    })

    it('should handle binary data', () => {
      const original = new Uint8Array([0, 1, 2, 3, 255, 254, 253])
      const encoded = base64UrlEncode(original)
      const decoded = base64UrlDecodeToBytes(encoded)
      expect(Array.from(decoded)).toEqual(Array.from(original))
    })

    it('should handle strings without padding', () => {
      const decoded1 = base64UrlDecodeToBytes('aA') // Missing ==
      expect(decoded1).toBeInstanceOf(Uint8Array)

      const decoded2 = base64UrlDecodeToBytes('aGU') // Missing =
      expect(decoded2).toBeInstanceOf(Uint8Array)
    })

    it('should be reverse of encode', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const encoded = base64UrlEncode(original)
      const decoded = base64UrlDecodeToBytes(encoded)
      expect(Array.from(decoded)).toEqual(Array.from(original))
    })
  })

  describe('round-trip encoding', () => {
    it('should handle round-trip for various data', () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([0]),
        new Uint8Array([255]),
        new Uint8Array([0, 255]),
        new Uint8Array([1, 2, 3, 4, 5]),
        new Uint8Array(Array.from({ length: 256 }, (_, i) => i)),
      ]

      testCases.forEach((original) => {
        const encoded = base64UrlEncode(original)
        const decoded = base64UrlDecodeToBytes(encoded)
        expect(Array.from(decoded)).toEqual(Array.from(original))
      })
    })

    it('should handle round-trip for various strings', () => {
      const testCases = [
        '',
        'a',
        'hello',
        'Hello World',
        'The quick brown fox jumps over the lazy dog',
        'UTF-8: 世界 мир العالم',
        'Emoji: 🔐🔑🛡️🌍',
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
      ]

      testCases.forEach((original) => {
        const encoded = stringToBase64Url(original)
        const decoded = base64UrlDecode(encoded)
        expect(decoded).toBe(original)
      })
    })
  })

  describe('browser environment (btoa/atob path)', () => {
    const originalWindow = global.window

    beforeAll(() => {
      // Mock browser environment
      ;(global as any).window = {
        btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
        atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
      }
    })

    afterAll(() => {
      global.window = originalWindow
    })

    it('should use btoa/atob in browser environment for encode', () => {
      const data = new Uint8Array([104, 101, 108, 108, 111])
      const encoded = base64UrlEncode(data)
      expect(encoded).toBe('aGVsbG8')
    })

    it('should use btoa/atob in browser environment for decode', () => {
      const encoded = 'aGVsbG8'
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBe('hello')
    })

    it('should use atob in browser environment for decodeToBytes', () => {
      const encoded = 'aGVsbG8'
      const decoded = base64UrlDecodeToBytes(encoded)
      expect(Array.from(decoded)).toEqual([104, 101, 108, 108, 111])
    })

    it('should handle browser round-trip', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5])
      const encoded = base64UrlEncode(original)
      const decoded = base64UrlDecodeToBytes(encoded)
      expect(Array.from(decoded)).toEqual(Array.from(original))
    })
  })
})
