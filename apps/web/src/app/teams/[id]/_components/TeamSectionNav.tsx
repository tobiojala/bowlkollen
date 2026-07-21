'use client'

import React, { useState, useEffect } from 'react'
import { COLOR } from '@/lib/brand'

const BASE_SECTIONS = [
  { id: 'team-overview',  label: 'Säsong'    },
  { id: 'team-squad',     label: 'Trupp'     },
  { id: 'team-matches',   label: 'Matcher'   },
  { id: 'team-community', label: 'Community' },
  { id: 'team-sponsors',  label: 'Sponsorer' },
]

type Props = { teamName: string; showSponsors: boolean }

export default function TeamSectionNav({ showSponsors }: Props) {
  const sections = showSponsors ? BASE_SECTIONS : BASE_SECTIONS.slice(0, 4)
  const [active, setActive] = useState<string>('team-overview')

  useEffect(() => {
    const observers = sections.map(s => {
      const el = document.getElementById(s.id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(s.id) },
        { rootMargin: '-35% 0px -55% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [showSponsors])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(14,17,22,0.92)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${COLOR.hairline}`,
      display: 'flex',
    } as React.CSSProperties}>
      {sections.map(s => {
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            style={{
              flex: 1,
              padding: '13px 4px',
              border: 'none',
              borderBottom: `2.5px solid ${isActive ? COLOR.gold : 'transparent'}`,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? COLOR.gold : COLOR.ink3,
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.15s, border-color 0.15s',
            } as React.CSSProperties}
          >
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}
