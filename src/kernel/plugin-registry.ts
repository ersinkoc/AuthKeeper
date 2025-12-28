/**
 * Plugin Registry
 *
 * Manages plugin registration, installation, and lifecycle.
 */

import { AuthError, type Plugin, type PluginInfo, type AuthKeeper } from '../types'

/**
 * Plugin instance with metadata
 */
interface PluginInstance {
  plugin: Plugin
  installed: boolean
  api: any
}

/**
 * PluginRegistry class for managing plugins
 */
export class PluginRegistry {
  private plugins: Map<string, PluginInstance> = new Map()

  /**
   * Register a plugin
   *
   * @param plugin - Plugin to register
   * @throws {AuthError} If plugin with same name already registered
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new AuthError(
        'CONFIG_ERROR',
        `Plugin "${plugin.name}" is already registered`,
        {
          context: { pluginName: plugin.name },
        }
      )
    }

    const instance: PluginInstance = {
      plugin,
      installed: false,
      api: null,
    }

    this.plugins.set(plugin.name, instance)
  }

  /**
   * Install a plugin
   *
   * Calls the plugin's install method and stores the returned API.
   *
   * @param name - Plugin name
   * @param kernel - Kernel instance to pass to plugin
   * @throws {AuthError} If plugin not found or already installed
   */
  async install(name: string, kernel: AuthKeeper): Promise<void> {
    const instance = this.plugins.get(name)

    if (!instance) {
      throw new AuthError('CONFIG_ERROR', `Plugin "${name}" not found`, {
        context: { pluginName: name },
      })
    }

    if (instance.installed) {
      // Already installed, skip
      return
    }

    try {
      // Call plugin's install method
      const api = await instance.plugin.install(kernel)
      instance.api = api || null
      instance.installed = true
    } catch (error) {
      throw new AuthError('CONFIG_ERROR', `Failed to install plugin "${name}"`, {
        cause: error as Error,
        context: { pluginName: name },
      })
    }
  }

  /**
   * Uninstall a plugin
   *
   * Calls the plugin's uninstall method if it exists.
   *
   * @param name - Plugin name
   */
  async uninstall(name: string): Promise<void> {
    const instance = this.plugins.get(name)

    if (!instance) {
      // Plugin not found, nothing to uninstall
      return
    }

    if (instance.installed && instance.plugin.uninstall) {
      try {
        await instance.plugin.uninstall()
      } catch (error) {
        console.error(`[AuthKeeper] Error uninstalling plugin "${name}":`, error)
      }
    }

    this.plugins.delete(name)
  }

  /**
   * Get a plugin by name
   *
   * @param name - Plugin name
   * @returns Plugin or undefined if not found
   */
  get<P extends Plugin>(name: string): P | undefined {
    const instance = this.plugins.get(name)
    return instance?.plugin as P | undefined
  }

  /**
   * Get plugin API by name
   *
   * @param name - Plugin name
   * @returns Plugin API or undefined if not found
   */
  getApi<T = any>(name: string): T | undefined {
    const instance = this.plugins.get(name)
    return instance?.api as T | undefined
  }

  /**
   * Check if a plugin is registered
   *
   * @param name - Plugin name
   * @returns true if plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * Check if a plugin is installed
   *
   * @param name - Plugin name
   * @returns true if plugin is installed
   */
  isInstalled(name: string): boolean {
    const instance = this.plugins.get(name)
    return instance?.installed || false
  }

  /**
   * List all plugins
   *
   * @returns Array of plugin information
   */
  list(): PluginInfo[] {
    return Array.from(this.plugins.entries()).map(([name, instance]) => ({
      name,
      version: instance.plugin.version,
      type: instance.plugin.type,
      enabled: instance.installed,
    }))
  }

  /**
   * Get all plugin names
   *
   * @returns Array of plugin names
   */
  getNames(): string[] {
    return Array.from(this.plugins.keys())
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear()
  }
}
