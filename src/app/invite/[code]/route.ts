import { NextResponse, type NextRequest } from 'next/server'
import { createPublicSupabase } from '@/lib/supabase-server'
import { signInviteCookie } from '@/lib/invite-cookie'

const MAX_AGE_DAYS = 365

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { data: valid } = await createPublicSupabase().rpc('validate_and_redeem_invite_code', { p_code: code })

  const origin = request.nextUrl.origin
  if (!valid) {
    return NextResponse.redirect(origin + '/landing')
  }

  const response = NextResponse.redirect(origin + '/')
  response.cookies.set('bk_invite', signInviteCookie(code), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_DAYS * 86400,
  })
  return response
}
