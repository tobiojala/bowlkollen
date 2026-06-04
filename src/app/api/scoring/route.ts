import { NextResponse } from 'next/server'
import { assertScoringPageUrl } from '@/lib/allowed-fetch-url'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url')
  if (!rawUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  let target: URL
  try {
    target = assertScoringPageUrl(rawUrl)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid URL' }, { status: 400 })
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://scoring.se/',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) return NextResponse.json({ error: 'HTTP ' + res.status }, { status: 500 })
    const html = await res.text()

    const alleyMatch = html.match(/alleyID\s*=\s*(\d+)/)
    const lanesMatch = html.match(/alleyLanes\s*=\s*(\d+)/)
    const sessionMatch = html.match(/useSession\s*=\s*(\d+)/)
    const checksumMatch = html.match(/useChecksum\s*=\s*"([^"]+)"/)
    const folderMatch = html.match(/screenfolder\s*=\s*new Array\(([^)]+)\)/)

    let screenfolders: string[] = []
    if (folderMatch) {
      screenfolders = folderMatch[1].split(',').map(s => s.trim().replace(/"/g, '').replace(/'/g, ''))
    }

    return NextResponse.json({
      alleyID: alleyMatch ? alleyMatch[1] : null,
      lanes: lanesMatch ? parseInt(lanesMatch[1]) : 12,
      session: sessionMatch ? sessionMatch[1] : null,
      checksum: checksumMatch ? checksumMatch[1] : null,
      screenfolders,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
