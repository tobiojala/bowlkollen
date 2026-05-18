import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const method = searchParams.get('method') || 'GET'
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/html',
        'Content-Type': 'application/json',
        'Origin': 'https://bits.swebowl.se',
        'Referer': 'https://bits.swebowl.se/',
      },
      ...(method === 'POST' ? { body: JSON.stringify({ search: '' }) } : {}),
      next: { revalidate: 0 }
    })
    const text = await res.text()
    return NextResponse.json({ html: text.slice(0, 50000), status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
