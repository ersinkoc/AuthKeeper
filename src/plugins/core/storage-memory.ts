/**
 * Memory Storage Plugin
 *
 * Core plugin for in-memory token storage.
 * - Most secure (not accessible via XSS)
 * - Lost on page refresh
 * - Not shared across tabs
 */

import type { StorageAdapter } from '../../types'

/**
 * Memory Storage Options
 */
export interface MemoryStorageOptions {
  prefix?: string
}

/**
 * Memory Storage Adapter
 *
 * Stores data in a Map (in memory).
 * Data is lost on page refresh.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, string> = new Map()
  private prefix: string

  constructor(options: MemoryStorageOptions = {}) {
    this.prefix = options.prefix || 'authkeeper:'
  }

  /**
   * Get value by key
   */
  get(key: string): string | null {
    return this.store.get(this.prefix + key) || null
  }

  /**
   * Set value by key
   */
  set(key: string, value: string): void {
    this.store.set(this.prefix + key, value)
  }

  /**
   * Remove value by key
   */
  remove(key: string): void {
    this.store.delete(this.prefix + key)
  }

  /**
   * Clear all values
   */
  clear(): void {
    // Clear only keys with our prefix
    const keysToDelete: string[] = []
    for (const key of this.store.keys()) {
      if (key.startsWith(this.prefix)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((key) => this.store.delete(key))
  }
}

/**
 * Create memory storage adapter
 */
export function createMemoryStorage(options?: MemoryStorageOptions): MemoryStorageAdapter {
  return new MemoryStorageAdapter(options)
}
