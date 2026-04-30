import pino from 'pino'

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.encryptedKey',
  '*.accessToken',
  '*.refreshToken',
  '*.appPassword',
  '*.SENTRY_DSN',
  '*.LOGTAIL_TOKEN',
  '*.ENCRYPTION_KEY',
  '*.AWS_SECRET_ACCESS_KEY',
  '*.secretKey',
  '*.apiKey',
]

const targets: pino.TransportTargetOptions[] = [
  { target: 'pino/file', options: { destination: 1 } },
]

if (process.env.LOGTAIL_TOKEN) {
  targets.push({
    target: '@logtail/pino',
    options: {
      sourceToken: process.env.LOGTAIL_TOKEN,
      // Better Stack EU region requires a custom ingestion endpoint;
      // US region works with the SDK default.
      ...(process.env.LOGTAIL_ENDPOINT
        ? { options: { endpoint: process.env.LOGTAIL_ENDPOINT } }
        : {}),
    },
  })
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  transport: { targets },
})
