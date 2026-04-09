import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { decrypt } from './encryption'

interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

async function getEmailConfig(): Promise<{
  provider: string
  from: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  resendApiKey?: string
}> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'email_provider',
          'email_from',
          'smtp_host',
          'smtp_port',
          'smtp_user',
          'smtp_pass',
          'resend_api_key',
        ],
      },
    },
  })

  const get = (key: string) => {
    const c = configs.find((c) => c.key === key)
    if (!c) return undefined
    return c.encrypted ? decrypt(c.value) : c.value
  }

  return {
    provider: get('email_provider') || 'smtp',
    from: get('email_from') || 'noreply@sg1898chattengau.de',
    smtpHost: get('smtp_host'),
    smtpPort: get('smtp_port') ? parseInt(get('smtp_port')!) : undefined,
    smtpUser: get('smtp_user'),
    smtpPass: get('smtp_pass'),
    resendApiKey: get('resend_api_key'),
  }
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const config = await getEmailConfig()

  if (config.provider === 'resend' && config.resendApiKey) {
    // Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend API error: ${res.status} ${body}`)
    }
    return
  }

  // SMTP via Nodemailer
  if (!config.smtpHost) {
    console.warn('E-Mail nicht konfiguriert. Mail an', options.to, 'nicht gesendet.')
    console.log('Subject:', options.subject)
    return
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: config.smtpPort === 465,
    auth: config.smtpUser
      ? { user: config.smtpUser, pass: config.smtpPass }
      : undefined,
  })

  await transporter.sendMail({
    from: config.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}
