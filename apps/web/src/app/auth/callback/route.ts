import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { verifyInviteCookie } from '@/lib/invite-cookie'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      const user = data.session.user
      const seenOnboarding = user.user_metadata?.onboarding_seen === true
      const inviteCode = verifyInviteCookie(cookieStore.get('bk_invite')?.value ?? '')

      // Invite-gated SIGNUP (viewing stays open). A brand-new account that
      // arrives without a valid invite is rejected and removed; existing users
      // always pass. Gate is on by default — set DISABLE_SIGNUP_GATE=true at
      // public launch to open registration.
      const isNewUser  = Date.now() - new Date(user.created_at).getTime() < 120_000
      const signupGated = process.env.DISABLE_SIGNUP_GATE !== 'true'
      if (signupGated && isNewUser && !inviteCode) {
        try { await createServiceSupabase().auth.admin.deleteUser(user.id) } catch {}
        await supabase.auth.signOut()
        return NextResponse.redirect(origin + '/login?error=invite')
      }

      // Attribute the signup to whichever invite link brought this person in —
      // first-login only (seenOnboarding flips true once onboarding completes),
      // so a repeat magic-link click can't double-insert.
      if (!seenOnboarding && inviteCode) {
        await createServiceSupabase()
          .from('invite_redemptions')
          .upsert({ code: inviteCode, user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
      }

      return NextResponse.redirect(origin + (seenOnboarding ? '/' : '/onboarding'))
    }
  }
  return NextResponse.redirect(origin + '/login?error=auth')
}
