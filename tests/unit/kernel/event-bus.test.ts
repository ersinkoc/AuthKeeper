/**
 * Tests for EventBus
 */

import { vi } from 'vitest'
import { EventBus } from '../../../src/kernel/event-bus'
import type { LoginEvent, LogoutEvent, RefreshEvent, ErrorEvent } from '../../../src/types'

describe('EventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('on() - subscribe to events', () => {
    it('should register event handler', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      expect(eventBus.getHandlerCount('login')).toBe(1)
    })

    it('should register multiple handlers for same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on('login', handler1)
      eventBus.on('login', handler2)
      eventBus.on('login', handler3)

      expect(eventBus.getHandlerCount('login')).toBe(3)
    })

    it('should register handlers for different events', () => {
      const loginHandler = vi.fn()
      const logoutHandler = vi.fn()
      const refreshHandler = vi.fn()

      eventBus.on('login', loginHandler)
      eventBus.on('logout', logoutHandler)
      eventBus.on('refresh', refreshHandler)

      expect(eventBus.getHandlerCount('login')).toBe(1)
      expect(eventBus.getHandlerCount('logout')).toBe(1)
      expect(eventBus.getHandlerCount('refresh')).toBe(1)
    })

    it('should return unsubscribe function', () => {
      const handler = vi.fn()
      const unsubscribe = eventBus.on('login', handler)

      expect(typeof unsubscribe).toBe('function')
      expect(eventBus.getHandlerCount('login')).toBe(1)

      unsubscribe()
      expect(eventBus.getHandlerCount('login')).toBe(0)
    })

    it('should not add same handler twice', () => {
      const handler = vi.fn()

      eventBus.on('login', handler)
      eventBus.on('login', handler)

      // Set should deduplicate
      expect(eventBus.getHandlerCount('login')).toBe(1)
    })
  })

  describe('off() - unsubscribe from events', () => {
    it('should remove event handler', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      expect(eventBus.getHandlerCount('login')).toBe(1)

      eventBus.off('login', handler)
      expect(eventBus.getHandlerCount('login')).toBe(0)
    })

    it('should only remove specified handler', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on('login', handler1)
      eventBus.on('login', handler2)
      eventBus.on('login', handler3)

      eventBus.off('login', handler2)

      expect(eventBus.getHandlerCount('login')).toBe(2)
    })

    it('should handle removing non-existent handler gracefully', () => {
      const handler = vi.fn()

      expect(() => eventBus.off('login', handler)).not.toThrow()
      expect(eventBus.getHandlerCount('login')).toBe(0)
    })

    it('should clean up empty handler sets', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      expect(eventBus.getActiveEventTypes()).toContain('login')

      eventBus.off('login', handler)

      expect(eventBus.getActiveEventTypes()).not.toContain('login')
    })

    it('should allow calling unsubscribe multiple times safely', () => {
      const handler = vi.fn()
      const unsubscribe = eventBus.on('login', handler)

      unsubscribe()
      expect(() => unsubscribe()).not.toThrow()
      expect(eventBus.getHandlerCount('login')).toBe(0)
    })
  })

  describe('emit() - publish events', () => {
    it('should call registered handler with event data', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      const event: LoginEvent = {
        type: 'login',
        tokens: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
        },
        timestamp: Date.now(),
      }

      eventBus.emit(event)

      // Handlers execute in next tick
      vi.runAllTimers()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('should call all registered handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on('login', handler1)
      eventBus.on('login', handler2)
      eventBus.on('login', handler3)

      const event: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      eventBus.emit(event)
      vi.runAllTimers()

      expect(handler1).toHaveBeenCalledWith(event)
      expect(handler2).toHaveBeenCalledWith(event)
      expect(handler3).toHaveBeenCalledWith(event)
    })

    it('should execute handlers asynchronously in next tick', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      const event: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      eventBus.emit(event)

      // Should not be called immediately
      expect(handler).not.toHaveBeenCalled()

      // Should be called after next tick
      vi.runAllTimers()
      expect(handler).toHaveBeenCalled()
    })

    it('should not call handlers for different event types', () => {
      const loginHandler = vi.fn()
      const logoutHandler = vi.fn()

      eventBus.on('login', loginHandler)
      eventBus.on('logout', logoutHandler)

      const loginEvent: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      eventBus.emit(loginEvent)
      vi.runAllTimers()

      expect(loginHandler).toHaveBeenCalled()
      expect(logoutHandler).not.toHaveBeenCalled()
    })

    it('should handle emitting event with no subscribers', () => {
      const event: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      expect(() => {
        eventBus.emit(event)
        vi.runAllTimers()
      }).not.toThrow()
    })

    it('should continue executing other handlers if one throws', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const handler1 = vi.fn()
      const handler2 = vi.fn(() => {
        throw new Error('Handler 2 error')
      })
      const handler3 = vi.fn()

      eventBus.on('login', handler1)
      eventBus.on('login', handler2)
      eventBus.on('login', handler3)

      const event: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      eventBus.emit(event)
      vi.runAllTimers()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(handler3).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should log errors from failing handlers', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')
      const handler = vi.fn(() => {
        throw error
      })

      eventBus.on('login', handler)

      const event: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      eventBus.emit(event)
      vi.runAllTimers()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AuthKeeper] Error in event handler for login:'),
        error
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('clear() - remove all handlers', () => {
    it('should remove all event handlers', () => {
      eventBus.on('login', vi.fn())
      eventBus.on('logout', vi.fn())
      eventBus.on('refresh', vi.fn())

      expect(eventBus.getActiveEventTypes().length).toBe(3)

      eventBus.clear()

      expect(eventBus.getActiveEventTypes().length).toBe(0)
      expect(eventBus.getHandlerCount('login')).toBe(0)
      expect(eventBus.getHandlerCount('logout')).toBe(0)
      expect(eventBus.getHandlerCount('refresh')).toBe(0)
    })

    it('should prevent cleared handlers from being called', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      eventBus.clear()

      const event: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      eventBus.emit(event)
      vi.runAllTimers()

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('getHandlerCount()', () => {
    it('should return 0 for event with no handlers', () => {
      expect(eventBus.getHandlerCount('login')).toBe(0)
    })

    it('should return correct count for event with handlers', () => {
      eventBus.on('login', vi.fn())
      eventBus.on('login', vi.fn())
      eventBus.on('login', vi.fn())

      expect(eventBus.getHandlerCount('login')).toBe(3)
    })

    it('should update count after adding handlers', () => {
      expect(eventBus.getHandlerCount('login')).toBe(0)

      eventBus.on('login', vi.fn())
      expect(eventBus.getHandlerCount('login')).toBe(1)

      eventBus.on('login', vi.fn())
      expect(eventBus.getHandlerCount('login')).toBe(2)
    })

    it('should update count after removing handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('login', handler1)
      eventBus.on('login', handler2)
      expect(eventBus.getHandlerCount('login')).toBe(2)

      eventBus.off('login', handler1)
      expect(eventBus.getHandlerCount('login')).toBe(1)

      eventBus.off('login', handler2)
      expect(eventBus.getHandlerCount('login')).toBe(0)
    })
  })

  describe('getActiveEventTypes()', () => {
    it('should return empty array when no handlers registered', () => {
      expect(eventBus.getActiveEventTypes()).toEqual([])
    })

    it('should return array of event types with handlers', () => {
      eventBus.on('login', vi.fn())
      eventBus.on('logout', vi.fn())
      eventBus.on('refresh', vi.fn())

      const activeTypes = eventBus.getActiveEventTypes()

      expect(activeTypes).toContain('login')
      expect(activeTypes).toContain('logout')
      expect(activeTypes).toContain('refresh')
      expect(activeTypes.length).toBe(3)
    })

    it('should not include event types after all handlers removed', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      expect(eventBus.getActiveEventTypes()).toContain('login')

      eventBus.off('login', handler)

      expect(eventBus.getActiveEventTypes()).not.toContain('login')
    })

    it('should update after clear', () => {
      eventBus.on('login', vi.fn())
      eventBus.on('logout', vi.fn())

      expect(eventBus.getActiveEventTypes().length).toBe(2)

      eventBus.clear()

      expect(eventBus.getActiveEventTypes()).toEqual([])
    })
  })

  describe('integration scenarios', () => {
    it('should handle complex event flow', () => {
      const events: string[] = []

      eventBus.on('login', () => events.push('login-1'))
      eventBus.on('login', () => events.push('login-2'))
      eventBus.on('logout', () => events.push('logout'))
      eventBus.on('refresh', () => events.push('refresh'))

      const loginEvent: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      const logoutEvent: LogoutEvent = {
        type: 'logout',
        timestamp: Date.now(),
      }

      const refreshEvent: RefreshEvent = {
        type: 'refresh',
        tokens: { accessToken: 'new-token' },
        timestamp: Date.now(),
      }

      eventBus.emit(loginEvent)
      vi.runAllTimers()

      eventBus.emit(refreshEvent)
      vi.runAllTimers()

      eventBus.emit(logoutEvent)
      vi.runAllTimers()

      expect(events).toEqual(['login-1', 'login-2', 'refresh', 'logout'])
    })

    it('should handle subscribe and unsubscribe during event handling', () => {
      const calls: number[] = []
      let unsubscribe2: (() => void) | null = null

      const handler1 = vi.fn(() => {
        calls.push(1)
      })

      const handler2 = vi.fn(() => {
        calls.push(2)
        // Unsubscribe during handling
        if (unsubscribe2) unsubscribe2()
      })

      const handler3 = vi.fn(() => {
        calls.push(3)
      })

      eventBus.on('login', handler1)
      unsubscribe2 = eventBus.on('login', handler2)
      eventBus.on('login', handler3)

      const event: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'test' },
        timestamp: Date.now(),
      }

      // First emit - all handlers called
      eventBus.emit(event)
      vi.runAllTimers()

      expect(calls).toEqual([1, 2, 3])
      expect(eventBus.getHandlerCount('login')).toBe(2)

      // Second emit - handler2 removed
      calls.length = 0
      eventBus.emit(event)
      vi.runAllTimers()

      expect(calls).toEqual([1, 3])
    })

    it('should handle multiple concurrent event emissions', () => {
      const handler = vi.fn()
      eventBus.on('login', handler)

      const event1: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'token1' },
        timestamp: 1000,
      }

      const event2: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'token2' },
        timestamp: 2000,
      }

      const event3: LoginEvent = {
        type: 'login',
        tokens: { accessToken: 'token3' },
        timestamp: 3000,
      }

      eventBus.emit(event1)
      eventBus.emit(event2)
      eventBus.emit(event3)

      vi.runAllTimers()

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, event1)
      expect(handler).toHaveBeenNthCalledWith(2, event2)
      expect(handler).toHaveBeenNthCalledWith(3, event3)
    })

    it('should support error event type', () => {
      const handler = vi.fn()
      eventBus.on('error', handler)

      const errorEvent: ErrorEvent = {
        type: 'error',
        error: new Error('Test error'),
        timestamp: Date.now(),
      }

      eventBus.emit(errorEvent)
      vi.runAllTimers()

      expect(handler).toHaveBeenCalledWith(errorEvent)
    })
  })
})
