'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui'

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
  }, [])

  const signInWithGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
    if (err) { setError(err.message); setGoogleLoading(false) }
  }

  const signInWithMagicLink = async () => {
    if (!email.trim()) return
    setMagicLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    })
    if (err) setError(err.message)
    else setMagicSent(true)
    setMagicLoading(false)
  }

  const inputClass = cn(
    'mb-2 w-full rounded-xl border border-light-border bg-light-card px-4 py-3.5 text-sm outline-none',
    'text-[#1a2535] placeholder:text-dark-muted',
    'dark:border-dark-border dark:bg-dark-card dark:text-white',
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
      <div className="w-full max-w-[360px] px-6">

        <div className="mb-10 text-center">
          <div className="mb-2 text-[28px] font-black tracking-tight bk-text-primary">
            Bowl<span className="text-gold">kollen</span>
          </div>
          <p className="text-sm text-dark-muted">Logga in för att fortsätta</p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className={cn(
            'mb-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border px-5 py-3.5',
            'border-light-border bg-light-card text-[15px] font-semibold bk-text-primary',
            'dark:border-dark-border dark:bg-dark-card',
            'disabled:cursor-not-allowed disabled:opacity-70',
          )}
        >
          {!googleLoading && (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading ? 'Loggar in...' : 'Fortsätt med Google'}
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
          <span className="text-[11px] text-dark-muted">eller med e-post</span>
          <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
        </div>

        {!magicSent ? (
          <div className="mb-4">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signInWithMagicLink()}
              type="email"
              placeholder="din@email.com"
              className={inputClass}
            />
            <Button
              variant="ghost"
              disabled={magicLoading || !email.trim()}
              onClick={signInWithMagicLink}
              className="w-full py-3.5 disabled:opacity-50"
            >
              {magicLoading ? 'Skickar...' : 'Skicka inloggningslänk'}
            </Button>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-green/40 bg-green/10 px-4 py-4 text-center">
            <p className="text-sm font-bold text-green">Kolla din e-post!</p>
            <p className="mt-1 text-[13px] text-dark-muted">
              Vi skickade en inloggningslänk till {email}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-[10px] border border-red bg-red/10 px-3.5 py-2.5 text-center text-[13px] text-red">
            {error}
          </div>
        )}

        <p className="text-center text-xs leading-relaxed text-dark-muted">
          Genom att logga in godkänner du våra{' '}
          <Link href="/legal" className="font-semibold text-gold no-underline">
            villkor och integritet
          </Link>
        </p>

      </div>
    </main>
  )
}
