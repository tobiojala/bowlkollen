import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}
function isValidEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
export async function POST(req: NextRequest) {
  let body: { email?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Ogiltig f\u00f6rfr\u00e5gan.' }, { status: 400 }) }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !isValidEmail(email)) return NextResponse.json({ error: 'Ogiltig e-postadress.' }, { status: 400 })
  let supabase: ReturnType<typeof getServiceClient>
  try { supabase = getServiceClient() } catch { return NextResponse.json({ error: 'Serverkonfigurationsfel.' }, { status: 500 }) }
  const { error } = await supabase.from('email_subscribers').insert({ email, source: 'landing' })
  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: true })
    return NextResponse.json({ error: 'Kunde inte spara. F\u00f6rs\u00f6k igen.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
