import { prisma } from '@socioply/shared'
import { logger } from './logger'
import { Prisma } from '@prisma/client'

export interface FailureAlertInput {
  userId?: string
  jobId?: string
  errorType: string
  message: string
  context?: Record<string, unknown>
}

/** Persist failure and optionally email admin + user via Resend. */
export async function sendFailureAlert(input: FailureAlertInput): Promise<void> {
  await prisma.errorLog
    .create({
      data: {
        userId: input.userId,
        jobId: input.jobId,
        errorType: input.errorType,
        errorMessage: input.message,
        context: (input.context ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((err) => {
      logger.error({ err }, '[alerts] failed to write ErrorLog')
    })

  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.ALERT_EMAIL_FROM ?? 'alerts@socioply.com'
  const adminTo = process.env.ALERT_EMAIL_TO

  const recipients = new Set<string>()
  if (adminTo) recipients.add(adminTo)

  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    })
    if (user?.email) recipients.add(user.email)
  }

  if (!resendKey || recipients.size === 0) return

  const subject = `[Socioply] ${input.errorType}`
  const body = `${input.message}\n\n${JSON.stringify(input.context ?? {}, null, 2)}`

  for (const to of recipients) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text: body }),
      })
      if (!response.ok) {
        logger.warn({ to, status: response.status }, '[alerts] Resend API error')
      }
    } catch (err) {
      logger.error({ err, to }, '[alerts] failed to send email')
    }
  }
}
