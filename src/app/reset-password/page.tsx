'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { Button, Card } from '@/components/ui'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken && type === 'recovery') {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          .then(({ error: sessionError }) => {
            if (!sessionError) setReady(true)
            else setError('Ogiltig eller utgangen aterstallningslank')
          })
        return
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const updatePassword = async () => {
    if (!password) return setError('Ange ett nytt losenord')
    if (password !== confirm) return setError('Losenorden matchar inte')
    if (password.length < 6) return setError('Losenordet maste vara minst 6 tecken')
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Fel: ' + updateError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/admin'
      }, 2000)
    }
  }

  const inputClass = cn(
    'w-full rounded-[10px] border border-light-border bg-light-surface px-3.5 py-3 text-sm outline-none',
    'text-light-text placeholder:text-dark-muted',
    'dark:border-dark-border dark:bg-dark-surface dark:text-dark-text',
  )

  const labelClass =
    'mb-1.5 block text-[11px] font-bold tracking-wide text-dark-muted uppercase'

  return (
    <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <div className="w-full max-w-[380px] px-6">
        <div className="mb-8 text-center">
          <div className="mb-1.5 text-[28px] font-black bk-text-primary">
            Bowl<span className="text-gold">kollen</span>
          </div>
          <p className="text-sm text-dark-muted">Skapa nytt losenord</p>
        </div>

        <Card className="flex flex-col gap-3.5 p-7">
          {success && (
            <div className="rounded-lg border border-green/40 bg-green/10 px-3.5 py-3 text-center text-[13px] font-semibold text-green">
              Losenord uppdaterat! Omdirigerar till admin...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red bg-red/10 px-3.5 py-2.5 text-[13px] font-semibold text-red">
              {error}
            </div>
          )}

          {!ready && !success && !error && (
            <div className="py-5 text-center">
              <p className="mb-2 text-[13px] text-dark-muted">
                Verifierar aterstallningslank...
              </p>
              <div
                className="mx-auto size-8 animate-spin rounded-full border-[3px] border-light-border border-t-gold dark:border-dark-border"
                role="status"
                aria-label="Laddar"
              />
            </div>
          )}

          {ready && !success && (
            <>
              <div>
                <label className={labelClass} htmlFor="new-password">
                  NYTT LOSENORD
                </label>
                <input
                  id="new-password"
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minst 6 tecken"
                  onKeyDown={e => e.key === 'Enter' && updatePassword()}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="confirm-password">
                  BEKRAFTA LOSENORD
                </label>
                <input
                  id="confirm-password"
                  className={inputClass}
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Upprepa losenordet"
                  onKeyDown={e => e.key === 'Enter' && updatePassword()}
                />
              </div>
              <Button
                variant="primary"
                onClick={updatePassword}
                disabled={loading}
                className="w-full rounded-[10px] py-3 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Sparar...' : 'Uppdatera losenord'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
