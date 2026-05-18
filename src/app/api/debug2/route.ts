import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 50),
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
  })
}
