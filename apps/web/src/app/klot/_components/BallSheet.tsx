'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check } from 'lucide-react'
import { COLOR, FONT, RADIUS } from '@/lib/brand'
import { BallOrb } from '@/components/BallOrb'
import type { CatalogBall } from '@/lib/balls'

const COL = 'max(0px, calc(50vw - 300px))'
const fmt3 = (n: number | null) => (n == null ? '–' : n.toFixed(3).replace(/^0/, ''))
const relDate = (d: string | null) => {
  if (!d) return null
  const dt = new Date(d + 'T12:00:00')
  return Number.isNaN(dt.getTime()) ? null : dt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Cell({ v, k, word }: { v: string; k: string; word?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: word ? FONT.body : FONT.score, fontWeight: word ? 700 : 700, fontSize: word ? 15 : 22, color: COLOR.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: COLOR.ink3, textTransform: 'uppercase', marginTop: 6 }}>{k}</div>
    </div>
  )
}

// The klot detail — a bottom sheet (native pattern), primary action pinned to the
// thumb zone. Cardless: hairline-bounded spec grid, no boxes.
export function BallSheet({ ball, inBag, adding, onClose, onAdd }: {
  ball: CatalogBall | null; inBag: boolean; adding: boolean; onClose: () => void; onAdd: (b: CatalogBall, weight: number) => void
}) {
  const [weight, setWeight] = useState(15)
  useEffect(() => { setWeight(15) }, [ball?.id])   // reset to default when a new klot opens
  const released = ball ? relDate(ball.releaseDate) : null
  const discontinued = ball?.availability === 'Discontinued'
  return (
    <AnimatePresence>
      {ball && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{ position: 'fixed', bottom: 0, left: COL, right: COL, zIndex: 61, maxHeight: '90vh', overflowY: 'auto',
              background: COLOR.surface, borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`, boxShadow: '0 -18px 50px rgba(0,0,0,0.55)', padding: `10px 20px 0` }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: COLOR.ink4, margin: '2px auto 14px' }} />
            <button onClick={onClose} aria-label="Stäng" style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><X size={20} color={COLOR.ink3} /></button>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 16px' }}><BallOrb name={ball.name} imageUrl={ball.imageUrl} size={128} /></div>
            {(released || ball.availability) && (
              <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 13, fontWeight: 600, color: COLOR.ink3, display: 'flex', gap: 7, alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: discontinued ? COLOR.ink4 : COLOR.green }} />
                {discontinued ? 'Utgången' : released ? `Släpps ${released}` : ball.availability}
              </div>
            )}
            <h2 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 32, lineHeight: 1, margin: 0, textAlign: 'center' }}>{ball.name}</h2>
            <div style={{ color: COLOR.ink2, fontSize: 15, fontWeight: 600, margin: '6px 0 18px', textAlign: 'center' }}>
              {ball.brand}{ball.core ? ` · ${ball.core}-core` : ''}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 10px', padding: '18px 0', borderTop: `1px solid ${COLOR.hairline}`, borderBottom: `1px solid ${COLOR.hairline}`, textAlign: 'center' }}>
              <Cell v={ball.rg != null ? ball.rg.toFixed(3) : '–'} k="RG" />
              <Cell v={fmt3(ball.differential)} k="Diff" />
              <Cell v={ball.intDiff != null ? fmt3(ball.intDiff) : '–'} k="Int. diff" />
              <Cell v={ball.coreType ? (ball.coreType.startsWith('Asym') ? 'Asymm.' : 'Symm.') : '–'} k="Core" word />
              <Cell v={ball.coverstockType?.split(' ')[0] ?? '–'} k="Cover" word />
              <Cell v={ball.factoryFinish ?? '–'} k="Finish" word />
            </div>

            {ball.coverstock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '16px 0 4px', fontSize: 14, color: COLOR.ink2 }}>
                <BallOrb name={ball.name} imageUrl={null} size={18} />
                {ball.coverstock}{ball.coverstockType ? ` — ${ball.coverstockType}` : ''}
              </div>
            )}
            <div style={{ fontSize: 12, color: COLOR.ink4, margin: '10px 0 0' }}>Data från bowwwl.com</div>

            {!inBag && (
              <div style={{ margin: '18px 0 2px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, textTransform: 'uppercase', marginBottom: 10 }}>Vikt</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[12, 13, 14, 15, 16].map(w => (
                    <button key={w} onClick={() => setWeight(w)}
                      style={{ flex: 1, minHeight: 46, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: FONT.score, fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums',
                        background: w === weight ? COLOR.gold : COLOR.surface2, color: w === weight ? '#1a1400' : COLOR.ink2 }}>{w}</button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 8 }}>Spec anges för 15 lb.</div>
              </div>
            )}

            <div style={{ position: 'sticky', bottom: 0, background: `linear-gradient(180deg, transparent, ${COLOR.surface} 24%)`, padding: '16px 0 22px', marginTop: 6 }}>
              <button onClick={() => !inBag && !adding && onAdd(ball, weight)} disabled={inBag || adding}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', minHeight: 54,
                  background: inBag ? COLOR.surface2 : COLOR.gold, color: inBag ? COLOR.ink2 : '#1a1400', border: 'none', borderRadius: 16,
                  fontFamily: FONT.body, fontSize: 17, fontWeight: 700, cursor: inBag || adding ? 'default' : 'pointer' }}>
                {inBag ? <><Check size={20} color={COLOR.green} /> I din arsenal</> : <><Plus size={20} color="#1a1400" strokeWidth={2.4} /> {adding ? 'Lägger till…' : 'Lägg till i arsenal'}</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
