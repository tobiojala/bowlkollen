'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { RosterPlayer } from '@/lib/queries'
import { candidateFit, playsDown, FIT_LABEL, useRosterSearch, type LineupCandidate } from '@/lib/lineup-aids'

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
  /** get_lineup_candidates keyed by publicId — the context-aware fit + plays-down aid. */
  candidates?:             Record<string, LineupCandidate>
  matchDivision?:          string | null
}

/** Bottom sheet roster picker — the roster (available first) with real stats, plus
 * a free search over the whole licence register so a captain can seat a bowler who
 * isn't in the app's roster list (parity with native LineupSeating). */
export function PlayerPickerSheet({ open, onClose, roster, usedPublicIds, availabilityByPublicId, onPick, candidates, matchDivision }: Props) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => { const t = setTimeout(() => setDebounced(query), 220); return () => clearTimeout(t) }, [query])
  useEffect(() => { if (!open) setQuery('') }, [open])
  const { data: hits = [] } = useRosterSearch(debounced)
  const searching = debounced.trim().length >= 2

  const rowBtn = {
    display: 'flex', alignItems: 'center', gap: SPACE[3], width: '100%',
    padding: `${SPACE[3]}px 0`, borderTop: `1px solid ${COLOR.hairline}`,
    background: 'none', border: 'none', borderTopWidth: 1, textAlign: 'left' as const,
    WebkitTapHighlightColor: 'transparent',
  }

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
                  <button key={h.publicId} onClick={() => onPick(h.publicId, h.name)} style={{ ...rowBtn, cursor: 'pointer' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                      {h.club && <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.club}</span>}
                    </span>
                    <Plus size={20} color={COLOR.gold} />
                  </button>
                ))
              ) : (
                <>
                  {roster.map(p => {
                    const used   = usedPublicIds.includes(p.publicId)
                    const avInfo = AV_LABEL[availabilityByPublicId[p.publicId] ?? '']
                    const cand   = candidates?.[p.publicId]
                    const fit    = cand ? candidateFit(cand) : null
                    const down   = cand ? playsDown(cand.homeDivision, matchDivision ?? null) : false
                    return (
                      <button key={p.publicId} onClick={() => !used && onPick(p.publicId, p.name)} disabled={used}
                        style={{ ...rowBtn, cursor: used ? 'default' : 'pointer', opacity: used ? 0.35 : 1 }}>
                        <span style={{ flex: 1, fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        {down && (
                          <span title="Spelar normalt en högre division — kontrollera spärrreglerna"
                            style={{ fontSize: 11, fontWeight: 800, color: COLOR.gold, background: 'rgba(245,194,0,0.14)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>↑ spelar upp</span>
                        )}
                        {avInfo && <span style={{ fontSize: TYPE.caption, fontWeight: 700, color: avInfo.color, flexShrink: 0 }}>{avInfo.label}</span>}
                        <span style={{ minWidth: 78, textAlign: 'right', flexShrink: 0 }}>
                          {fit && fit.value != null ? (
                            <>
                              <span style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink, fontVariantNumeric: 'tabular-nums' }}>{fit.value}</span>
                              <span style={{ display: 'block', fontSize: 11, color: COLOR.ink3 }}>{FIT_LABEL[fit.context]}</span>
                            </>
                          ) : (
                            <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{p.licenceAverage ? `snitt ${p.licenceAverage}` : '—'}</span>
                          )}
                        </span>
                      </button>
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
