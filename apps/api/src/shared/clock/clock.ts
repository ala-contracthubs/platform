import { Injectable } from '@nestjs/common'

/**
 * The platform's source of "now". Injecting time (rather than calling `new
 * Date()` inline) keeps time-dependent rules — OTP expiry, lockouts, session
 * lifetimes — deterministic under test via a fake clock.
 */
export interface Clock {
  now(): Date
}

/** DI token for {@link Clock} (an interface has no runtime identity). */
export const CLOCK = Symbol('CLOCK')

/** Production clock: real wall-clock time. */
@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
