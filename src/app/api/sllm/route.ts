import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://sllm.bowlres.se/allplayers.php?contestid=107', {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    })
    if (!res.ok) return NextResponse.json({ error: 'HTTP ' + res.status }, { status: 500 })
    const html = await res.text()
    return NextResponse.json({ html })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
