'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { RosterPlayer } from '@/lib/queries'

const COL = 'max(0px, calc(50vw - 300px))'

const AV_LABEL: Record<string, { label: string; color: string }> = {
  yes:   { label: 'Kan spela', color: COLOR.green },
  maybe: { label: 'Kanske',    color: COLOR.gold  },
  no:    { label: 'Kan inte',  color: COLOR.red   },
}

type Props = {
  open:                    boolean
  onClose:                 () => void
  roster:                  RosterPlayer[]
  usedPublicIds:           string[]
  availabilityByPublicId:  Record<string, string | undefined>
  onPick:                  (publicId: string, name: string) => void
}

/** Bottom sheet roster picker — sorted (by sortRosterForPicker upstream) so
 * available players surface first, each row showing real stats, not a fake
 * tier/rating badge. */
export function PlayerPickerSheet({ open, onClose, roster, usedPublicIds, availabilityByPublicId, onPick }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'fixed', bottom: 0, left: COL, right: COL, zIndex: 61, maxHeight: '75vh',
              background: COLOR.surface, borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
              boxShadow: '0 -12px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLOR.ink }}>Välj spelare</span>
              <button onClick={onClose} aria-label="Stäng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <X size={20} color={COLOR.ink3} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: `0 ${SPACE[4]}px ${SPACE[6]}px` }}>
              {roster.map(p => {
                const used   = usedPublicIds.includes(p.publicId)
                const avInfo = AV_LABEL[availabilityByPublicId[p.publicId] ?? '']
                return (
                  <button
                    key={p.publicId}
                    onClick={() => !used && onPick(p.publicId, p.name)}
                    disabled={used}
                    style={{
                      display: 'flex', alignItems: 'center', gap: SPACE[3], width: '100%',
                      padding: `${SPACE[3]}px 0`, borderTop: `1px solid ${COLOR.hairline}`,
                      background: 'none', border: 'none', borderTopWidth: 1, textAlign: 'left',
                      cursor: used ? 'default' : 'pointer', opacity: used ? 0.35 : 1,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    {avInfo && <span style={{ fontSize: TYPE.caption, fontWeight: 700, color: avInfo.color, flexShrink: 0 }}>{avInfo.label}</span>}
                    <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, minWidth: 70, textAlign: 'right', flexShrink: 0 }}>
                      {p.licenceAverage ? `snitt ${p.licenceAverage}` : '—'}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
