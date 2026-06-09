'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import SubscribeForm from './SubscribeForm'

const FEATURES = [
  { label: 'Live', title: 'Se det hända i realtid', desc: 'Poäng, strikes och spares uppdateras direkt. Aldrig mer undra hur det går.', accent: '#f5c200',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2.1 2.1M8.6 15.4l-2.1 2.1m0-11.1 2.1 2.1m6.8 6.8 2.1 2.1"/></svg> },
  { label: 'Statistik', title: 'Data som faktiskt spelar roll', desc: 'Snitt, form, ranking och jämförelser. För spelare som vill förbättras.', accent: '#7ab4e8',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label: 'Divisioner', title: 'Hela Sverige. Alla ligor.', desc: 'Elitserien till distriktsnivmå – en app för hela rörelsen.', accent: '#5dcaa5',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/></svg> },
  { label: 'Notiser', title: 'Missa aldrig en match', desc: 'Push-notiser för ditt lag. Vet exakt när de spelar och hur det slutade.', accent: '#d94a90',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
]

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ padding: '22px 20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${feature.accent}40, transparent)` }} />
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: `${feature.accent}12`, color: feature.accent, marginBottom: 14 }}>{feature.icon}</div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.6, color: feature.accent, textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>{feature.label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{feature.title}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{feature.desc}</div>
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080e17', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(245,194,0,0.05) 0%, transparent 65%)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 580, margin: '0 auto', padding: '0 24px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, background: '#f5c200', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.5" fill="#000" stroke="none"/><circle cx="14" cy="7" r="1.5" fill="#000" stroke="none"/><circle cx="15" cy="13" r="1.5" fill="#000" stroke="none"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>Bowlkollen</span>
          </div>
          <div style={{ padding: '5px 12px', background: 'rgba(245,194,0,0.08)', border: '1px solid rgba(245,194,0,0.18)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#f5c200', letterSpacing: 0.8 }}>Kommer snart</div>
        </motion.div>

        <div style={{ paddingTop: 80, paddingBottom: 80 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} style={{ marginBottom: 24 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5dcaa5', boxShadow: '0 0 8px rgba(93,202,165,0.6)' }} />
              Tidigt i bygget — din chans att forma produkten
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}
            style={{ fontSize: 'clamp(38px, 9vw, 58px)', fontWeight: 900, letterSpacing: -2.5, lineHeight: 1.06, margin: '0 0 22px' }}>
            Bowling.<br />
            <span style={{ background: 'linear-gradient(120deg, #f5c200 0%, #ffdd57 40%, #f0a500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties}>
              Äntligen rätt.
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
            style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', margin: '0 0 44px', maxWidth: 420, fontWeight: 400 }}>
            Vi bygger appen som hela den svenska bowlrörelsen behöver — live-resultat, djup statistik och din förening i fickan.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}>
            <SubscribeForm />
          </motion.div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 72 }} />

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 10 }}>Det här saknas i dag</div>
          <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: '#fff', letterSpacing: -0.8, lineHeight: 1.25 }}>En samlad upplevelse för hela sporten</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 80 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.label} feature={f} index={i} />)}
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ padding: '44px 32px', background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, marginBottom: 80 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 12 }}>Early access</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, color: '#fff', marginBottom: 10, lineHeight: 1.2 }}>
            De som är med från start<br /><span style={{ color: '#f5c200' }}>formar produkten.</span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.65, marginBottom: 28, maxWidth: 360 }}>
            Tidig tillgång, direkt linje till oss och chansen att påverka vad vi bygger härnäst.
          </p>
          <SubscribeForm />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ paddingBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.2)', marginBottom: 14 }}>Följ resan</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {[['Instagram','https://instagram.com/bowlkollen'],['TikTok','https://tiktok.com/@bowlkollen'],['Facebook','https://facebook.com/bowlkollen']].map(([name, href]) => (
              <motion.a key={name} href={href} target="_blank" rel="noopener noreferrer"
                whileHover={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
                style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 12, fontWeight: 600, transition: 'border-color 0.15s, color 0.15s' }}>{name}</motion.a>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
            © 2026 Bowlkollen · <a href="/legal" style={{ color: 'inherit', textDecoration: 'none' }}>Integritetspolicy</a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
