import * as Sentry from '@sentry/nextjs'

// Only initialise when a DSN is configured — no-op in local dev without one.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,        // 10% of transactions
    replaysSessionSampleRate: 0,  // off by default — enable when needed
    replaysOnErrorSampleRate: 1,  // always capture replays on errors
    integrations: [
      Sentry.replayIntegration(),
    ],
  })
}
