import { NextResponse } from 'next/server'
import { BITS_FETCH_HOSTS, parseAllowedHttpsUrl } from '@/lib/allowed-fetch-url'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url')
  const method = (searchParams.get('method') || 'GET').toUpperCase()

  if (!rawUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 })
  if (method !== 'GET' && method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let target: URL
  try {
    target = parseAllowedHttpsUrl(rawUrl, BITS_FETCH_HOSTS)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid URL' }, { status: 400 })
  }

  try {
    const res = await fetch(target.toString(), {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/html',
        'Content-Type': 'application/json',
        'Origin': 'https://bits.swebowl.se',
        'Referer': 'https://bits.swebowl.se/',
      },
      ...(method === 'POST' ? { body: JSON.stringify({ search: '' }) } : {}),
      next: { revalidate: 0 },
    })
    const text = await res.text()
    return NextResponse.json({ html: text.slice(0, 50000), status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
