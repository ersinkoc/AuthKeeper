/**
 * Tests for time utilities
 */

import { vi } from 'vitest'
import {
  isExpired,
  getExpiresIn,
  secondsToMs,
  msToSeconds,
  calculateExpiresAt,
  formatTimeRemaining,
} from '../../../src/utils/time'

describe('time utilities', () => {
  let mockNow: number

  beforeEach(() => {
    // Mock Date.now() for consistent testing
    mockNow = 1704067200000 // 2024-01-01 00:00:00 UTC
    vi.spyOn(Date, 'now').mockReturnValue(mockNow)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isExpired', () => {
    it('should return false for null expiresAt', () => {
      expect(isExpired(null)).toBe(false)
    })

    it('should return false for undefined expiresAt', () => {
      expect(isExpired(undefined)).toBe(false)
    })

    it('should return false for future timestamp', () => {
      const futureTime = mockNow + 60000 // 1 minute in future
      expect(isExpired(futureTime)).toBe(false)
    })

    it('should return true for past timestamp', () => {
      const pastTime = mockNow - 60000 // 1 minute in past
      expect(isExpired(pastTime)).toBe(true)
    })

    it('should return true for current timestamp (edge case)', () => {
      expect(isExpired(mockNow)).toBe(true)
    })

    it('should consider buffer when checking expiration', () => {
      const futureTime = mockNow + 5000 // 5 seconds in future

      // Without buffer, not expired
      expect(isExpired(futureTime, 0)).toBe(false)

      // With 10 second buffer, should be considered expired
      expect(isExpired(futureTime, 10000)).toBe(true)

      // With exact buffer, should be expired (edge case)
      expect(isExpired(futureTime, 5000)).toBe(true)

      // With smaller buffer, not expired
      expect(isExpired(futureTime, 4000)).toBe(false)
    })

    it('should handle very large timestamps', () => {
      const farFuture = mockNow + 365 * 24 * 60 * 60 * 1000 // 1 year
      expect(isExpired(farFuture)).toBe(false)
    })

    it('should handle 0 timestamp as no expiry', () => {
      // 0 is falsy, so treated as "no expiry" and returns false
      expect(isExpired(0)).toBe(false)
    })
  })

  describe('getExpiresIn', () => {
    it('should return null for null expiresAt', () => {
      expect(getExpiresIn(null)).toBe(null)
    })

    it('should return null for undefined expiresAt', () => {
      expect(getExpiresIn(undefined)).toBe(null)
    })

    it('should return time remaining in milliseconds', () => {
      const futureTime = mockNow + 60000 // 1 minute
      expect(getExpiresIn(futureTime)).toBe(60000)
    })

    it('should return 0 for already expired token', () => {
      const pastTime = mockNow - 60000 // 1 minute ago
      expect(getExpiresIn(pastTime)).toBe(0)
    })

    it('should return 0 for current timestamp (edge case)', () => {
      expect(getExpiresIn(mockNow)).toBe(0)
    })

    it('should handle very small time differences', () => {
      const almostExpired = mockNow + 100 // 100ms
      expect(getExpiresIn(almostExpired)).toBe(100)
    })

    it('should handle very large time differences', () => {
      const farFuture = mockNow + 365 * 24 * 60 * 60 * 1000 // 1 year
      expect(getExpiresIn(farFuture)).toBe(365 * 24 * 60 * 60 * 1000)
    })
  })

  describe('secondsToMs', () => {
    it('should convert seconds to milliseconds', () => {
      expect(secondsToMs(1)).toBe(1000)
      expect(secondsToMs(60)).toBe(60000)
      expect(secondsToMs(3600)).toBe(3600000)
    })

    it('should handle 0 seconds', () => {
      expect(secondsToMs(0)).toBe(0)
    })

    it('should handle fractional seconds', () => {
      expect(secondsToMs(1.5)).toBe(1500)
      expect(secondsToMs(0.001)).toBe(1)
    })

    it('should handle negative seconds', () => {
      expect(secondsToMs(-10)).toBe(-10000)
    })

    it('should handle very large numbers', () => {
      expect(secondsToMs(86400)).toBe(86400000) // 1 day
    })
  })

  describe('msToSeconds', () => {
    it('should convert milliseconds to seconds', () => {
      expect(msToSeconds(1000)).toBe(1)
      expect(msToSeconds(60000)).toBe(60)
      expect(msToSeconds(3600000)).toBe(3600)
    })

    it('should handle 0 milliseconds', () => {
      expect(msToSeconds(0)).toBe(0)
    })

    it('should floor fractional results', () => {
      expect(msToSeconds(1500)).toBe(1)
      expect(msToSeconds(1999)).toBe(1)
      expect(msToSeconds(999)).toBe(0)
    })

    it('should handle negative milliseconds', () => {
      // Math.floor(-1500 / 1000) = Math.floor(-1.5) = -2
      expect(msToSeconds(-1500)).toBe(-2)
    })

    it('should handle very large numbers', () => {
      expect(msToSeconds(86400000)).toBe(86400) // 1 day
    })
  })

  describe('calculateExpiresAt', () => {
    it('should calculate future timestamp from expiresIn', () => {
      const expiresIn = 3600 // 1 hour
      const expected = mockNow + 3600000
      expect(calculateExpiresAt(expiresIn)).toBe(expected)
    })

    it('should handle 0 expiresIn', () => {
      expect(calculateExpiresAt(0)).toBe(mockNow)
    })

    it('should handle very small expiresIn', () => {
      expect(calculateExpiresAt(1)).toBe(mockNow + 1000)
    })

    it('should handle very large expiresIn', () => {
      const oneYear = 365 * 24 * 60 * 60
      expect(calculateExpiresAt(oneYear)).toBe(mockNow + oneYear * 1000)
    })

    it('should use current time for calculation', () => {
      const expiresIn = 60
      const timestamp1 = calculateExpiresAt(expiresIn)

      // Advance mock time by 10 seconds
      mockNow += 10000
      vi.spyOn(Date, 'now').mockReturnValue(mockNow)

      const timestamp2 = calculateExpiresAt(expiresIn)

      // Second timestamp should be 10 seconds later
      expect(timestamp2 - timestamp1).toBe(10000)
    })
  })

  describe('formatTimeRemaining', () => {
    it('should return "expired" for 0 or negative time', () => {
      expect(formatTimeRemaining(0)).toBe('expired')
      expect(formatTimeRemaining(-1000)).toBe('expired')
      expect(formatTimeRemaining(-60000)).toBe('expired')
    })

    it('should format seconds only', () => {
      expect(formatTimeRemaining(1000)).toBe('1s')
      expect(formatTimeRemaining(30000)).toBe('30s')
      expect(formatTimeRemaining(59000)).toBe('59s')
    })

    it('should format minutes and seconds', () => {
      expect(formatTimeRemaining(60000)).toBe('1m')
      expect(formatTimeRemaining(90000)).toBe('1m 30s')
      expect(formatTimeRemaining(150000)).toBe('2m 30s')
      expect(formatTimeRemaining(3540000)).toBe('59m')
    })

    it('should format hours and minutes', () => {
      expect(formatTimeRemaining(3600000)).toBe('1h')
      expect(formatTimeRemaining(5400000)).toBe('1h 30m')
      expect(formatTimeRemaining(7200000)).toBe('2h')
      expect(formatTimeRemaining(9000000)).toBe('2h 30m')
    })

    it('should format days and hours', () => {
      expect(formatTimeRemaining(86400000)).toBe('1d')
      expect(formatTimeRemaining(90000000)).toBe('1d 1h')
      expect(formatTimeRemaining(172800000)).toBe('2d')
      expect(formatTimeRemaining(183600000)).toBe('2d 3h')
    })

    it('should omit zero components', () => {
      expect(formatTimeRemaining(60000)).toBe('1m') // Not "1m 0s"
      expect(formatTimeRemaining(3600000)).toBe('1h') // Not "1h 0m"
      expect(formatTimeRemaining(86400000)).toBe('1d') // Not "1d 0h"
    })

    it('should handle edge cases near boundaries', () => {
      expect(formatTimeRemaining(999)).toBe('0s')
      expect(formatTimeRemaining(1000)).toBe('1s')
      expect(formatTimeRemaining(59999)).toBe('59s')
      expect(formatTimeRemaining(60000)).toBe('1m')
      expect(formatTimeRemaining(3599999)).toBe('59m 59s')
      expect(formatTimeRemaining(3600000)).toBe('1h')
    })

    it('should handle very large time spans', () => {
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      expect(formatTimeRemaining(oneWeek)).toBe('7d')

      const oneMonth = 30 * 24 * 60 * 60 * 1000
      expect(formatTimeRemaining(oneMonth)).toBe('30d')
    })

    it('should round down partial seconds', () => {
      expect(formatTimeRemaining(1999)).toBe('1s') // 1.999s rounds to 1s
      expect(formatTimeRemaining(59999)).toBe('59s') // 59.999s rounds to 59s
    })
  })

  describe('integration scenarios', () => {
    it('should work together for token expiry checking', () => {
      const expiresIn = 3600 // 1 hour

      // Calculate when token expires
      const expiresAt = calculateExpiresAt(expiresIn)

      // Check if expired (should not be)
      expect(isExpired(expiresAt)).toBe(false)

      // Get time remaining
      const remaining = getExpiresIn(expiresAt)
      expect(remaining).toBe(secondsToMs(expiresIn))

      // Format time
      const formatted = formatTimeRemaining(remaining!)
      expect(formatted).toBe('1h')

      // Advance time by 30 minutes
      mockNow += 30 * 60 * 1000
      vi.spyOn(Date, 'now').mockReturnValue(mockNow)

      // Still not expired
      expect(isExpired(expiresAt)).toBe(false)

      // 30 minutes remaining
      const newRemaining = getExpiresIn(expiresAt)
      expect(newRemaining).toBe(30 * 60 * 1000)
      expect(formatTimeRemaining(newRemaining!)).toBe('30m')

      // Advance past expiry
      mockNow += 31 * 60 * 1000
      vi.spyOn(Date, 'now').mockReturnValue(mockNow)

      // Now expired
      expect(isExpired(expiresAt)).toBe(true)
      expect(getExpiresIn(expiresAt)).toBe(0)
      expect(formatTimeRemaining(getExpiresIn(expiresAt)!)).toBe('expired')
    })

    it('should handle buffer for preemptive refresh', () => {
      const expiresIn = 300 // 5 minutes
      const expiresAt = calculateExpiresAt(expiresIn)
      const refreshBuffer = 60000 // Refresh 1 minute early

      // Initially not expired
      expect(isExpired(expiresAt)).toBe(false)
      expect(isExpired(expiresAt, refreshBuffer)).toBe(false)

      // Advance to 4.5 minutes (still valid, but within buffer)
      mockNow += 4.5 * 60 * 1000
      vi.spyOn(Date, 'now').mockReturnValue(mockNow)

      // Without buffer: not expired
      expect(isExpired(expiresAt)).toBe(false)

      // With buffer: considered expired (should refresh)
      expect(isExpired(expiresAt, refreshBuffer)).toBe(true)

      // Time remaining
      const remaining = getExpiresIn(expiresAt)
      expect(remaining).toBe(30000) // 30 seconds
      expect(formatTimeRemaining(remaining!)).toBe('30s')
    })
  })
})
