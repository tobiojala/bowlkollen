const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

export function parseAllowedHttpsUrl(raw: string, allowedHostnames: readonly string[]): URL {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Invalid URL')
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed')
  }

  if (parsed.username || parsed.password) {
    throw new Error('URL credentials are not allowed')
  }

  const host = parsed.hostname.toLowerCase()
  if (PRIVATE_HOST_PATTERNS.some(p => p.test(host))) {
    throw new Error('Private or local hosts are not allowed')
  }

  const allowed = allowedHostnames.map(h => h.toLowerCase())
  if (!allowed.includes(host)) {
    throw new Error('Host is not allowed')
  }

  return parsed
}

export const BITS_FETCH_HOSTS = ['bits.swebowl.se', 'api.swebowl.se'] as const
export const SCORING_FETCH_HOSTS = ['scoring.se', 'www.scoring.se'] as const

export function assertScoringPageUrl(raw: string): URL {
  const parsed = parseAllowedHttpsUrl(raw, SCORING_FETCH_HOSTS)
  const path = parsed.pathname.toLowerCase()
  if (!path.includes('scoring.asp')) {
    throw new Error('URL must be a scoring.se scoring page')
  }
  return parsed
}
