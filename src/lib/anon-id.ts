const COOKIE = 'bk_anon_id'
const MAX_AGE_DAYS = 30

/**
 * A cookie, not localStorage — auth/callback/route.ts (a server route) needs
 * to read it too, to merge pre-signup view history at the moment of signup.
 */
export function getAnonId(): string {
  const existing = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE}=`))
    ?.split('=')[1]
  if (existing) return existing

  const id = crypto.randomUUID()
  document.cookie = `${COOKIE}=${id}; path=/; max-age=${MAX_AGE_DAYS * 86400}; SameSite=Lax`
  return id
}
