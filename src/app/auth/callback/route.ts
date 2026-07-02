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
    if (!error) {
      const seenOnboarding = data.session?.user.user_metadata?.onboarding_seen === true

      // Attribute the signup to whichever invite link brought this person
      // in — first-login only (seenOnboarding flips true once onboarding
      // completes/skips), so a repeat magic-link click can't double-insert.
      if (!seenOnboarding && data.session) {
        const inviteCode = verifyInviteCookie(cookieStore.get('bk_invite')?.value ?? '')
        if (inviteCode) {
          await createServiceSupabase()
            .from('invite_redemptions')
            .upsert({ code: inviteCode, user_id: data.session.user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
        }
      }

      return NextResponse.redirect(origin + (seenOnboarding ? '/' : '/onboarding'))
    }
  }
  return NextResponse.redirect(origin + '/login?error=auth')
}
