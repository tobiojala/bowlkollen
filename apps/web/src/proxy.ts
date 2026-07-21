import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PROTECTED_PATHS, GATE_EXEMPT_PATHS } from '@/lib/constants'
import { verifyInviteCookie } from '@/lib/invite-cookie'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Refresh session cookie on every request so tokens don't expire mid-browse.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the token server-side — more secure than getSession().
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Soft-launch invite gate — flag defaults off, so this is a no-op until
  // explicitly enabled for the invite-only window. Signed-in users always
  // pass regardless of the cookie; everyone else needs a valid invite link.
  const isGateExempt = GATE_EXEMPT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (process.env.ENABLE_INVITE_GATE === 'true' && !isGateExempt && !user) {
    const inviteCookie = request.cookies.get('bk_invite')?.value ?? ''
    if (!verifyInviteCookie(inviteCookie)) {
      const landingUrl = request.nextUrl.clone()
      landingUrl.pathname = '/landing'
      return NextResponse.redirect(landingUrl)
    }
  }

  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and the auth callback route.
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
