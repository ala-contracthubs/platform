/** Where the app keeps the bearer token between visits. A seam so the app shell
 *  can be driven in tests without touching real storage, and so the persistence
 *  backend (localStorage today) can change without touching callers. */
export interface SessionStore {
  get(): string | null
  set(token: string): void
  clear(): void
}

const STORAGE_KEY = 'ch.session.token'

/** Production store: persists the token in `localStorage` so a session survives
 *  reloads until it expires (R1.2) or the user logs out. */
export const localSessionStore: SessionStore = {
  get: () => localStorage.getItem(STORAGE_KEY),
  set: (token) => localStorage.setItem(STORAGE_KEY, token),
  clear: () => localStorage.removeItem(STORAGE_KEY),
}

/** In-memory store for tests — no shared global state to leak between cases. */
export function memorySessionStore(initial: string | null = null): SessionStore {
  let token = initial
  return {
    get: () => token,
    set: (value) => {
      token = value
    },
    clear: () => {
      token = null
    },
  }
}
