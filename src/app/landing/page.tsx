'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useInView, useAnimation } from 'framer-motion'
import { useEffect } from 'react'
import Reveal from '@/components/Reveal'
import SubscribeForm from './SubscribeForm'

/* ─── Tokens ──────────────────────────────────────────────────── */
const INK      = '#f4f5f7'
const INK2     = 'rgba(244,245,247,0.64)'
const INK3     = 'rgba(244,245,247,0.40)'
const INK4     = 'rgba(244,245,247,0.24)'
const GOLD     = '#f5c200'
const GREEN    = '#5dcaa5'
const BG       = '#0b0d10'
const SURFACE  = '#14171c'
const HAIRLINE = 'rgba(244,245,247,0.07)'
const FONT_D   = "var(--font-display, 'Barlow Condensed', system-ui)"

/* ─── Socials ─────────────────────────────────────────────────── */
const SOCIALS = [
  {
    name: 'Instagram', href: 'https://instagram.com/bowlkollen',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>,
  },
  {
    name: 'TikTok', href: 'https://tiktok.com/@bowlkollen',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>,
  },
  {
    name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61590369915218',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>,
  },
]

/* ─── App preview card ────────────────────────────────────────── */
function AppPreview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const bar = useAnimation()

  useEffect(() => {
    if (inView) bar.start({ width: '68%', transition: { duration: 0.9, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } })
  }, [inView, bar])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: SURFACE,
        borderRadius: 20,
        border: `1px solid ${HAIRLINE}`,
        overflow: 'hidden',
        boxShadow: `0 0 80px rgba(245,194,0,0.07), 0 24px 64px rgba(0,0,0,0.55)`,
      }}
    >
      {/* Live match row */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${HAIRLINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}` }}
          />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: GOLD }}>Live</span>
          <span style={{ fontSize: 9, color: INK4, marginLeft: 'auto' }}>Spel 3 av 4</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, flex: 1 }}>Örebro BK</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
            <span style={{ fontFamily: FONT_D, fontSize: 32, fontWeight: 900, color: INK, lineHeight: 1 }}>5</span>
            <span style={{ fontSize: 13, color: INK4 }}>–</span>
            <span style={{ fontFamily: FONT_D, fontSize: 32, fontWeight: 900, color: INK3, lineHeight: 1 }}>2</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: INK3, flex: 1, textAlign: 'right' as const }}>Malmö BK</span>
        </div>
      </div>

      {/* Prediction row */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${HAIRLINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: INK4 }}>Prediktion</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>Du gissade rätt!</span>
        </div>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 7, background: 'rgba(244,245,247,0.08)' }}>
          <motion.div animate={bar} initial={{ width: '0%' }} style={{ background: GOLD, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>68% Vinst</span>
          <span style={{ fontSize: 10, color: INK4 }}>32% Förlust</span>
        </div>
      </div>

      {/* Player stat row */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${HAIRLINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(245,194,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: GOLD,
          }}>SH</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Sara Holmberg</div>
            <div style={{ fontSize: 10, color: INK3 }}>Örebro BK · Elitserien</div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontFamily: FONT_D, fontSize: 26, fontWeight: 900, color: INK, lineHeight: 1 }}>208</div>
            <div style={{ fontSize: 9, color: GREEN, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>+4 FORM</div>
          </div>
        </div>
      </div>

      {/* Team story row */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'rgba(93,202,165,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🏆</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 2 }}>Tredje raka vinsten!</div>
            <div style={{ fontSize: 11, color: INK3 }}>Örebro BK är i bästa formen på 3 år</div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: GREEN, textTransform: 'uppercase' as const }}>Nyhet</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Headline word reveal ────────────────────────────────────── */
function WordReveal({ words, delay = 0, gold = false }: { words: string[]; delay?: number; gold?: boolean }) {
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            display: 'inline-block',
            marginRight: i < words.length - 1 ? '0.18em' : 0,
            fontFamily: FONT_D,
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

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ container: containerRef })

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh', background: BG, color: INK,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        overflowX: 'hidden', position: 'relative',
      }}
    >
      {/* Grain */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, opacity: 0.032,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat', backgroundSize: '256px 256px',
      }} />

      {/* Scroll progress bar */}
      <motion.div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 50,
        background: `linear-gradient(90deg, ${GOLD}, #ffdd57)`,
        transformOrigin: '0%', scaleX: scrollYProgress,
      }} />

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-10%', left: '25%', width: 600, height: 500, background: 'radial-gradient(ellipse, rgba(245,194,0,0.06) 0%, transparent 65%)', borderRadius: '50%' }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(93,202,165,0.03) 0%, transparent 65%)', borderRadius: '50%' }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', padding: '0 22px' }}>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo-mark.png" alt="Bowlkollen" width={56} height={56} style={{ height: 56, width: 'auto' }} priority />
            <Image src="/logo-wordmark.png" alt="" aria-hidden="true" width={110} height={36} style={{ height: 36, width: 'auto' }} priority />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            style={{
              padding: '4px 11px',
              background: 'rgba(245,194,0,0.07)', border: '1px solid rgba(245,194,0,0.18)',
              borderRadius: 100, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1,
            }}
          >
            KOMMER SNART
          </motion.div>
        </motion.header>

        <main>
          {/* Hero */}
          <section aria-label="Introduktion" style={{ paddingTop: 40, paddingBottom: 32 }}>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: GREEN, boxShadow: `0 0 10px rgba(93,202,165,0.8)`,
                animation: 'glowPulse 2.5s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: INK3, letterSpacing: 0.1 }}>
                Under uppbyggnad — forma det från start
              </span>
            </motion.div>

            {/* H1 — no overflow:hidden, lineHeight 1.1 to avoid descender clipping */}
            <h1 style={{
              fontSize: 'clamp(52px, 11vw, 74px)',
              fontWeight: 900,
              letterSpacing: -1,
              lineHeight: 1.1,
              margin: '0 0 18px',
            }}>
              <div><WordReveal words={['Bowling.']} delay={0.18} /></div>
              <div><WordReveal words={['Äntligen', 'rätt.']} delay={0.3} gold /></div>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              style={{ fontSize: 15, lineHeight: 1.7, color: INK2, margin: '0 0 24px', maxWidth: 380 }}
            >
              Live-resultat, djup statistik, prediktion och lagets berättelse — allt för svenska bowlare.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
            >
              <SubscribeForm />
            </motion.div>
          </section>

          {/* App preview */}
          <section aria-label="Förhandsvisning" style={{ paddingBottom: 32 }}>
            <AppPreview />

            {/* Compact proof strip */}
            <Reveal direction="up" delay={0.1}>
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 20,
                marginTop: 20, flexWrap: 'wrap' as const,
              }}>
                {[
                  { label: 'Live resultat', color: GOLD },
                  { label: 'Prediktion', color: GOLD },
                  { label: 'BK Rating', color: GREEN },
                  { label: 'Lagets berättelse', color: GREEN },
                ].map(p => (
                  <span key={p.label} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                    textTransform: 'uppercase' as const,
                    color: INK4,
                  }}>
                    <span style={{ color: p.color, marginRight: 5 }}>·</span>{p.label}
                  </span>
                ))}
              </div>
            </Reveal>
          </section>
        </main>

        {/* Footer */}
        <Reveal direction="fade">
          <footer style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap' as const, gap: 16, paddingBottom: 36,
            borderTop: `1px solid ${HAIRLINE}`, paddingTop: 20,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {SOCIALS.map(s => (
                <motion.a
                  key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                  whileHover={{ borderColor: 'rgba(255,255,255,0.2)', color: INK2 }}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '50%', color: INK4, textDecoration: 'none',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
            <p style={{ fontSize: 11, color: INK2, margin: 0 }}>
              © 2026 Bowlkollen ·{' '}
              <Link href="/legal" style={{ color: 'inherit', textDecoration: 'none' }}>Integritetspolicy</Link>
            </p>
          </footer>
        </Reveal>
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
