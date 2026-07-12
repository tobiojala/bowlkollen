'use client'

import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { COLOR, RADIUS, SPACE } from '@/lib/brand'
import { DivisionStandings } from './DivisionStandings'
import type { TeamStanding } from '@/lib/division-standings'

type Props = {
  open:         boolean
  onClose:      () => void
  standings:    TeamStanding[]
  tierColor:    string
  divisionName: string
}

const COL = 'max(0px, calc(50vw - 300px))'

export function StandingsSheet({ open, onClose, standings, tierColor, divisionName }: Props) {
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={onDragEnd}
            style={{
              position: 'fixed', bottom: 0, left: COL, right: COL, zIndex: 61,
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              background: COLOR.surface,
              borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
              boxShadow: '0 -12px 48px rgba(0,0,0,0.5)',
            }}
          >
            {/* Grabber */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: SPACE[3] }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: COLOR.ink4, opacity: 0.5 }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: SPACE[2],
              padding: `${SPACE[3]}px ${SPACE[4]}px`,
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink }}>
                Tabell
              </span>
              <span style={{ fontSize: 14, color: COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {divisionName}
              </span>
              <button
                onClick={onClose}
                aria-label="Stäng"
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <X size={20} color={COLOR.ink3} />
              </button>
            </div>

            {/* Scrollable standings */}
            <div style={{ overflowY: 'auto', padding: `0 ${SPACE[4]}px ${SPACE[8]}px` }}>
              <DivisionStandings standings={standings} tierColor={tierColor} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
