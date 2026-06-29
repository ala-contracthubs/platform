import type { Clock } from '../../src/shared/clock/clock'

/** A controllable {@link Clock} for tests: starts at a fixed instant and only
 *  moves when `advance` is called, so expiry / lockout windows are exercised
 *  without real waiting. */
export class FakeClock implements Clock {
  private current: Date

  constructor(start: Date) {
    this.current = start
  }

  now(): Date {
    return new Date(this.current)
  }

  /** Reset to a fixed instant (used to isolate each test). */
  set(instant: Date): void {
    this.current = instant
  }

  /** Move time forward by `ms` milliseconds. */
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms)
  }
}
