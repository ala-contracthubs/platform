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
 * Integration coverage for the F1 mobile/SMS registration path: it boots the
 * real Nest app against Postgres, swaps in a controllable clock, and reads OTP
 * codes back from the stub SMS provider — exercising the same HTTP contract the
 * web app consumes (send → verify → account-created → role-granted) plus the
 * expiry and lockout edge cases.
 *
 * Requires a reachable Postgres (DATABASE_URL). Locally: `docker compose up -d`.
 */
const OTP_TTL_MS = 5 * 60 * 1000
const BASE_TIME = new Date('2026-06-01T12:00:00.000Z')

/** Pull the 6-digit code out of a stub SMS message. */
function codeFrom(message: string | undefined): string {
  const match = message?.match(/\d{6}/)
  if (!match) throw new Error(`no OTP code found in message: ${String(message)}`)
  return match[0]
}

describe('Mobile + SMS OTP registration (F1)', () => {
  let app: INestApplication
  let clock: FakeClock
  let sms: StubSmsProvider
  let seq = 0

  /** A fresh, unique E.164 number per test so challenges/accounts never collide. */
  const nextMobile = (): string => `+97150${String(1_000_000 + seq++)}`

  /** Drive request → verify and return the one-shot verification token. */
  const verifiedToken = async (mobile: string): Promise<string> => {
    await request(app.getHttpServer()).post('/auth/registration/otp').send({ mobile }).expect(201)
    const code = codeFrom(sms.lastMessageTo(mobile))
    const res = await request(app.getHttpServer())
      .post('/auth/registration/verify')
      .send({ mobile, code })
      .expect(200)
    return res.body.verificationToken as string
  }

  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

  beforeAll(async () => {
    // Idempotent: applies only pending migrations to the configured database.
    execSync('pnpm prisma migrate deploy', { stdio: 'inherit' })

    clock = new FakeClock(BASE_TIME)

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
    sms = app.get<StubSmsProvider>(SMS_PROVIDER)

    // Start from a clean slate: the fixed clock + repeating test mobiles would
    // otherwise collide with rows left by a previous run (e.g. a still-active
    // lockout written at the same BASE_TIME).
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

  it('sends a 6-digit OTP to a valid E.164 number and opens a challenge', async () => {
    const mobile = nextMobile()

    const res = await request(app.getHttpServer())
      .post('/auth/registration/otp')
      .send({ mobile })
      .expect(201)

    expect(res.body.challengeId).toEqual(expect.any(String))
    expect(sms.messagesTo(mobile)).toHaveLength(1)
    expect(codeFrom(sms.lastMessageTo(mobile))).toMatch(/^\d{6}$/)
  })

  it('rejects a non-E.164 number with 400 and sends no SMS', async () => {
    const bad = '0501234567' // no country code / no leading +

    await request(app.getHttpServer())
      .post('/auth/registration/otp')
      .send({ mobile: bad })
      .expect(400)

    expect(sms.messagesTo(bad)).toHaveLength(0)
  })

  it('verifies a correct OTP and returns a one-shot verification token', async () => {
    const mobile = nextMobile()
    await request(app.getHttpServer()).post('/auth/registration/otp').send({ mobile }).expect(201)
    const code = codeFrom(sms.lastMessageTo(mobile))

    const res = await request(app.getHttpServer())
      .post('/auth/registration/verify')
      .send({ mobile, code })
      .expect(200)

    expect(res.body.verificationToken).toEqual(expect.any(String))
  })

  it('locks the mobile after 5 wrong attempts (429) and refuses new OTPs while locked', async () => {
    const mobile = nextMobile()
    await request(app.getHttpServer()).post('/auth/registration/otp').send({ mobile }).expect(201)
    const real = codeFrom(sms.lastMessageTo(mobile))
    const wrong = real === '000000' ? '111111' : '000000'

    const verify = (code: string) =>
      request(app.getHttpServer()).post('/auth/registration/verify').send({ mobile, code })

    // First four wrong attempts are rejected but not yet locked.
    for (let attempt = 1; attempt <= 4; attempt++) {
      await verify(wrong).expect(400)
    }
    // The fifth wrong attempt trips the lockout.
    await verify(wrong).expect(429)
    // While locked, even the correct code is refused...
    await verify(real).expect(429)
    // ...and a fresh OTP cannot be requested.
    await request(app.getHttpServer()).post('/auth/registration/otp').send({ mobile }).expect(429)
  })

  it('rejects an OTP that is older than 5 minutes with 400', async () => {
    const mobile = nextMobile()
    await request(app.getHttpServer()).post('/auth/registration/otp').send({ mobile }).expect(201)
    const code = codeFrom(sms.lastMessageTo(mobile))

    clock.advance(OTP_TTL_MS + 1_000)

    await request(app.getHttpServer())
      .post('/auth/registration/verify')
      .send({ mobile, code })
      .expect(400)
  })

  it('registers a Client: mints a UUID account, grants the role, issues a session', async () => {
    const mobile = nextMobile()
    const token = await verifiedToken(mobile)

    const res = await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: token, role: 'CLIENT' })
      .expect(201)

    expect(res.body).toEqual({
      individual: { id: expect.any(String), mobile },
      role: 'CLIENT',
      agentState: null,
      session: { token: expect.any(String) },
      dashboard: '/client',
    })
    // The canonical identifier is a minted internal UUID (R1.6 SMS path).
    expect(res.body.individual.id).toMatch(UUID)
  })

  it('registers an Agent as Solo and routes to the agent dashboard', async () => {
    const mobile = nextMobile()
    const token = await verifiedToken(mobile)

    const res = await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: token, role: 'AGENT' })
      .expect(201)

    expect(res.body).toMatchObject({ role: 'AGENT', agentState: 'SOLO', dashboard: '/agent' })
  })

  it('rejects a role other than CLIENT or AGENT with 400', async () => {
    const mobile = nextMobile()
    const token = await verifiedToken(mobile)

    await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: token, role: 'PLATFORM_ADMIN' })
      .expect(400)
  })

  it('rejects an unrecognized verification token with 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: 'not-a-real-token', role: 'CLIENT' })
      .expect(400)
  })

  it('refuses to reuse a verification token (one-shot)', async () => {
    const mobile = nextMobile()
    const token = await verifiedToken(mobile)

    await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: token, role: 'CLIENT' })
      .expect(201)

    await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: token, role: 'CLIENT' })
      .expect(400)
  })

  it('returns 409 when an account already exists for the mobile', async () => {
    const mobile = nextMobile()
    const first = await verifiedToken(mobile)
    await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: first, role: 'CLIENT' })
      .expect(201)

    // A second, independently-verified token for the same mobile must not mint a
    // duplicate account.
    const second = await verifiedToken(mobile)
    await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ verificationToken: second, role: 'AGENT' })
      .expect(409)
  })
})
