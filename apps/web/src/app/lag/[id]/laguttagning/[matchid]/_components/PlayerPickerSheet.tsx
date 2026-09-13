'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { PlayerRow } from '@/components/PlayerRow'
import type { RosterPlayer } from '@/lib/queries'
import { candidateFit, playsDown, FIT_LABEL, useRosterSearch, type LineupCandidate } from '@/lib/lineup-aids'

const COL = 'max(0px, calc(50vw - 300px))'
type Avail = 'yes' | 'maybe' | 'no'

type Props = {
  open:                    boolean
  onClose:                 () => void
  roster:                  RosterPlayer[]
  usedPublicIds:           string[]
  availabilityByPublicId:  Record<string, string | undefined>
  onPick:                  (publicId: string, name: string) => void
  /** get_lineup_candidates keyed by publicId — the context-aware fit + plays-down aid. */
  candidates?:             Record<string, LineupCandidate>
  matchDivision?:          string | null
}

/** Bottom sheet roster picker — the roster as PlayerRow cards (available first, real
 * stats, fit at this venue/division), plus a free search over the whole licence
 * register so a captain can seat a bowler who isn't in the app's roster list. */
export function PlayerPickerSheet({ open, onClose, roster, usedPublicIds, availabilityByPublicId, onPick, candidates, matchDivision }: Props) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => { const t = setTimeout(() => setDebounced(query), 220); return () => clearTimeout(t) }, [query])
  useEffect(() => { if (!open) setQuery('') }, [open])
  const { data: hits = [] } = useRosterSearch(debounced)
  const searching = debounced.trim().length >= 2

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
              position: 'fixed', bottom: 0, left: COL, right: COL, zIndex: 61, maxHeight: '80vh',
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
            <div style={{ padding: `0 ${SPACE[4]}px ${SPACE[3]}px` }}>
              <input
                value={query} onChange={e => setQuery(e.target.value)} placeholder="Sök spelare att lägga till…"
                autoCapitalize="none" autoCorrect="off"
                style={{ width: '100%', boxSizing: 'border-box', background: COLOR.surface2, border: 'none', borderRadius: RADIUS.md, padding: `${SPACE[3]}px ${SPACE[4]}px`, color: COLOR.ink, fontSize: TYPE.body, outline: 'none' }}
              />
            </div>
            <div style={{ overflowY: 'auto', padding: `0 ${SPACE[4]}px ${SPACE[6]}px` }}>
              {searching ? (
                hits.filter(h => !usedPublicIds.includes(h.publicId)).map(h => (
                  <PlayerRow key={h.publicId} name={h.name} sub={[h.club]} onClick={() => onPick(h.publicId, h.name)}
                    trailing={<Plus size={20} color={COLOR.gold} style={{ flexShrink: 0 }} />} />
                ))
              ) : (
                <>
                  {roster.map(p => {
                    const used = usedPublicIds.includes(p.publicId)
                    const cand = candidates?.[p.publicId]
                    const fit  = cand ? candidateFit(cand) : null
                    const down = cand ? playsDown(cand.homeDivision, matchDivision ?? null) : false
                    return (
                      <PlayerRow key={p.publicId} name={p.name} disabled={used}
                        onClick={() => onPick(p.publicId, p.name)}
                        availability={(availabilityByPublicId[p.publicId] as Avail | undefined) ?? null}
                        showAvailability
                        sub={[
                          cand?.homeTeam ? `Spelar mest i ${cand.homeTeam}` : null,
                          down ? 'Spelar normalt en högre division' : null,
                        ]}
                        stat={fit && fit.value != null ? { value: fit.value, label: FIT_LABEL[fit.context] } : { value: p.licenceAverage, label: 'snitt' }}
                      />
                    )
                  })}
                  <p style={{ fontSize: TYPE.caption, color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[6]}px 0 0`, lineHeight: 1.5 }}>
                    Söker du någon som inte är med i laget i appen? Sök på namn ovan.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
