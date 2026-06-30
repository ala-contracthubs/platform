import { describe, expect, it } from 'vitest'
import { memorySessionStore } from './session-store'

describe('memorySessionStore', () => {
  it('round-trips a token through set / get / clear', () => {
    const store = memorySessionStore()
    expect(store.get()).toBeNull()

    store.set('tok-123')
    expect(store.get()).toBe('tok-123')

    store.clear()
    expect(store.get()).toBeNull()
  })

  it('can start seeded with an existing token (e.g. a returning visit)', () => {
    const store = memorySessionStore('seeded')
    expect(store.get()).toBe('seeded')
  })
})
