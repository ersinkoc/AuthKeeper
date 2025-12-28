/**
 * Event Bus
 *
 * Pub/sub event system for kernel and plugins.
 * Type-safe event handling with automatic unsubscribe.
 */

import type { AuthEvent, EventType, EventHandler, Unsubscribe } from '../types'

/**
 * EventBus class for managing event subscriptions and emissions
 */
export class EventBus {
  private handlers: Map<EventType, Set<EventHandler<any>>> = new Map()

  /**
   * Subscribe to an event
   *
   * @param eventType - Type of event to listen for
   * @param handler - Handler function to call when event is emitted
   * @returns Unsubscribe function
   */
  on<E extends EventType>(eventType: E, handler: EventHandler<E>): Unsubscribe {
    // Get or create handler set for this event type
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }

    const handlerSet = this.handlers.get(eventType)!
    handlerSet.add(handler)

    // Return unsubscribe function
    return () => this.off(eventType, handler)
  }

  /**
   * Unsubscribe from an event
   *
   * @param eventType - Type of event to stop listening for
   * @param handler - Handler function to remove
   */
  off<E extends EventType>(eventType: E, handler: EventHandler<E>): void {
    const handlerSet = this.handlers.get(eventType)
    if (handlerSet) {
      handlerSet.delete(handler)

      // Clean up empty sets
      if (handlerSet.size === 0) {
        this.handlers.delete(eventType)
      }
    }
  }

  /**
   * Emit an event to all subscribers
   *
   * Handlers are executed asynchronously in the next tick to prevent blocking.
   *
   * @param event - Event to emit
   */
  emit(event: AuthEvent): void {
    const handlerSet = this.handlers.get(event.type)
    if (!handlerSet || handlerSet.size === 0) {
      return
    }

    // Execute handlers in next tick to prevent blocking
    setTimeout(() => {
      handlerSet.forEach((handler) => {
        try {
          handler(event)
        } catch (error) {
          // Log error but don't throw to prevent one handler from breaking others
          console.error(`[AuthKeeper] Error in event handler for ${event.type}:`, error)
        }
      })
    }, 0)
  }

  /**
   * Remove all event handlers
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Get count of handlers for an event type
   *
   * @param eventType - Event type to count handlers for
   * @returns Number of handlers
   */
  getHandlerCount(eventType: EventType): number {
    return this.handlers.get(eventType)?.size || 0
  }

  /**
   * Get all event types that have handlers
   *
   * @returns Array of event types
   */
  getActiveEventTypes(): EventType[] {
    return Array.from(this.handlers.keys())
  }
}
