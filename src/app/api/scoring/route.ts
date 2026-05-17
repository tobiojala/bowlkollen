import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'sv-SE,sv;q=0.9',
        'Referer': 'https://scoring.se/',
      },
      next: { revalidate: 0 }
    })
    
    if (!res.ok) return NextResponse.json({ error: 'HTTP ' + res.status }, { status: 500 })
    
    const html = await res.text()
    return NextResponse.json({ html, status: res.status, url })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
