/**
 * Tests for storage utilities
 */

import { vi } from 'vitest'
import {
  isStorageAvailable,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
} from '../../../src/utils/storage'
import type { StorageAdapter } from '../../../src/types'

describe('storage utilities', () => {
  describe('isStorageAvailable()', () => {
    it('should return false for undefined storage', () => {
      expect(isStorageAvailable(undefined)).toBe(false)
    })

    it('should return true for working storage', () => {
      const storage: Storage = {
        length: 0,
        clear: vi.fn(),
        getItem: vi.fn(),
        key: vi.fn(),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      }

      expect(isStorageAvailable(storage)).toBe(true)
      expect(storage.setItem).toHaveBeenCalledWith('__storage_test__', 'test')
      expect(storage.removeItem).toHaveBeenCalledWith('__storage_test__')
    })

    it('should return false when setItem throws', () => {
      const storage: Storage = {
        length: 0,
        clear: vi.fn(),
        getItem: vi.fn(),
        key: vi.fn(),
        removeItem: vi.fn(),
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('Quota exceeded')
        }),
      }

      expect(isStorageAvailable(storage)).toBe(false)
    })

    it('should return false when removeItem throws', () => {
      const storage: Storage = {
        length: 0,
        clear: vi.fn(),
        getItem: vi.fn(),
        key: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        }),
      }

      expect(isStorageAvailable(storage)).toBe(false)
    })

    it('should work with real localStorage-like object', () => {
      const mockStorage: Storage = {
        length: 0,
        data: {} as Record<string, string>,
        setItem(key: string, value: string) {
          this.data[key] = value
        },
        getItem(key: string) {
          return this.data[key] || null
        },
        removeItem(key: string) {
          delete this.data[key]
        },
        clear() {
          this.data = {}
        },
        key(index: number) {
          return Object.keys(this.data)[index] || null
        },
      }

      expect(isStorageAvailable(mockStorage)).toBe(true)
    })
  })

  describe('safeGetItem()', () => {
    it('should get value from storage', () => {
      const storage: StorageAdapter = {
        get: vi.fn().mockReturnValue('test-value'),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeGetItem(storage, 'test-key')

      expect(result).toBe('test-value')
      expect(storage.get).toHaveBeenCalledWith('test-key')
    })

    it('should return null when get throws error', () => {
      const storage: StorageAdapter = {
        get: vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        }),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeGetItem(storage, 'test-key')

      expect(result).toBeNull()
    })

    it('should return null for non-existent key', () => {
      const storage: StorageAdapter = {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeGetItem(storage, 'nonexistent')

      expect(result).toBeNull()
    })

    it('should handle DOMException errors', () => {
      const storage: StorageAdapter = {
        get: vi.fn().mockImplementation(() => {
          const error: any = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeGetItem(storage, 'test-key')

      expect(result).toBeNull()
    })
  })

  describe('safeSetItem()', () => {
    it('should set value in storage', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeSetItem(storage, 'test-key', 'test-value')

      expect(result).toBe(true)
      expect(storage.set).toHaveBeenCalledWith('test-key', 'test-value')
    })

    it('should return false when set throws error', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn().mockImplementation(() => {
          throw new Error('Quota exceeded')
        }),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeSetItem(storage, 'test-key', 'test-value')

      expect(result).toBe(false)
    })

    it('should handle empty string value', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeSetItem(storage, 'test-key', '')

      expect(result).toBe(true)
      expect(storage.set).toHaveBeenCalledWith('test-key', '')
    })

    it('should handle large values', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const largeValue = 'x'.repeat(10000)
      const result = safeSetItem(storage, 'large-key', largeValue)

      expect(result).toBe(true)
      expect(storage.set).toHaveBeenCalledWith('large-key', largeValue)
    })

    it('should handle JSON strings', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const jsonValue = JSON.stringify({ key: 'value', nested: { data: 123 } })
      const result = safeSetItem(storage, 'json-key', jsonValue)

      expect(result).toBe(true)
      expect(storage.set).toHaveBeenCalledWith('json-key', jsonValue)
    })
  })

  describe('safeRemoveItem()', () => {
    it('should remove value from storage', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeRemoveItem(storage, 'test-key')

      expect(result).toBe(true)
      expect(storage.remove).toHaveBeenCalledWith('test-key')
    })

    it('should return false when remove throws error', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        }),
        clear: vi.fn(),
      }

      const result = safeRemoveItem(storage, 'test-key')

      expect(result).toBe(false)
    })

    it('should handle removal of non-existent key', () => {
      const storage: StorageAdapter = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      }

      const result = safeRemoveItem(storage, 'nonexistent')

      expect(result).toBe(true)
      expect(storage.remove).toHaveBeenCalledWith('nonexistent')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete workflow with safe functions', () => {
      const mockData: Record<string, string> = {}
      const storage: StorageAdapter = {
        get: vi.fn().mockImplementation((key: string) => mockData[key] || null),
        set: vi.fn().mockImplementation((key: string, value: string) => {
          mockData[key] = value
        }),
        remove: vi.fn().mockImplementation((key: string) => {
          delete mockData[key]
        }),
        clear: vi.fn().mockImplementation(() => {
          Object.keys(mockData).forEach((key) => delete mockData[key])
        }),
      }

      // Set values
      expect(safeSetItem(storage, 'token', 'abc123')).toBe(true)
      expect(safeSetItem(storage, 'user', 'john')).toBe(true)

      // Get values
      expect(safeGetItem(storage, 'token')).toBe('abc123')
      expect(safeGetItem(storage, 'user')).toBe('john')

      // Remove one value
      expect(safeRemoveItem(storage, 'user')).toBe(true)

      // Verify removal
      expect(safeGetItem(storage, 'token')).toBe('abc123')
      expect(safeGetItem(storage, 'user')).toBeNull()
    })

    it('should handle storage errors gracefully', () => {
      let throwError = false
      const storage: StorageAdapter = {
        get: vi.fn().mockImplementation(() => {
          if (throwError) throw new Error('Storage unavailable')
          return 'value'
        }),
        set: vi.fn().mockImplementation(() => {
          if (throwError) throw new Error('Quota exceeded')
        }),
        remove: vi.fn().mockImplementation(() => {
          if (throwError) throw new Error('Storage unavailable')
        }),
        clear: vi.fn(),
      }

      // Operations succeed initially
      expect(safeGetItem(storage, 'key')).toBe('value')
      expect(safeSetItem(storage, 'key', 'value')).toBe(true)
      expect(safeRemoveItem(storage, 'key')).toBe(true)

      // Enable errors
      throwError = true

      // Operations fail gracefully
      expect(safeGetItem(storage, 'key')).toBeNull()
      expect(safeSetItem(storage, 'key', 'value')).toBe(false)
      expect(safeRemoveItem(storage, 'key')).toBe(false)
    })

    it('should work with storage check workflow', () => {
      const workingStorage: Storage = {
        length: 0,
        data: {} as Record<string, string>,
        setItem(key: string, value: string) {
          this.data[key] = value
        },
        getItem(key: string) {
          return this.data[key] || null
        },
        removeItem(key: string) {
          delete this.data[key]
        },
        clear() {
          this.data = {}
        },
        key(index: number) {
          return Object.keys(this.data)[index] || null
        },
      }

      // Check if available
      expect(isStorageAvailable(workingStorage)).toBe(true)

      // Simulate unavailable storage
      const unavailableStorage: Storage = {
        length: 0,
        clear: vi.fn(),
        getItem: vi.fn(),
        key: vi.fn(),
        removeItem: vi.fn(),
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage disabled')
        }),
      }

      expect(isStorageAvailable(unavailableStorage)).toBe(false)
    })

    it('should handle adapter with failing operations', () => {
      const adapter: StorageAdapter = {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn().mockImplementation(() => {
          throw new Error('Write failed')
        }),
        remove: vi.fn().mockImplementation(() => {
          throw new Error('Delete failed')
        }),
        clear: vi.fn(),
      }

      // All operations should handle errors gracefully
      expect(safeGetItem(adapter, 'key')).toBeNull()
      expect(safeSetItem(adapter, 'key', 'value')).toBe(false)
      expect(safeRemoveItem(adapter, 'key')).toBe(false)

      // Verify methods were called despite errors
      expect(adapter.get).toHaveBeenCalled()
      expect(adapter.set).toHaveBeenCalled()
      expect(adapter.remove).toHaveBeenCalled()
    })
  })
})
