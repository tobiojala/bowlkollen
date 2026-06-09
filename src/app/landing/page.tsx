'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll } from 'framer-motion'
import SubscribeForm from './SubscribeForm'

/* ─── Design tokens ─────────────────────────────────────────── */
const C_PRIMARY   = '#ffffff'
const C_BODY      = 'rgba(255,255,255,0.55)'
const C_SUBTLE    = 'rgba(255,255,255,0.25)'
const C_GOLD      = '#f5c200'

/* ─── Content ───────────────────────────────────────────────── */
const HEADLINE_WORDS_1 = ['Bowling.']
const HEADLINE_WORDS_2 = ['Äntligen', 'rätt.']

const FEATURES = [
  {
    label: 'Live',
    title: 'Se det hända i realtid',
    desc: 'Resultat uppdateras direkt — pin för pin. Aldrig mer vänta på att sidan laddas om.',
    accent: '#f5c200',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2.1 2.1M8.6 15.4l-2.1 2.1m0-11.1 2.1 2.1m6.8 6.8 2.1 2.1"/>
      </svg>
    ),
  },
  {
    label: 'Statistik',
    title: 'Data som faktiskt spelar roll',
    desc: 'Snitt, form och ranking samlat. Se vem som verkligen levererar när det gäller.',
    accent: '#7ab4e8',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    label: 'Alla ligor',
    title: 'Hela Sverige på ett ställe',
    desc: 'Elitserien till distriktsnivå — alla divisioner, alla klubbar, all bowling.',
    accent: '#5dcaa5',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/>
      </svg>
    ),
  },
  {
    label: 'Notiser',
    title: 'Missa aldrig en match',
    desc: 'Push-notiser för ditt lag. Du vet exakt när de spelar — och hur det gick.',
    accent: '#d94a90',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
]

const SOCIALS = [
  {
    name: 'Instagram', href: 'https://instagram.com/bowlkollen',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    name: 'TikTok', href: 'https://tiktok.com/@bowlkollen',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook', href: 'https://facebook.com/bowlkollen',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
]

/* ─── Components ─────────────────────────────────────────────── */
function WordReveal({ words, delay = 0, gold = false }: { words: string[]; delay?: number; gold?: boolean }) {
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            display: 'inline-block',
            marginRight: i < words.length - 1 ? '0.25em' : 0,
            ...(gold ? {
              background: 'linear-gradient(120deg, #f5c200 0%, #ffe566 45%, #f0a500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            } : {}),
          } as React.CSSProperties}
        >
          {word}
        </motion.span>
      ))}
    </>
  )
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ borderColor: `${feature.accent}35`, boxShadow: `0 0 24px ${feature.accent}0a` }}
      style={{
        padding: '20px 18px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px',
        background: `linear-gradient(90deg, transparent, ${feature.accent}50, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${feature.accent}12`,
          color: feature.accent,
        }}>
          {feature.icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: feature.accent, textTransform: 'uppercase' }}>
          {feature.label}
        </span>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C_PRIMARY, lineHeight: 1.3, margin: '0 0 6px' }}>
        {feature.title}
      </h3>
      <p style={{ fontSize: 13, color: C_BODY, lineHeight: 1.65, margin: 0 }}>
        {feature.desc}
      </p>
    </motion.article>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ container: containerRef })

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#070d15',
        color: C_PRIMARY,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Grain overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, opacity: 0.032,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat', backgroundSize: '256px 256px',
      }} />

      {/* Scroll progress bar */}
      <motion.div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 50,
        background: `linear-gradient(90deg, ${C_GOLD}, #ffdd57)`,
        transformOrigin: '0%', scaleX: scrollYProgress,
      }} />

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-15%', left: '30%', width: 600, height: 500, background: 'radial-gradient(ellipse, rgba(245,194,0,0.065) 0%, transparent 65%)', borderRadius: '50%' }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          style={{ position: 'absolute', top: '40%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(90,130,180,0.06) 0%, transparent 65%)', borderRadius: '50%' }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
          style={{ position: 'absolute', bottom: '5%', left: '10%', width: 350, height: 300, background: 'radial-gradient(ellipse, rgba(93,202,165,0.04) 0%, transparent 65%)', borderRadius: '50%' }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '0 22px' }}>

        {/* Header */}
        <header>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo-mark.png" alt="Bowlkollen" style={{ height: 64, width: 'auto' }} />
              <img src="/logo-wordmark.png" alt="" aria-hidden="true" style={{ height: 42, width: 'auto' }} />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{
                padding: '4px 11px',
                background: 'rgba(245,194,0,0.07)',
                border: `1px solid rgba(245,194,0,0.18)`,
                borderRadius: 100,
                fontSize: 10, fontWeight: 700,
                color: C_GOLD, letterSpacing: 1,
              }}
            >
              KOMMER SNART
            </motion.div>
          </motion.div>
        </header>

        {/* Hero */}
        <main>
          <section aria-label="Introduktion" style={{ paddingTop: 52, paddingBottom: 48 }}>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 22 }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: '#5dcaa5',
                boxShadow: '0 0 10px rgba(93,202,165,0.8)',
                animation: 'glowPulse 2.5s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: C_BODY, letterSpacing: 0.1 }}>
                Under uppbyggnad — vara med och forma det från start
              </span>
            </motion.div>

            <h1 style={{
              fontSize: 'clamp(38px, 8.5vw, 56px)',
              fontWeight: 900,
              letterSpacing: -2.2,
              lineHeight: 1.07,
              margin: '0 0 20px',
              overflow: 'hidden',
            }}>
              <div><WordReveal words={HEADLINE_WORDS_1} delay={0.18} /></div>
              <div><WordReveal words={HEADLINE_WORDS_2} delay={0.3} gold /></div>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              style={{
                fontSize: 16, lineHeight: 1.75,
                color: C_BODY,
                margin: '0 0 28px',
                maxWidth: 400,
              }}
            >
              Den app som svenska bowlare har väntat på — live-resultat, djup statistik och din klubb i fickan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
            >
              <SubscribeForm />
            </motion.div>
          </section>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              marginBottom: 36, transformOrigin: 'left',
            }}
          />

          {/* Features */}
          <section aria-label="Funktioner">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: 20 }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.2, color: C_BODY, textTransform: 'uppercase', marginBottom: 8, margin: '0 0 8px' }}>
                Detta bygger vi!
              </p>
              <h2 style={{ fontSize: 'clamp(18px, 3.5vw, 22px)', fontWeight: 800, color: C_PRIMARY, letterSpacing: -0.6, lineHeight: 1.2, margin: 0 }}>
                Allt samlat på en plats.
              </h2>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 40 }}>
              {FEATURES.map((f, i) => <FeatureCard key={f.label} feature={f} index={i} />)}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 16,
              paddingBottom: 40,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: 24,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {SOCIALS.map(s => (
                <motion.a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  whileHover={{ borderColor: 'rgba(255,255,255,0.2)', color: C_BODY }}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '50%',
                    color: C_SUBTLE,
                    textDecoration: 'none',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
            <p style={{ fontSize: 11, color: C_BODY, margin: 0 }}>
              © 2026 Bowlkollen ·{' '}
              <a href="/legal" style={{ color: 'inherit', textDecoration: 'none' }}>Integritetspolicy</a>
            </p>
          </motion.div>
        </footer>

      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(93,202,165,0.6); }
          50% { box-shadow: 0 0 14px rgba(93,202,165,0.9); }
        }
      `}</style>
    </div>
  )
}
