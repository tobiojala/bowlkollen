'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useSession } from '@/lib/queries'
import { COLOR, MOTION, RADIUS, SPACE, TYPE } from '@/lib/brand'

// px reserved above text for the floated label
const FIELD_TOP = 22
const FIELD_BOT = 10

function EmailField({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}) {
  const [focused, setFocused] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)
  const floated = focused || value.length > 0

  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setMouse({ x: e.clientX - r.left, y: e.clientY - r.top })
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ position: 'relative', borderRadius: RADIUS.md, overflow: 'hidden' }}
    >
      {/* Focus ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: RADIUS.md, pointerEvents: 'none',
        border: `1px solid ${focused ? COLOR.gold : COLOR.hairline}`,
        transition: `border-color ${MOTION.fast}s ease`,
        zIndex: 3,
      }} />

      {/* Gold mouse-tracking gradient */}
      {hovering && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: `radial-gradient(180px circle at ${mouse.x}px ${mouse.y}px, rgba(245,194,0,0.07) 0%, transparent 70%)`,
        }} />
      )}

      {/* Mail icon */}
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: focused ? COLOR.gold : COLOR.ink3,
        transition: `color ${MOTION.fast}s ease`,
        zIndex: 4, pointerEvents: 'none', display: 'flex',
      }}>
        <Mail size={16} />
      </div>

      {/* Floating label */}
      <label style={{
        position: 'absolute', left: 42, pointerEvents: 'none', zIndex: 4, lineHeight: 1,
        fontSize: floated ? 10 : TYPE.caption,
        color: floated ? COLOR.gold : COLOR.ink3,
        top: floated ? 8 : '50%',
        transform: floated ? 'none' : 'translateY(-50%)',
        fontWeight: floated ? 700 : 400,
        letterSpacing: floated ? '0.08em' : 'normal',
        textTransform: floated ? 'uppercase' : 'none',
        transition: `top ${MOTION.fast}s ease, font-size ${MOTION.fast}s ease, color ${MOTION.fast}s ease, transform ${MOTION.fast}s ease`,
      }}>
        Email
      </label>

      <input
        type="email"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        autoComplete="email"
        autoCapitalize="none"
        inputMode="email"
        placeholder=""
        style={{
          width: '100%', background: COLOR.surface2, border: 'none', outline: 'none',
          borderRadius: RADIUS.md, paddingLeft: 42, paddingRight: SPACE[4],
          paddingTop: FIELD_TOP, paddingBottom: FIELD_BOT,
          fontSize: TYPE.body, color: COLOR.ink,
          boxSizing: 'border-box' as const, position: 'relative', zIndex: 2,
          fontFamily: 'var(--font-body)',
        }}
      />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [email, setEmail] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    if (session) router.replace('/')
  }, [session, router])

  // Surface the invite-gated-signup / auth errors passed back by /auth/callback.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('error')
    if (p === 'invite') setError('Registrering kräver en inbjudan. Ange din kod eller öppna din inbjudningslänk.')
    else if (p === 'auth') setError('Inloggningen misslyckades. Försök igen.')
  }, [])

  const redeemInvite = () => {
    const c = inviteCode.trim()
    if (c) window.location.href = `/invite/${encodeURIComponent(c)}`
  }

  const signInWithGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const signInWithMagicLink = async () => {
    if (!email.trim()) return
    setMagicLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setMagicSent(true)
    setMagicLoading(false)
  }

  const canSubmit = email.trim().length > 0

  return (
    <main style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse 700px 500px at 50% 35%, rgba(245,194,0,0.025) 0%, transparent 70%), ${COLOR.bg}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: `${SPACE[6]}px ${SPACE[4]}px`,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{
          background: COLOR.surface,
          border: `1px solid ${COLOR.hairline}`,
          borderRadius: RADIUS.xl,
          padding: SPACE[8],
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
        }}>

          {/* Branding */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[8] }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, overflow: 'hidden', marginBottom: SPACE[1], boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}>
              <Image src="/bklogo.png" alt="Bowlkollen" width={72} height={72} />
            </div>
            <Image src="/bowlkollen-wordmark.png" alt="Bowlkollen" width={180} height={47} />
            <p style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: SPACE[1] }}>
              Logga in för att fortsätta
            </p>
          </div>

          {/* Google */}
          <button
            onClick={signInWithGoogle}
            disabled={googleLoading}
            onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: SPACE[3], background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`,
              borderRadius: RADIUS.md, padding: `14px ${SPACE[4]}px`,
              fontSize: TYPE.body, fontWeight: 600,
              color: googleLoading ? COLOR.ink3 : COLOR.ink,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              opacity: googleLoading ? 0.6 : 1, marginBottom: SPACE[4],
              fontFamily: 'var(--font-body)',
              transition: `opacity ${MOTION.fast}s ease, transform ${MOTION.fast}s ease`,
            }}
          >
            {googleLoading ? (
              <div className="animate-spin" style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${COLOR.ink4}`, borderTopColor: COLOR.ink2 }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Loggar in...' : 'Fortsätt med Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], marginBottom: SPACE[4] }}>
            <div style={{ flex: 1, height: 1, background: COLOR.hairline }} />
            <span style={{ fontSize: 11, color: COLOR.ink4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              eller med email
            </span>
            <div style={{ flex: 1, height: 1, background: COLOR.hairline }} />
          </div>

          {/* Magic link or success */}
          {!magicSent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
              <EmailField
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onSubmit={signInWithMagicLink}
              />
              <button
                onClick={signInWithMagicLink}
                disabled={magicLoading || !canSubmit}
                className="btn-gold"
                style={{
                  width: '100%', position: 'relative',
                  background: canSubmit ? COLOR.gold : COLOR.surface2,
                  border: `1px solid ${canSubmit ? 'transparent' : COLOR.hairline}`,
                  borderRadius: RADIUS.md, padding: `14px ${SPACE[4]}px`,
                  fontSize: TYPE.body, fontWeight: 700, fontFamily: 'var(--font-body)',
                  color: canSubmit ? COLOR.bg : COLOR.ink4,
                  cursor: canSubmit ? 'pointer' : 'default',
                  transition: `background ${MOTION.normal}s ease, color ${MOTION.normal}s ease, border-color ${MOTION.normal}s ease`,
                }}
              >
                <span style={{ opacity: magicLoading ? 0 : 1, transition: `opacity ${MOTION.fast}s` }}>
                  Skicka inloggningslänk
                </span>
                {magicLoading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(11,13,16,0.25)', borderTopColor: COLOR.bg }} />
                  </div>
                )}
                <div className="btn-shimmer" />
              </button>
            </div>
          ) : (
            <div style={{
              background: `${COLOR.green}14`, border: `1px solid ${COLOR.green}40`,
              borderRadius: RADIUS.md, padding: SPACE[4], textAlign: 'center',
            }}>
              <div style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.green, marginBottom: 4 }}>
                Kolla din email!
              </div>
              <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>
                Vi skickade en länk till {email}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: SPACE[3], background: `${COLOR.red}14`, border: `1px solid ${COLOR.red}40`,
              borderRadius: RADIUS.sm, padding: `${SPACE[2]}px ${SPACE[3]}px`,
              fontSize: TYPE.caption, color: COLOR.red, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Invite code — required to create a new account during soft-launch */}
          <div style={{ marginTop: SPACE[6], paddingTop: SPACE[4], borderTop: `1px solid ${COLOR.hairline}` }}>
            <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginBottom: SPACE[2], textAlign: 'center' }}>
              Ny här? Registrering kräver en inbjudningskod.
            </div>
            <div style={{ display: 'flex', gap: SPACE[2] }}>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') redeemInvite() }}
                placeholder="Inbjudningskod"
                autoComplete="off"
                style={{
                  flex: 1, background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`,
                  borderRadius: RADIUS.md, padding: `12px ${SPACE[3]}px`, fontSize: TYPE.body,
                  color: COLOR.ink, outline: 'none', fontFamily: 'var(--font-body)',
                }}
              />
              <button onClick={redeemInvite} disabled={!inviteCode.trim()}
                style={{
                  background: inviteCode.trim() ? COLOR.surface2 : 'transparent',
                  border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.md, padding: `0 ${SPACE[4]}px`,
                  fontSize: TYPE.body, fontWeight: 700, color: inviteCode.trim() ? COLOR.ink : COLOR.ink4,
                  cursor: inviteCode.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-body)',
                }}>
                Lös in
              </button>
            </div>
          </div>

          {/* Terms */}
          <p style={{ marginTop: SPACE[6], textAlign: 'center', fontSize: 11, color: COLOR.ink4, lineHeight: 1.6 }}>
            Genom att logga in godkänner du våra{' '}
            <Link href="/legal" style={{ color: COLOR.gold, textDecoration: 'none' }}>
              användarvillkor
            </Link>
          </p>

        </div>
      </div>
    </main>
  )
}
