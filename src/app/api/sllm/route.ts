import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    error: 'API not available',
    message: 'Player data will be available when API access is arranged with bowlres.se'
  }, { status: 503 })
}
