const BITS_LOGO_PREFIX = 'https://bits.swebowl.se/images/ClubLogo/'

/** Only allow BITS CDN logo URLs (or null) for img src. */
export function safeClubLogoUrl(url: string | null | undefined, bitsId?: number): string | null {
  if (url) {
    try {
      const parsed = new URL(url)
      if (
        parsed.protocol === 'https:' &&
        parsed.hostname === 'bits.swebowl.se' &&
        parsed.pathname.startsWith('/images/ClubLogo/')
      ) {
        return parsed.toString()
      }
    } catch {
      /* fall through */
    }
  }
  if (bitsId != null) return `${BITS_LOGO_PREFIX}${bitsId}.png`
  return null
}
