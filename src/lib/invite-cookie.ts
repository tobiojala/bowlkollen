import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.INVITE_COOKIE_SECRET!

function hmac(code: string): string {
  return createHmac('sha256', SECRET).update(code).digest('hex')
}

/** `code.hmac` — the trust boundary for the gate check in proxy.ts (no DB round-trip per request). */
export function signInviteCookie(code: string): string {
  return `${code}.${hmac(code)}`
}

/** Returns the code if the signature is valid, else null. */
export function verifyInviteCookie(value: string): string | null {
  const i = value.lastIndexOf('.')
  if (i < 0) return null
  const code = value.slice(0, i)
  const sig  = value.slice(i + 1)
  const expected = hmac(code)
  if (sig.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  return code
}
