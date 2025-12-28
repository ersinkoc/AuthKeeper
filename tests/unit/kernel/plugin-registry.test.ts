/**
 * Tests for PluginRegistry
 */

import { vi } from 'vitest'
import { PluginRegistry } from '../../../src/kernel/plugin-registry'
import { AuthError } from '../../../src/types'
import type { Plugin, AuthKeeper } from '../../../src/types'

describe('PluginRegistry', () => {
  let registry: PluginRegistry
  let mockKernel: AuthKeeper

  // Mock plugins for testing
  const createMockPlugin = (name: string, options: Partial<Plugin> = {}): Plugin => ({
    name,
    version: '1.0.0',
    type: 'core',
    install: vi.fn().mockResolvedValue({ api: 'test' }),
    uninstall: vi.fn(),
    ...options,
  })

  beforeEach(() => {
    registry = new PluginRegistry()
    mockKernel = {} as AuthKeeper
  })

  describe('register()', () => {
    it('should register a plugin', () => {
      const plugin = createMockPlugin('test-plugin')

      expect(() => registry.register(plugin)).not.toThrow()
      expect(registry.has('test-plugin')).toBe(true)
    })

    it('should register multiple plugins', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')
      const plugin3 = createMockPlugin('plugin-3')

      registry.register(plugin1)
      registry.register(plugin2)
      registry.register(plugin3)

      expect(registry.has('plugin-1')).toBe(true)
      expect(registry.has('plugin-2')).toBe(true)
      expect(registry.has('plugin-3')).toBe(true)
    })

    it('should throw error for duplicate plugin name', () => {
      const plugin1 = createMockPlugin('duplicate')
      const plugin2 = createMockPlugin('duplicate')

      registry.register(plugin1)

      expect(() => registry.register(plugin2)).toThrow('already registered')
    })

    it('should set plugin as not installed initially', () => {
      const plugin = createMockPlugin('test')

      registry.register(plugin)

      expect(registry.isInstalled('test')).toBe(false)
    })

    it('should store plugin with correct metadata', () => {
      const plugin = createMockPlugin('test', {
        version: '2.5.0',
        type: 'optional',
      })

      registry.register(plugin)

      const stored = registry.get('test')
      expect(stored).toBe(plugin)
      expect(stored?.version).toBe('2.5.0')
      expect(stored?.type).toBe('optional')
    })
  })

  describe('install()', () => {
    it('should install a registered plugin', async () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)

      await registry.install('test', mockKernel)

      expect(plugin.install).toHaveBeenCalledWith(mockKernel)
      expect(registry.isInstalled('test')).toBe(true)
    })

    it('should store plugin API after installation', async () => {
      const mockApi = { method: vi.fn(), data: 'test' }
      const plugin = createMockPlugin('test', {
        install: vi.fn().mockResolvedValue(mockApi),
      })

      registry.register(plugin)
      await registry.install('test', mockKernel)

      const api = registry.getApi('test')
      expect(api).toBe(mockApi)
    })

    it('should handle plugin with no API return value', async () => {
      const plugin = createMockPlugin('test', {
        install: vi.fn().mockResolvedValue(undefined),
      })

      registry.register(plugin)
      await registry.install('test', mockKernel)

      expect(registry.isInstalled('test')).toBe(true)
      expect(registry.getApi('test')).toBeNull()
    })

    it('should throw error for non-existent plugin', async () => {
      await expect(registry.install('non-existent', mockKernel)).rejects.toThrow('not found')
    })

    it('should skip installation if already installed', async () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)

      await registry.install('test', mockKernel)
      await registry.install('test', mockKernel)

      // Should only call install once
      expect(plugin.install).toHaveBeenCalledTimes(1)
    })

    it('should throw error if plugin install fails', async () => {
      const error = new Error('Install failed')
      const plugin = createMockPlugin('test', {
        install: vi.fn().mockRejectedValue(error),
      })

      registry.register(plugin)

      await expect(registry.install('test', mockKernel)).rejects.toThrow('Failed to install')
      expect(registry.isInstalled('test')).toBe(false)
    })

    it('should wrap install errors with plugin name context', async () => {
      const originalError = new Error('Original error')
      const plugin = createMockPlugin('test-plugin', {
        install: vi.fn().mockRejectedValue(originalError),
      })

      registry.register(plugin)

      try {
        await registry.install('test-plugin', mockKernel)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('Failed to install plugin')
        expect(err.cause).toBe(originalError)
        expect(err.context?.pluginName).toBe('test-plugin')
      }
    })

    it('should handle async install functions', async () => {
      const plugin = createMockPlugin('async-plugin', {
        install: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return { async: true }
        }),
      })

      registry.register(plugin)

      await registry.install('async-plugin', mockKernel)

      expect(registry.isInstalled('async-plugin')).toBe(true)
      expect(registry.getApi('async-plugin')).toEqual({ async: true })
    })
  })

  describe('uninstall()', () => {
    it('should uninstall a plugin', async () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)
      await registry.install('test', mockKernel)

      await registry.uninstall('test')

      expect(plugin.uninstall).toHaveBeenCalled()
      expect(registry.has('test')).toBe(false)
    })

    it('should handle uninstalling non-existent plugin gracefully', async () => {
      await expect(registry.uninstall('non-existent')).resolves.not.toThrow()
    })

    it('should handle plugin without uninstall method', async () => {
      const plugin = createMockPlugin('test', {
        uninstall: undefined,
      })

      registry.register(plugin)
      await registry.install('test', mockKernel)

      await expect(registry.uninstall('test')).resolves.not.toThrow()
      expect(registry.has('test')).toBe(false)
    })

    it('should handle errors in uninstall method gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = createMockPlugin('test', {
        uninstall: vi.fn().mockRejectedValue(new Error('Uninstall error')),
      })

      registry.register(plugin)
      await registry.install('test', mockKernel)

      await expect(registry.uninstall('test')).resolves.not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(registry.has('test')).toBe(false)

      consoleErrorSpy.mockRestore()
    })

    it('should not call uninstall if plugin not installed', async () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)

      // Not installed yet
      await registry.uninstall('test')

      expect(plugin.uninstall).not.toHaveBeenCalled()
      expect(registry.has('test')).toBe(false)
    })

    it('should remove plugin from registry', async () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)
      await registry.install('test', mockKernel)

      expect(registry.has('test')).toBe(true)

      await registry.uninstall('test')

      expect(registry.has('test')).toBe(false)
      expect(registry.get('test')).toBeUndefined()
      expect(registry.getApi('test')).toBeUndefined()
    })
  })

  describe('get()', () => {
    it('should return plugin by name', () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)

      const retrieved = registry.get('test')
      expect(retrieved).toBe(plugin)
    })

    it('should return undefined for non-existent plugin', () => {
      expect(registry.get('non-existent')).toBeUndefined()
    })

    it('should support generic type parameter', () => {
      interface CustomPlugin extends Plugin {
        customMethod: () => void
      }

      const plugin = createMockPlugin('custom', {
        customMethod: vi.fn(),
      }) as CustomPlugin

      registry.register(plugin)

      const retrieved = registry.get<CustomPlugin>('custom')
      expect(retrieved).toBe(plugin)
      expect(retrieved?.customMethod).toBeDefined()
    })
  })

  describe('getApi()', () => {
    it('should return plugin API after installation', async () => {
      const mockApi = { test: 'value' }
      const plugin = createMockPlugin('test', {
        install: vi.fn().mockResolvedValue(mockApi),
      })

      registry.register(plugin)
      await registry.install('test', mockKernel)

      expect(registry.getApi('test')).toBe(mockApi)
    })

    it('should return undefined for non-existent plugin', () => {
      expect(registry.getApi('non-existent')).toBeUndefined()
    })

    it('should return undefined for non-installed plugin', () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)

      // API is undefined before installation (instance.api is null initially)
      const api = registry.getApi('test')
      expect(api === null || api === undefined).toBe(true)
    })

    it('should support generic type parameter', async () => {
      interface CustomApi {
        method: () => string
      }

      const mockApi: CustomApi = {
        method: () => 'test',
      }

      const plugin = createMockPlugin('test', {
        install: vi.fn().mockResolvedValue(mockApi),
      })

      registry.register(plugin)
      await registry.install('test', mockKernel)

      const api = registry.getApi<CustomApi>('test')
      expect(api?.method()).toBe('test')
    })
  })

  describe('has()', () => {
    it('should return true for registered plugin', () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)

      expect(registry.has('test')).toBe(true)
    })

    it('should return false for non-registered plugin', () => {
      expect(registry.has('non-existent')).toBe(false)
    })

    it('should return true for both installed and non-installed plugins', async () => {
      const plugin1 = createMockPlugin('installed')
      const plugin2 = createMockPlugin('not-installed')

      registry.register(plugin1)
      registry.register(plugin2)
      await registry.install('installed', mockKernel)

      expect(registry.has('installed')).toBe(true)
      expect(registry.has('not-installed')).toBe(true)
    })
  })

  describe('isInstalled()', () => {
    it('should return false for non-registered plugin', () => {
      expect(registry.isInstalled('non-existent')).toBe(false)
    })

    it('should return false for registered but not installed plugin', () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)

      expect(registry.isInstalled('test')).toBe(false)
    })

    it('should return true for installed plugin', async () => {
      const plugin = createMockPlugin('test')
      registry.register(plugin)
      await registry.install('test', mockKernel)

      expect(registry.isInstalled('test')).toBe(true)
    })
  })

  describe('list()', () => {
    it('should return empty array when no plugins', () => {
      expect(registry.list()).toEqual([])
    })

    it('should return array of plugin info', () => {
      const plugin1 = createMockPlugin('plugin-1', { version: '1.0.0', type: 'core' })
      const plugin2 = createMockPlugin('plugin-2', { version: '2.5.0', type: 'optional' })

      registry.register(plugin1)
      registry.register(plugin2)

      const list = registry.list()

      expect(list).toHaveLength(2)
      expect(list).toContainEqual({
        name: 'plugin-1',
        version: '1.0.0',
        type: 'core',
        enabled: false,
      })
      expect(list).toContainEqual({
        name: 'plugin-2',
        version: '2.5.0',
        type: 'optional',
        enabled: false,
      })
    })

    it('should show enabled status correctly', async () => {
      const plugin1 = createMockPlugin('installed')
      const plugin2 = createMockPlugin('not-installed')

      registry.register(plugin1)
      registry.register(plugin2)
      await registry.install('installed', mockKernel)

      const list = registry.list()

      const installedInfo = list.find((p) => p.name === 'installed')
      const notInstalledInfo = list.find((p) => p.name === 'not-installed')

      expect(installedInfo?.enabled).toBe(true)
      expect(notInstalledInfo?.enabled).toBe(false)
    })
  })

  describe('getNames()', () => {
    it('should return empty array when no plugins', () => {
      expect(registry.getNames()).toEqual([])
    })

    it('should return array of plugin names', () => {
      registry.register(createMockPlugin('plugin-1'))
      registry.register(createMockPlugin('plugin-2'))
      registry.register(createMockPlugin('plugin-3'))

      const names = registry.getNames()

      expect(names).toHaveLength(3)
      expect(names).toContain('plugin-1')
      expect(names).toContain('plugin-2')
      expect(names).toContain('plugin-3')
    })
  })

  describe('clear()', () => {
    it('should remove all plugins', () => {
      registry.register(createMockPlugin('plugin-1'))
      registry.register(createMockPlugin('plugin-2'))
      registry.register(createMockPlugin('plugin-3'))

      expect(registry.getNames()).toHaveLength(3)

      registry.clear()

      expect(registry.getNames()).toHaveLength(0)
      expect(registry.list()).toEqual([])
    })

    it('should clear both installed and non-installed plugins', async () => {
      const plugin1 = createMockPlugin('installed')
      const plugin2 = createMockPlugin('not-installed')

      registry.register(plugin1)
      registry.register(plugin2)
      await registry.install('installed', mockKernel)

      registry.clear()

      expect(registry.has('installed')).toBe(false)
      expect(registry.has('not-installed')).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete plugin lifecycle', async () => {
      const plugin = createMockPlugin('lifecycle-test')

      // Register
      registry.register(plugin)
      expect(registry.has('lifecycle-test')).toBe(true)
      expect(registry.isInstalled('lifecycle-test')).toBe(false)

      // Install
      await registry.install('lifecycle-test', mockKernel)
      expect(registry.isInstalled('lifecycle-test')).toBe(true)
      expect(plugin.install).toHaveBeenCalledWith(mockKernel)

      // Get API
      const api = registry.getApi('lifecycle-test')
      expect(api).toBeDefined()

      // Uninstall
      await registry.uninstall('lifecycle-test')
      expect(registry.has('lifecycle-test')).toBe(false)
      expect(plugin.uninstall).toHaveBeenCalled()
    })

    it('should manage multiple plugins independently', async () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')
      const plugin3 = createMockPlugin('plugin-3')

      registry.register(plugin1)
      registry.register(plugin2)
      registry.register(plugin3)

      await registry.install('plugin-1', mockKernel)
      await registry.install('plugin-3', mockKernel)

      expect(registry.isInstalled('plugin-1')).toBe(true)
      expect(registry.isInstalled('plugin-2')).toBe(false)
      expect(registry.isInstalled('plugin-3')).toBe(true)

      await registry.uninstall('plugin-1')

      expect(registry.has('plugin-1')).toBe(false)
      expect(registry.has('plugin-2')).toBe(true)
      expect(registry.has('plugin-3')).toBe(true)
    })

    it('should handle plugin registration order', () => {
      registry.register(createMockPlugin('first'))
      registry.register(createMockPlugin('second'))
      registry.register(createMockPlugin('third'))

      const names = registry.getNames()

      expect(names[0]).toBe('first')
      expect(names[1]).toBe('second')
      expect(names[2]).toBe('third')
    })
  })
})
