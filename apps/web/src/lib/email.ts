import { prisma, decrypt } from '@socioply/shared'

/** Resend key: env first, else the admin-managed DB key (system_api_keys). */
async function resendKey(): Promise<string | null> {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY
  const row = await prisma.systemApiKey.findUnique({ where: { provider: 'resend' } }).catch(() => null)
  return row ? decrypt(row.encryptedKey) : null
}

async function fromAddress(): Promise<string> {
  const ps = await prisma.platformSettings
    .findUnique({ where: { id: 'singleton' }, select: { transactionalEmailFrom: true } })
    .catch(() => null)
  return (
    ps?.transactionalEmailFrom?.trim() ||
    process.env.TRANSACTIONAL_EMAIL_FROM ||
    process.env.ALERT_EMAIL_FROM ||
    'hello@socioply.com'
  )
}

/** Best-effort transactional email via Resend. Returns false if not configured. */
export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const key = await resendKey()
  if (!key) return false
  try {
    const from = await fromAddress()
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, text: input.text }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Notify a newly-added teammate with a pre-filled sign-up link. */
export async function sendTeamSetupEmail(opts: { to: string; name: string | null; inviterName: string | null; signUpUrl: string }): Promise<boolean> {
  const who = opts.inviterName ? `${opts.inviterName}` : 'A teammate'
  return sendEmail({
    to: opts.to,
    subject: `You've been added to a Socioply team`,
    html: `<p>Hi ${opts.name ?? 'there'},</p><p>${who} added you to their Socioply account. Create your account to get started — you'll set your own password.</p><p><a href="${opts.signUpUrl}">Set up your account →</a></p><p style="color:#666;font-size:12px">Use this email address when you sign up.</p>`,
    text: `${who} added you to their Socioply account. Set up your account (you'll choose a password): ${opts.signUpUrl}\n\nUse this email address when you sign up.`,
  })
}
