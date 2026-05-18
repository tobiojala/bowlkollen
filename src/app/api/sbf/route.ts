import { NextResponse } from 'next/server'

// SBF API proxy - requires authorized API access from SBF
// Contact: api@swebowl.se or through bits.swebowl.se
// Status: Pending API authorization

export async function GET() {
  return NextResponse.json({
    error: 'API access pending',
    message: 'SBF API integration coming soon - awaiting authorized access',
    contact: 'bits.swebowl.se'
  }, { status: 503 })
}
