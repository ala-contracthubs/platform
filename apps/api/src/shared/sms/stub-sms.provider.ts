import { Injectable, Logger } from '@nestjs/common'
import type { SmsProvider } from './sms.provider'

interface SentSms {
  to: string
  message: string
}

/**
 * Development / test SMS provider. It sends nothing over the wire — it records
 * every message and logs it, so an OTP is surfaced locally (the PRD's "dev stub
 * surfaces the code"). Tests read back the delivered text to drive verify flows.
 */
@Injectable()
export class StubSmsProvider implements SmsProvider {
  private readonly logger = new Logger('StubSmsProvider')
  private readonly sent: SentSms[] = []

  async send(to: string, message: string): Promise<void> {
    this.sent.push({ to, message })
    this.logger.log(`[stub sms] to=${to} message="${message}"`)
  }

  /** Every message delivered to `to`, oldest first. */
  messagesTo(to: string): string[] {
    return this.sent.filter((m) => m.to === to).map((m) => m.message)
  }

  /** The most recent message delivered to `to`, or undefined if none. */
  lastMessageTo(to: string): string | undefined {
    return this.messagesTo(to).at(-1)
  }
}
