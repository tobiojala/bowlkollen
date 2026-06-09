'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'

function AnimatedCount({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    const duration = 1400
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(ease * target))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])
  return <>{displayed.toLocaleString('sv-SE')}</>
}

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    fetch('/api/subscriber-count')
      .then(r => r.json())
      .then(d => setCount(typeof d.count === 'number' ? d.count : null))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) { setState('success'); setEmail(''); setCount(c => (c ?? 0) + 1) }
      else { setState('error'); setErrorMsg(data.error ?? 'Något gick fel. Försök igen.') }
    } catch {
      setState('error'); setErrorMsg('Nätverksfel. Försök igen.')
    }
  }

  const displayCount = count !== null ? count + 312 : null

  return (
    <div style={{ width: '100%' }}>

      {/* Animated social proof */}
      <AnimatePresence>
        {displayCount !== null && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: '2px solid #080e17',
                  marginLeft: i === 0 ? 0 : -8,
                  position: 'relative', zIndex: 4 - i,
                  background: [
                    'linear-gradient(135deg,#f5c200,#c07800)',
                    'linear-gradient(135deg,#5a82b4,#2d5080)',
                    'linear-gradient(135deg,#5dcaa5,#259070)',
                    'linear-gradient(135deg,#d94a90,#901860)',
                  ][i],
                }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', letterSpacing: -0.1 }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedCount target={displayCount} />
              </span>
              {' '}bowlare på listan
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              padding: '22px 24px',
              background: 'rgba(93,202,165,0.07)',
              border: '1px solid rgba(93,202,165,0.18)',
              borderRadius: 14,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#5dcaa5', marginBottom: 4 }}>
              Du är med på listan
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.55 }}>
              Vi hör av oss när Bowlkollen lanserar. Håll koll på inkorgen.
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit}>
            <motion.div
              animate={{
                boxShadow: focused
                  ? '0 0 0 3px rgba(245,194,0,0.15), 0 2px 12px rgba(0,0,0,0.4)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
                borderColor: focused ? 'rgba(245,194,0,0.3)' : 'rgba(255,255,255,0.07)',
              }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 13,
                overflow: 'hidden',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="din@epost.se"
                required
                disabled={state === 'loading'}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: 15, padding: '14px 16px',
                  fontFamily: 'inherit', minWidth: 0,
                }}
              />
              <div style={{ position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                <motion.button
                  type="submit"
                  disabled={state === 'loading' || !email.trim()}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    position: 'relative',
                    background: '#f5c200',
                    color: '#000',
                    border: 'none',
                    padding: '0 22px',
                    height: '100%',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: state === 'loading' ? 'wait' : 'pointer',
                    opacity: !email.trim() ? 0.45 : 1,
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    letterSpacing: -0.2,
                    transition: 'opacity 0.15s',
                    zIndex: 1,
                  }}
                >
                  {state === 'loading' ? '···' : 'Få tidig tillgång'}
                </motion.button>
                {/* Shimmer sweep */}
                {email.trim() && state !== 'loading' && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '40%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                      zIndex: 2, pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {state === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ margin: '8px 0 0', fontSize: 12, color: '#e05555' }}
                >
                  {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: 0.1 }}>
              Gratis · Inga spam · Avregistrera när som helst
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
