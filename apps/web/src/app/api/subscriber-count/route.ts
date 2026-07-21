import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { count } = await supabase.from('email_subscribers').select('*', { count: 'exact', head: true })
    return NextResponse.json({ count: count ?? 0 })
  } catch { return NextResponse.json({ count: 0 }) }
}
