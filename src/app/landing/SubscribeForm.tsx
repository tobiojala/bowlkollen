'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
      setState('error')
      setErrorMsg('Nätverksfel. Försök igen.')
    }
  }

  const displayCount = count !== null ? count + 312 : null

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence>
        {displayCount !== null && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #080e17',
                  marginLeft: i === 0 ? 0 : -7, position: 'relative', zIndex: 4 - i,
                  background: ['linear-gradient(135deg,#f5c200,#e07b00)','linear-gradient(135deg,#5a82b4,#2d5a9e)',
                    'linear-gradient(135deg,#5dcaa5,#2a8f70)','linear-gradient(135deg,#d94a90,#8f1a5c)'][i] }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{displayCount.toLocaleString('sv-SE')}</span>
              {' '}bowlare väntar redan
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {state === 'success' ? (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ padding: '20px 24px', background: 'rgba(93,202,165,0.08)', border: '1px solid rgba(93,202,165,0.2)', borderRadius: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#5dcaa5', marginBottom: 4 }}>Du är med på listan</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Vi hör av oss när Bowlkollen lanserar. Håll koll på inkorgen.</div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit}>
            <motion.div animate={{ boxShadow: focused ? '0 0 0 3px rgba(245,194,0,0.12)' : '0 1px 3px rgba(0,0,0,0.3)',
                borderColor: focused ? 'rgba(245,194,0,0.25)' : 'rgba(255,255,255,0.08)' }} transition={{ duration: 0.2 }}
              style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                placeholder="din@epost.se" required disabled={state === 'loading'}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff',
                  fontSize: 15, padding: '14px 16px', fontFamily: 'inherit', minWidth: 0 }} />
              <motion.button type="submit" disabled={state === 'loading' || !email.trim()} whileTap={{ scale: 0.97 }}
                style={{ background: '#f5c200', color: '#000', border: 'none', padding: '0 22px', fontSize: 14,
                  fontWeight: 800, cursor: state === 'loading' ? 'wait' : 'pointer', opacity: !email.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
                {state === 'loading' ? '···' : 'Få tidig tillgång'}
              </motion.button>
            </motion.div>
            <AnimatePresence>
              {state === 'error' && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ margin: '8px 0 0', fontSize: 12, color: '#e05555' }}>{errorMsg}</motion.p>
              )}
            </AnimatePresence>
            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Gratis · Inga spam · Avregistrera dig när som helst</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
