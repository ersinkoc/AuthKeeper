/**
 * Tests for MemoryStorageAdapter
 */

import { MemoryStorageAdapter, createMemoryStorage } from '../../../../src/plugins/core/storage-memory'

describe('MemoryStorageAdapter', () => {
  let storage: MemoryStorageAdapter

  beforeEach(() => {
    storage = new MemoryStorageAdapter()
  })

  describe('constructor', () => {
    it('should use default prefix', () => {
      storage.set('test', 'value')
      expect(storage.get('test')).toBe('value')
    })

    it('should use custom prefix', () => {
      const customStorage = new MemoryStorageAdapter({ prefix: 'custom:' })
      customStorage.set('test', 'value')
      expect(customStorage.get('test')).toBe('value')
    })
  })

  describe('get()', () => {
    it('should return value for existing key', () => {
      storage.set('key1', 'value1')
      expect(storage.get('key1')).toBe('value1')
    })

    it('should return null for non-existent key', () => {
      expect(storage.get('nonexistent')).toBeNull()
    })

    it('should return null for empty string (falsy handling)', () => {
      // Implementation uses || null, so empty string becomes null
      storage.set('empty', '')
      expect(storage.get('empty')).toBeNull()
    })

    it('should handle string with special characters', () => {
      const specialValue = 'value with 特殊字符 and émojis 🎉'
      storage.set('special', specialValue)
      expect(storage.get('special')).toBe(specialValue)
    })

    it('should handle JSON strings', () => {
      const jsonValue = JSON.stringify({ key: 'value', nested: { data: 123 } })
      storage.set('json', jsonValue)
      expect(storage.get('json')).toBe(jsonValue)
    })
  })

  describe('set()', () => {
    it('should store value', () => {
      storage.set('test', 'value')
      expect(storage.get('test')).toBe('value')
    })

    it('should overwrite existing value', () => {
      storage.set('key', 'value1')
      expect(storage.get('key')).toBe('value1')

      storage.set('key', 'value2')
      expect(storage.get('key')).toBe('value2')
    })

    it('should store multiple keys independently', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      storage.set('key3', 'value3')

      expect(storage.get('key1')).toBe('value1')
      expect(storage.get('key2')).toBe('value2')
      expect(storage.get('key3')).toBe('value3')
    })

    it('should handle long values', () => {
      const longValue = 'a'.repeat(10000)
      storage.set('long', longValue)
      expect(storage.get('long')).toBe(longValue)
    })

    it('should handle keys with special characters', () => {
      storage.set('key:with:colons', 'value')
      storage.set('key-with-dashes', 'value')
      storage.set('key.with.dots', 'value')

      expect(storage.get('key:with:colons')).toBe('value')
      expect(storage.get('key-with-dashes')).toBe('value')
      expect(storage.get('key.with.dots')).toBe('value')
    })
  })

  describe('remove()', () => {
    it('should remove existing key', () => {
      storage.set('test', 'value')
      expect(storage.get('test')).toBe('value')

      storage.remove('test')
      expect(storage.get('test')).toBeNull()
    })

    it('should not throw for non-existent key', () => {
      expect(() => storage.remove('nonexistent')).not.toThrow()
    })

    it('should only remove specified key', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      storage.set('key3', 'value3')

      storage.remove('key2')

      expect(storage.get('key1')).toBe('value1')
      expect(storage.get('key2')).toBeNull()
      expect(storage.get('key3')).toBe('value3')
    })

    it('should allow re-setting after removal', () => {
      storage.set('test', 'value1')
      storage.remove('test')
      storage.set('test', 'value2')

      expect(storage.get('test')).toBe('value2')
    })
  })

  describe('clear()', () => {
    it('should remove all keys', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      storage.set('key3', 'value3')

      storage.clear()

      expect(storage.get('key1')).toBeNull()
      expect(storage.get('key2')).toBeNull()
      expect(storage.get('key3')).toBeNull()
    })

    it('should not throw when storage is empty', () => {
      expect(() => storage.clear()).not.toThrow()
    })

    it('should allow setting values after clear', () => {
      storage.set('key1', 'value1')
      storage.clear()
      storage.set('key2', 'value2')

      expect(storage.get('key1')).toBeNull()
      expect(storage.get('key2')).toBe('value2')
    })

    it('should only clear keys with matching prefix', () => {
      const storage1 = new MemoryStorageAdapter({ prefix: 'app1:' })
      const storage2 = new MemoryStorageAdapter({ prefix: 'app2:' })

      storage1.set('test', 'value1')
      storage2.set('test', 'value2')

      storage1.clear()

      expect(storage1.get('test')).toBeNull()
      expect(storage2.get('test')).toBe('value2')
    })
  })

  describe('prefix isolation', () => {
    it('should isolate different prefixes', () => {
      const storage1 = new MemoryStorageAdapter({ prefix: 'app1:' })
      const storage2 = new MemoryStorageAdapter({ prefix: 'app2:' })

      storage1.set('shared-key', 'value1')
      storage2.set('shared-key', 'value2')

      expect(storage1.get('shared-key')).toBe('value1')
      expect(storage2.get('shared-key')).toBe('value2')
    })

    it('should not interfere when removing keys', () => {
      const storage1 = new MemoryStorageAdapter({ prefix: 'app1:' })
      const storage2 = new MemoryStorageAdapter({ prefix: 'app2:' })

      storage1.set('key', 'value1')
      storage2.set('key', 'value2')

      storage1.remove('key')

      expect(storage1.get('key')).toBeNull()
      expect(storage2.get('key')).toBe('value2')
    })

    it('should not interfere when clearing', () => {
      const storage1 = new MemoryStorageAdapter({ prefix: 'app1:' })
      const storage2 = new MemoryStorageAdapter({ prefix: 'app2:' })

      storage1.set('key1', 'value1')
      storage1.set('key2', 'value2')
      storage2.set('key1', 'value3')
      storage2.set('key2', 'value4')

      storage1.clear()

      expect(storage1.get('key1')).toBeNull()
      expect(storage1.get('key2')).toBeNull()
      expect(storage2.get('key1')).toBe('value3')
      expect(storage2.get('key2')).toBe('value4')
    })

    it('should handle empty prefix', () => {
      const storage = new MemoryStorageAdapter({ prefix: '' })
      storage.set('test', 'value')
      expect(storage.get('test')).toBe('value')
    })
  })

  describe('createMemoryStorage()', () => {
    it('should create storage instance', () => {
      const created = createMemoryStorage()
      expect(created).toBeInstanceOf(MemoryStorageAdapter)
    })

    it('should accept options', () => {
      const created = createMemoryStorage({ prefix: 'custom:' })
      created.set('test', 'value')
      expect(created.get('test')).toBe('value')
    })

    it('should create independent instances', () => {
      const storage1 = createMemoryStorage({ prefix: 'store1:' })
      const storage2 = createMemoryStorage({ prefix: 'store2:' })

      storage1.set('key', 'value1')
      storage2.set('key', 'value2')

      expect(storage1.get('key')).toBe('value1')
      expect(storage2.get('key')).toBe('value2')
    })
  })

  describe('integration scenarios', () => {
    it('should handle typical token storage workflow', () => {
      const tokenStorage = new MemoryStorageAdapter({ prefix: 'auth:' })

      // Store tokens
      tokenStorage.set('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
      tokenStorage.set('refresh_token', 'refresh_abc123')
      tokenStorage.set('token_type', 'Bearer')

      // Retrieve tokens
      expect(tokenStorage.get('access_token')).toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      expect(tokenStorage.get('refresh_token')).toBe('refresh_abc123')
      expect(tokenStorage.get('token_type')).toBe('Bearer')

      // Update access token
      tokenStorage.set('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...new')
      expect(tokenStorage.get('access_token')).toContain('new')

      // Clear all tokens
      tokenStorage.clear()
      expect(tokenStorage.get('access_token')).toBeNull()
      expect(tokenStorage.get('refresh_token')).toBeNull()
      expect(tokenStorage.get('token_type')).toBeNull()
    })

    it('should handle JSON serialized data', () => {
      const data = {
        user: { id: '123', name: 'Test User' },
        settings: { theme: 'dark', lang: 'en' },
        permissions: ['read', 'write'],
      }

      storage.set('user_data', JSON.stringify(data))

      const retrieved = storage.get('user_data')
      expect(retrieved).not.toBeNull()
      expect(JSON.parse(retrieved!)).toEqual(data)
    })

    it('should handle rapid set/get operations', () => {
      for (let i = 0; i < 1000; i++) {
        storage.set(`key${i}`, `value${i}`)
      }

      for (let i = 0; i < 1000; i++) {
        expect(storage.get(`key${i}`)).toBe(`value${i}`)
      }

      storage.clear()

      for (let i = 0; i < 1000; i++) {
        expect(storage.get(`key${i}`)).toBeNull()
      }
    })

    it('should maintain data integrity across operations', () => {
      const testData = [
        { key: 'token', value: 'abc123' },
        { key: 'user_id', value: '456' },
        { key: 'session', value: 'xyz789' },
      ]

      // Set all
      testData.forEach(({ key, value }) => storage.set(key, value))

      // Verify all
      testData.forEach(({ key, value }) => {
        expect(storage.get(key)).toBe(value)
      })

      // Remove one
      storage.remove('user_id')

      // Verify remaining
      expect(storage.get('token')).toBe('abc123')
      expect(storage.get('user_id')).toBeNull()
      expect(storage.get('session')).toBe('xyz789')

      // Clear
      storage.clear()

      // Verify all gone
      testData.forEach(({ key }) => {
        expect(storage.get(key)).toBeNull()
      })
    })
  })

  describe('memory characteristics', () => {
    it('should not persist across storage instances without sharing', () => {
      const storage1 = new MemoryStorageAdapter({ prefix: 'test:' })
      const storage2 = new MemoryStorageAdapter({ prefix: 'test:' })

      storage1.set('key', 'value1')

      // Different Map instance, so not shared
      expect(storage2.get('key')).toBeNull()
    })

    it('should lose data when instance is garbage collected', () => {
      let tempStorage: MemoryStorageAdapter | null = new MemoryStorageAdapter()
      tempStorage.set('temp', 'value')

      // Clear reference
      tempStorage = null

      // New instance won't have the data
      const newStorage = new MemoryStorageAdapter()
      expect(newStorage.get('temp')).toBeNull()
    })
  })
})
