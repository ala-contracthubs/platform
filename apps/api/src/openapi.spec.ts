import { docsEnabled } from './openapi'

/**
 * The /docs gate is a safety boundary: production must never serve the API docs.
 * These cases pin that down — especially the fail-closed paths — so a future
 * change to the predicate can't silently expose docs in prod.
 */
describe('docsEnabled', () => {
  it('is ON in stage', () => {
    expect(docsEnabled({ APP_ENV: 'stage', NODE_ENV: 'production' })).toBe(true)
  })

  it('is OFF in prod', () => {
    expect(docsEnabled({ APP_ENV: 'prod', NODE_ENV: 'production' })).toBe(false)
  })

  it('is ON in local dev (no APP_ENV, non-prod NODE_ENV)', () => {
    expect(docsEnabled({ NODE_ENV: 'development' })).toBe(true)
  })

  it('is ON when nothing is set (bare local run)', () => {
    expect(docsEnabled({})).toBe(true)
  })

  it('fails closed: APP_ENV unset but NODE_ENV=production is OFF', () => {
    expect(docsEnabled({ NODE_ENV: 'production' })).toBe(false)
  })

  it('fails closed: a set APP_ENV always wins, so any non-"stage" value is OFF', () => {
    // Typos and case mismatches must not accidentally enable docs.
    expect(docsEnabled({ APP_ENV: 'staging' })).toBe(false)
    expect(docsEnabled({ APP_ENV: 'STAGE' })).toBe(false)
    // Even with a dev-looking NODE_ENV, an explicit non-stage APP_ENV wins.
    expect(docsEnabled({ APP_ENV: 'qa', NODE_ENV: 'development' })).toBe(false)
  })
})
