import { execSync } from 'node:child_process'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/shared/prisma/prisma.service'
import { CLOCK } from '../src/shared/clock/clock'
import { SMS_PROVIDER } from '../src/shared/sms/sms.provider'
import type { StubSmsProvider } from '../src/shared/sms/stub-sms.provider'
import { FakeClock } from './support/fake-clock'

/**
 * Integration coverage for the F2 returning-user mobile login path and the R1.2
 * session lifecycle: it boots the real Nest app against Postgres, swaps in a
 * controllable clock, and reads OTP codes back from the stub SMS provider —
 * exercising the same HTTP contract the web app consumes (login send → verify →
 * session for the last-used role) plus the unrecognized-number, lockout, and
 * 30-day expiry branches.
 *
 * Requires a reachable Postgres (DATABASE_URL). Locally: `docker compose up -d`.
 */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const BASE_TIME = new Date('2026-06-01T12:00:00.000Z')

type Role = 'CLIENT' | 'AGENT'

/** Pull the 6-digit code out of a stub SMS message. */
function codeFrom(message: string | undefined): string {
  const match = message?.match(/\d{6}/)
  if (!match) throw new Error(`no OTP code found in message: ${String(message)}`)
  return match[0]
}

describe('Mobile OTP login + session lifecycle (F2 / R1.2)', () => {
  let app: INestApplication
  let clock: FakeClock
  let sms: StubSmsProvider
  let seq = 0

  /** A fresh, unique E.164 number per test so challenges/accounts never collide. */
  const nextMobile = (): string => `+97155${String(1_000_000 + seq++)}`

  /** Create an account through the real registration HTTP surface, so login has a
   *  genuine returning user to recognise. Returns the registration session token. */
  const registerAccount = async (mobile: string, role: Role): Promise<string> => {
    await request(app.getHttpServer()).post('/auth/registration/otp').send({ mobile }).expect(201)
    const code = codeFrom(sms.lastMessageTo(mobile))
    const verified = await request(app.getHttpServer())
      .post('/auth/registration/verify')
      .send({ mobile, code })
      .expect(200)
    const res = await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: verified.body.verificationToken, role })
      .expect(201)
    return res.body.session.token as string
  }

  /** Drive a login: request a code, read it from the stub, verify it. */
  const login = async (mobile: string) => {
    await request(app.getHttpServer()).post('/auth/login/otp').send({ mobile }).expect(201)
    const code = codeFrom(sms.lastMessageTo(mobile))
    return request(app.getHttpServer()).post('/auth/login/verify').send({ mobile, code }).expect(200)
  }

  beforeAll(async () => {
    execSync('pnpm prisma migrate deploy', { stdio: 'inherit' })

    clock = new FakeClock(BASE_TIME)

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
    sms = app.get<StubSmsProvider>(SMS_PROVIDER)

    const prisma = app.get(PrismaService)
    await prisma.session.deleteMany()
    await prisma.roleGrant.deleteMany()
    await prisma.otpChallenge.deleteMany()
    await prisma.individual.deleteMany()
  })

  beforeEach(() => {
    clock.set(BASE_TIME)
  })

  afterAll(async () => {
    await app?.close()
  })

  it('logs a returning user in via OTP and lands them on their last-used role', async () => {
    const mobile = nextMobile()
    await registerAccount(mobile, 'CLIENT')

    const res = await login(mobile)

    expect(res.body).toEqual({
      role: 'CLIENT',
      dashboard: '/client',
      session: { token: expect.any(String) },
    })
  })

  it('lands a returning Agent on the agent dashboard', async () => {
    const mobile = nextMobile()
    await registerAccount(mobile, 'AGENT')

    const res = await login(mobile)

    expect(res.body).toMatchObject({ role: 'AGENT', dashboard: '/agent' })
  })

  it('rejects an unrecognized number with 404 and sends no SMS (offer registration)', async () => {
    const mobile = nextMobile() // never registered

    const res = await request(app.getHttpServer())
      .post('/auth/login/otp')
      .send({ mobile })
      .expect(404)

    expect(res.body.message).toMatch(/don't see an account/i)
    expect(sms.messagesTo(mobile)).toHaveLength(0)
  })

  it('rejects a non-E.164 number at login with 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/login/otp')
      .send({ mobile: '0501234567' })
      .expect(400)
  })

  it('locks the account after repeated wrong codes (429) and refuses the right code while locked', async () => {
    const mobile = nextMobile()
    await registerAccount(mobile, 'CLIENT')
    await request(app.getHttpServer()).post('/auth/login/otp').send({ mobile }).expect(201)
    const real = codeFrom(sms.lastMessageTo(mobile))
    const wrong = real === '000000' ? '111111' : '000000'

    const verify = (code: string) =>
      request(app.getHttpServer()).post('/auth/login/verify').send({ mobile, code })

    for (let attempt = 1; attempt <= 4; attempt++) {
      await verify(wrong).expect(400)
    }
    await verify(wrong).expect(429)
    // Locked: even the correct code is refused, forcing re-authentication later.
    await verify(real).expect(429)
  })

  it('refuses to reuse a login code (one session per code)', async () => {
    const mobile = nextMobile()
    await registerAccount(mobile, 'CLIENT')
    await request(app.getHttpServer()).post('/auth/login/otp').send({ mobile }).expect(201)
    const code = codeFrom(sms.lastMessageTo(mobile))

    await request(app.getHttpServer()).post('/auth/login/verify').send({ mobile, code }).expect(200)
    // The challenge is spent — the same code cannot mint a second session.
    await request(app.getHttpServer()).post('/auth/login/verify').send({ mobile, code }).expect(400)
  })

  describe('session lifecycle (R1.2)', () => {
    const checkSession = (token: string) =>
      request(app.getHttpServer()).get('/auth/session').set('Authorization', `Bearer ${token}`)

    it('reports a fresh session as active with its role', async () => {
      const mobile = nextMobile()
      await registerAccount(mobile, 'AGENT')
      const token = (await login(mobile)).body.session.token as string

      const res = await checkSession(token).expect(200)

      expect(res.body).toEqual({ role: 'AGENT', dashboard: '/agent' })
    })

    it('expires a session after 30 days and signals the channel to re-authenticate', async () => {
      const mobile = nextMobile()
      await registerAccount(mobile, 'CLIENT')
      const token = (await login(mobile)).body.session.token as string

      // Just shy of 30 days: still active.
      clock.advance(SESSION_TTL_MS - 1_000)
      await checkSession(token).expect(200)

      // Past 30 days: expired, re-auth required, mobile channel pre-selected.
      clock.advance(2_000)
      const res = await checkSession(token).expect(401)
      expect(res.body).toMatchObject({ reason: 'expired', channel: 'mobile' })
    })

    it('rejects an unknown token as invalid', async () => {
      const res = await checkSession('not-a-real-token').expect(401)
      expect(res.body).toMatchObject({ reason: 'invalid' })
    })
  })
})
