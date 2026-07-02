'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COLOR } from '@/lib/brand'
import { useUserSeasonMatches } from '@/lib/queries'
import { isoWeekStart } from './week'
import { PULS_HERO_H } from './PulsHero'

const NAV_H = 56

/** Rendered from the global Nav only on /schema — once the Puls hero has
 * scrolled out of view, the nav's right pill grows a second glass row
 * underneath it (Dynamic-Island-style), showing this week at a glance.
 * Tapping it recalls the hero as a peek overlay without losing scroll
 * position. Kept out of Nav.tsx itself so the shared nav stays free of
 * page-specific data/logic. */
export function SchemaNavRecall() {
  const [visible, setVisible] = useState(false)
  const { data: matches = [] } = useUserSeasonMatches()

  useEffect(() => {
    const onScroll = (e: Event) => {
      const y = (e as CustomEvent<{ y: number }>).detail.y
      setVisible(y > PULS_HERO_H - NAV_H)
    }
    window.addEventListener('bk-scroll', onScroll)
    return () => window.removeEventListener('bk-scroll', onScroll)
  }, [])

  const currentWeek = isoWeekStart(new Date().toISOString().slice(0, 10))
  const count = matches.filter(m => isoWeekStart(m.matchDate.slice(0, 10)) === currentWeek).length

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={() => window.dispatchEvent(new CustomEvent('bk-schema-recall'))}
          aria-label="Visa puls"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'fixed', top: NAV_H - 1, right: 14, zIndex: 39,
            minWidth: 108, height: 30, overflow: 'hidden',
            borderRadius: '0 0 16px 16px',
            background: 'rgba(14,17,22,0.85)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.14)',
            borderTop: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '0 12px',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: COLOR.gold, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink, whiteSpace: 'nowrap' }}>
            {count} denna v.
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
