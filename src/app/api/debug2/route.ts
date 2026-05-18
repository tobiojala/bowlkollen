import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch(
    process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/players?select=id,name&limit=5',
    {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    }
  )
  const data = await res.json()
  return NextResponse.json({ status: res.status, data, keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length })
}
