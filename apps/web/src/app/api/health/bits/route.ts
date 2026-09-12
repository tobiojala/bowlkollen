import { NextResponse } from 'next/server'
import { bitsBreakerState } from '@/lib/bits-core'

// Health of the BITS connection: is the circuit breaker open (we've been blocked),
// when did we last succeed, how many blocks total. Point an uptime monitor here —
// alert when `open` is true or `lastOkAt` goes stale.
export const dynamic = 'force-dynamic'

export function GET() {
  const state = bitsBreakerState()
  return NextResponse.json({ service: 'bits', ...state }, {
    status: state.open ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
