/**
 * Storage helper utilities
 *
 * Helper functions for working with storage adapters.
 */

import type { StorageAdapter } from '../types'

/**
 * Check if a storage API is available
 *
 * @param storage - Storage object to check (localStorage, sessionStorage, etc.)
 * @returns true if storage is available and working
 */
export function isStorageAvailable(storage: Storage | undefined): boolean {
  if (!storage) {
    return false
  }

  try {
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Safely get value from storage
 *
 * @param storage - Storage adapter
 * @param key - Storage key
 * @returns Value or null if not found or error
 */
export function safeGetItem(storage: StorageAdapter, key: string): string | null {
  try {
    return storage.get(key)
  } catch {
    return null
  }
}

/**
 * Safely set value in storage
 *
 * @param storage - Storage adapter
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful
 */
export function safeSetItem(storage: StorageAdapter, key: string, value: string): boolean {
  try {
    storage.set(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * Safely remove value from storage
 *
 * @param storage - Storage adapter
 * @param key - Storage key
 * @returns true if successful
 */
export function safeRemoveItem(storage: StorageAdapter, key: string): boolean {
  try {
    storage.remove(key)
    return true
  } catch {
    return false
  }
}
