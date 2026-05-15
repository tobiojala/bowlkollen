'use client'

import React, { useState, useEffect } from 'react'

type Slide = {
  id: string
  type: 'welcome' | 'tournament'
  title: string
  subtitle?: string
  meta?: string[]
  image?: string
  bg?: string
  href?: string
  buttonLabel?: string
  buttonHref?: string
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    type: 'welcome',
    title: 'Bowlkollen',
    subtitle: 'Live resultat och statistik for svensk bowling',
  },
  {
    id: 'sm',
    type: 'tournament',
    title: 'SM-slutspel 2026',
    subtitle: 'Semifinaler och final i Elitserien Herrar och Damer',
    meta: ['15-17 maj 2026', 'Semifinaler & Final', 'Elitserien'],
    bg: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)',
    href: '/schema',
    buttonLabel: 'Se schema',
    buttonHref: '/schema',
  },
  {
    id: 'sllm',
    type: 'tournament',
    title: 'Storm Lucky Larsen Masters 2026',
    subtitle: 'Det enda internationella PBA Tour-evenemanget 2026',
    meta: ['22-30 aug 2026', 'Lucky Bowl, Helsingborg', 'PBA Tour'],
    image: 'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
    href: '/sllm',
    buttonLabel: 'Se turnering',
    buttonHref: '/sllm',
  },
]

const YELLOW = '#f5c200'
const GOLD = '#e8a000'

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [paused])

  const slide = SLIDES[current]

  return (
    <div
      style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 32, height: 280, cursor: slide.href ? 'pointer' : 'default' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => { if (slide.href) window.location.href = slide.href }}
    >
      {/* Background */}
      {slide.image ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src={slide.image} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,16,30,0.95) 100%)' }} />
        </div>
      ) : slide.bg ? (
        <div style={{ position: 'absolute', inset: 0, background: slide.bg }}>
          {/* SM trophy decoration */}
          <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', fontSize: 120, opacity: 0.08 }}>🏆</div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a5c8a 0%, #1278b0 100%)' }} />
      )}

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px 28px' }}>
        {slide.type === 'welcome' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 8 }}>VALKOMMEN TILL</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#ffffff', marginBottom: 6, lineHeight: 1 }}>
              Bowl<span style={{ color: YELLOW }}>kollen</span>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 20 }}>{slide.subtitle}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/schema" onClick={e => e.stopPropagation()} style={{ background: YELLOW, color: '#1a1400', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Schema</a>
              <a href="/league" onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>Serietabell</a>
            </div>
          </>
        )}

        {slide.type === 'tournament' && (
          <>
            {slide.id === 'sm' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,160,0,0.2)', border: '1px solid rgba(232,160,0,0.4)', borderRadius: 20, padding: '3px 10px', marginBottom: 10, width: 'fit-content' }}>
                <span style={{ fontSize: 10 }}>🏆</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: 1.5 }}>PAGAENDE NU</span>
              </div>
            )}
            {slide.id === 'sllm' && (
              <div style={{ fontSize: 10, fontWeight: 700, color: YELLOW, letterSpacing: 2, marginBottom: 8 }}>KOMMANDE TURNERING · PBA TOUR</div>
            )}
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 6, lineHeight: 1.2 }}>
              {slide.id === 'sm'
                ? <><span style={{ color: GOLD }}>SM</span>-slutspel 2026</>
                : slide.title
              }
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>{slide.subtitle}</div>
            {slide.meta && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {slide.meta.map((m, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>{m}</span>
                ))}
              </div>
            )}
            {slide.buttonHref && (
              <a href={slide.buttonHref} onClick={e => e.stopPropagation()} style={{ background: slide.id === 'sm' ? GOLD : YELLOW, color: '#1a1400', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>
                {slide.buttonLabel}
              </a>
            )}
          </>
        )}
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 14, right: 50, display: 'flex', gap: 6, alignItems: 'center' }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i); setPaused(true) }} style={{ width: i === current ? 20 : 7, height: 7, borderRadius: 4, background: i === current ? YELLOW : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Arrows */}
      <button onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length); setPaused(true) }} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 32, height: 32, color: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        &#8249;
      </button>
      <button onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % SLIDES.length); setPaused(true) }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 32, height: 32, color: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        &#8250;
      </button>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.1)' }}>
        {!paused && <div key={current} style={{ height: '100%', background: YELLOW, animation: 'carouselprogress 5s linear', width: '0%' }} />}
      </div>

      <style>{`@keyframes carouselprogress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  )
}
