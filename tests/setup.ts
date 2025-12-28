/**
 * Vitest Test Setup
 *
 * This file runs before all tests to set up the testing environment.
 */

// Mock crypto API for PKCE tests
const mockCrypto = {
  getRandomValues: <T extends ArrayBufferView>(array: T): T => {
    const bytes = new Uint8Array(array.buffer)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    return array
  },
  subtle: {
    digest: async (algorithm: string, data: BufferSource): Promise<ArrayBuffer> => {
      // Mock SHA-256 implementation
      // In real tests, we'll use a fixed mock value for consistency
      const mockHash = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        mockHash[i] = i
      }
      return mockHash.buffer
    },
  },
}

// Mock BroadcastChannel for multi-tab sync tests
export class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null
  private static channels = new Map<string, MockBroadcastChannel[]>()

  constructor(name: string) {
    this.name = name
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, [])
    }
    MockBroadcastChannel.channels.get(name)!.push(this)
  }

  postMessage(data: any): void {
    const channels = MockBroadcastChannel.channels.get(this.name) || []
    channels.forEach((channel) => {
      if (channel !== this && channel.onmessage) {
        const event = new MessageEvent('message', { data })
        channel.onmessage(event)
      }
    })
  }

  close(): void {
    const channels = MockBroadcastChannel.channels.get(this.name) || []
    const index = channels.indexOf(this)
    if (index > -1) {
      channels.splice(index, 1)
    }
  }

  static reset(): void {
    MockBroadcastChannel.channels.clear()
  }
}

// Set up global mocks
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: mockCrypto,
    writable: true,
  })
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    value: MockBroadcastChannel,
    writable: true,
  })
}
