import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  
  try {
    const res = await fetch('https://api.swebowl.se/api/v1/player/GetAll?APIKey=62fcl8gPUMXSQGW1t2Y8mc2zeTk97vbd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://bits.swebowl.se',
        'Referer': 'https://bits.swebowl.se/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        search,
        TakeOnlyActive: true,
        page: 1,
        pageSize: 10,
        sort: [{ field: 'firstName', dir: 'asc' }]
      }),
      next: { revalidate: 0 }
    })
    const text = await res.text()
    return NextResponse.json({ status: res.status, data: text.slice(0, 5000) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
