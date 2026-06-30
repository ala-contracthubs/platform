import { describe, expect, it } from 'vitest'
import { joinApiUrl } from './api-base'

describe('joinApiUrl', () => {
  it('keeps the path same-origin when no base is configured (dev: Vite proxy)', () => {
    expect(joinApiUrl('', '/auth/login/otp')).toBe('/auth/login/otp')
    expect(joinApiUrl(undefined, '/health')).toBe('/health')
  })

  it('prefixes the API host when a base is configured (stage/prod cross-origin call)', () => {
    expect(joinApiUrl('https://api.stage.contracthubs.com', '/auth/login/otp')).toBe(
      'https://api.stage.contracthubs.com/auth/login/otp',
    )
  })

  it('does not double the slash when the base has a trailing slash', () => {
    expect(joinApiUrl('https://api.stage.contracthubs.com/', '/auth/login/otp')).toBe(
      'https://api.stage.contracthubs.com/auth/login/otp',
    )
  })
})
