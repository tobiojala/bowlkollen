'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'

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
    image:
      'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
    href: '/sllm',
    buttonLabel: 'Se tavling',
    buttonHref: '/sllm',
  },
]

const carouselNavBtn =
  'absolute top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-lg text-white [-webkit-tap-highlight-color:transparent]'

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
      className={cn(
        'relative mb-8 h-[280px] overflow-hidden rounded-2xl',
        slide.href ? 'cursor-pointer' : 'cursor-default',
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => {
        if (slide.href) window.location.href = slide.href
      }}
    >
      {slide.image ? (
        <div className="absolute inset-0">
          <img
            src={slide.image}
            alt={slide.title}
            className="block h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-[rgba(10,16,30,0.95)]" />
        </div>
      ) : slide.bg ? (
        <div className="absolute inset-0" style={{ background: slide.bg }}>
          <div className="absolute top-1/2 right-10 -translate-y-1/2 text-[120px] opacity-[0.08]">
            🏆
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a5c8a] to-[#1278b0]" />
      )}

      <div className="absolute inset-0 flex flex-col justify-end px-7 py-6">
        {slide.type === 'welcome' && (
          <>
            <div className="mb-2 text-[11px] font-bold tracking-[2px] text-white/60">
              VALKOMMEN TILL
            </div>
            <div className="mb-1.5 text-4xl leading-none font-black text-white">
              Bowl<span className="text-gold">kollen</span>
            </div>
            <div className="mb-5 text-sm text-white/75">{slide.subtitle}</div>
            <div className="flex gap-2.5">
              <a
                href="/schema"
                onClick={e => e.stopPropagation()}
                className="rounded-lg bg-gold px-4 py-2 text-[13px] font-extrabold text-[#1a1400] no-underline"
              >
                Schema
              </a>
              <a
                href="/league"
                onClick={e => e.stopPropagation()}
                className="rounded-lg border border-white/20 bg-white/15 px-4 py-2 text-[13px] font-bold text-white no-underline"
              >
                Serietabell
              </a>
            </div>
          </>
        )}

        {slide.type === 'tournament' && (
          <>
            {slide.id === 'sm' && (
              <div className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#e8a000]/40 bg-[#e8a000]/20 px-2.5 py-0.5">
                <span className="text-[10px]">🏆</span>
                <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#e8a000]">
                  PAGAENDE NU
                </span>
              </div>
            )}
            {slide.id === 'sllm' && (
              <div className="mb-2 text-[10px] font-bold tracking-[2px] text-gold">
                KOMMANDE TAVLING · PBA TOUR
              </div>
            )}
            <div className="mb-1.5 text-2xl leading-tight font-black text-white">
              {slide.id === 'sm' ? (
                <>
                  <span className="text-[#e8a000]">SM</span>-slutspel 2026
                </>
              ) : (
                slide.title
              )}
            </div>
            <div className="mb-3 text-[13px] text-white/75">{slide.subtitle}</div>
            {slide.meta && (
              <div className="mb-4 flex flex-wrap gap-2">
                {slide.meta.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-white/12 px-2.5 py-0.5 text-[11px] text-white/90"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
            {slide.buttonHref && (
              <a
                href={slide.buttonHref}
                onClick={e => e.stopPropagation()}
                className={cn(
                  'inline-block rounded-lg px-4 py-2 text-[13px] font-extrabold text-[#1a1400] no-underline',
                  slide.id === 'sm' ? 'bg-[#e8a000]' : 'bg-gold',
                )}
              >
                {slide.buttonLabel}
              </a>
            )}
          </>
        )}
      </div>

      <div className="absolute right-[50px] bottom-3.5 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={e => {
              e.stopPropagation()
              setCurrent(i)
              setPaused(true)
            }}
            className={cn(
              'h-[7px] cursor-pointer rounded border-0 p-0 transition-all duration-300',
              '[-webkit-tap-highlight-color:transparent]',
              i === current ? 'w-5 bg-gold' : 'w-[7px] bg-white/40',
            )}
            aria-label={`Gå till slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        type="button"
        className={cn(carouselNavBtn, 'left-2.5')}
        onClick={e => {
          e.stopPropagation()
          setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length)
          setPaused(true)
        }}
        aria-label="Föregående slide"
      >
        &#8249;
      </button>
      <button
        type="button"
        className={cn(carouselNavBtn, 'right-2.5')}
        onClick={e => {
          e.stopPropagation()
          setCurrent(c => (c + 1) % SLIDES.length)
          setPaused(true)
        }}
        aria-label="Nästa slide"
      >
        &#8250;
      </button>

      <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-white/10">
        {!paused && <div key={current} className="bk-carousel-progress w-0" />}
      </div>
    </div>
  )
}
