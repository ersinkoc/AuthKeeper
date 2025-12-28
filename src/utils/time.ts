/**
 * Time and expiry utilities
 *
 * Helper functions for working with token expiration times.
 */

/**
 * Check if a timestamp is expired
 *
 * @param expiresAt - Expiration timestamp in milliseconds
 * @param bufferMs - Consider expired if within this many milliseconds (default: 0)
 * @returns true if expired
 */
export function isExpired(expiresAt: number | null | undefined, bufferMs: number = 0): boolean {
  if (!expiresAt) {
    return false
  }

  const now = Date.now()
  return now >= expiresAt - bufferMs
}

/**
 * Get time until expiry in milliseconds
 *
 * @param expiresAt - Expiration timestamp in milliseconds
 * @returns Milliseconds until expiry, or null if no expiry. Returns 0 if already expired.
 */
export function getExpiresIn(expiresAt: number | null | undefined): number | null {
  if (!expiresAt) {
    return null
  }

  const now = Date.now()
  const timeUntil = expiresAt - now
  return Math.max(0, timeUntil)
}

/**
 * Convert seconds to milliseconds
 *
 * @param seconds - Time in seconds
 * @returns Time in milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000
}

/**
 * Convert milliseconds to seconds
 *
 * @param ms - Time in milliseconds
 * @returns Time in seconds
 */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000)
}

/**
 * Calculate expiry timestamp from expiresIn seconds
 *
 * @param expiresIn - Seconds until expiry
 * @returns Expiry timestamp in milliseconds
 */
export function calculateExpiresAt(expiresIn: number): number {
  return Date.now() + secondsToMs(expiresIn)
}

/**
 * Format time remaining as human-readable string
 *
 * @param ms - Milliseconds
 * @returns Formatted string like "5m 30s" or "2h 15m"
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return 'expired'
  }

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return `${seconds}s`
}
