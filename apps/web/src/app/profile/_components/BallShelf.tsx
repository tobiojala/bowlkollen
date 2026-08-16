'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, Trash2 } from 'lucide-react'
import { useMyBalls, useUpdateBall, useDeleteBall, type BagBall } from '@/lib/balls'

const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'
const SURFACE2 = '#1c2127'
const HAIR = 'rgba(244,245,247,0.08)'
const ORB = 72

function hue(s: string) { return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360 }

function BallOrb({ ball, size = ORB }: { ball: BagBall; size?: number }) {
  const h = hue(`${ball.brand ?? ''}${ball.name}`)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 32% 28%, hsl(${h},70%,58%), hsl(${h},65%,32%) 70%, hsl(${h},60%,20%))`,
      boxShadow: 'inset 0 -4px 10px rgba(0,0,0,0.35), inset 0 3px 8px rgba(255,255,255,0.18)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: size * 0.3, fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: -1 }}>
        {(ball.brand ?? ball.name).slice(0, 1).toUpperCase()}
      </span>
    </div>
  )
}

// The bag as a shelf: a rail of ball orbs. Tap → detail. Native's BallShelf.
export default function BallShelf() {
  const { data: balls = [] } = useMyBalls()
  const [selected, setSelected] = useState<BagBall | null>(null)

  const ordered = [...balls.filter((b) => b.inBag), ...balls.filter((b) => !b.inBag)]

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 2px 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em' }}>DIN VÄSKA</span>
        {balls.length > 0 && <Link href="/arsenal/add" style={{ fontSize: 14, fontWeight: 600, color: INK2, textDecoration: 'none' }}>Lägg till</Link>}
      </div>

      {balls.length === 0 ? (
        <Link href="/arsenal/add"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, textDecoration: 'none',
            background: 'rgba(245,194,0,0.08)', border: '1px solid rgba(245,194,0,0.24)' }}>
          <Plus size={24} color={GOLD} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Bygg din väska</div>
            <div style={{ fontSize: 14, color: INK3, marginTop: 2 }}>Lägg till kloten du spelar med — så minns appen vad du kastar.</div>
          </div>
        </Link>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {ordered.map((b) => (
            <button key={b.id} onClick={() => setSelected(b)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: ORB + 12, flexShrink: 0, padding: 0 }}>
              <div style={{ opacity: b.inBag ? 1 : 0.4 }}><BallOrb ball={b} /></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: INK, maxWidth: ORB + 10, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
              {b.weight != null && <span style={{ fontSize: 12, color: INK3 }}>{b.weight} lb</span>}
            </button>
          ))}
          <Link href="/arsenal/add" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: ORB + 12, flexShrink: 0, textDecoration: 'none' }}>
            <div style={{ width: ORB, height: ORB, borderRadius: '50%', border: `1px dashed ${HAIR}`, background: SURFACE,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={30} color={INK3} />
            </div>
            <span style={{ fontSize: 12, color: INK3 }}>Lägg till</span>
          </Link>
        </div>
      )}

      {selected && <BallDetail ball={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function BallDetail({ ball, onClose }: { ball: BagBall; onClose: () => void }) {
  const update = useUpdateBall()
  const del = useDeleteBall()

  const specs: [string, string | null][] = [
    ['Vikt', ball.weight != null ? `${ball.weight} lb` : null],
    ['Yta', ball.surface],
    ['Layout', ball.layout],
    ['Coverstock', ball.coverstock],
    ['Kärna', ball.core],
    ['RG', ball.rg != null ? String(ball.rg) : null],
    ['Diff', ball.differential != null ? String(ball.differential) : null],
  ]

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 600, background: SURFACE, borderRadius: '20px 20px 0 0', padding: 20, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <BallOrb ball={ball} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {ball.brand && <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{ball.brand}</div>}
            <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>{ball.name}</div>
          </div>
          <button onClick={onClose} aria-label="Stäng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={24} color={INK3} /></button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {specs.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ background: SURFACE2, borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: INK4, letterSpacing: '0.06em' }}>{k.toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        {ball.notes && <div style={{ fontSize: 15, color: INK2, lineHeight: 1.5, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{ball.notes}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { update.mutate({ id: ball.id, patch: { in_bag: !ball.inBag } }); onClose() }}
            style={{ flex: 1, padding: '13px', borderRadius: 12, cursor: 'pointer', background: SURFACE2, border: `1px solid ${HAIR}`, color: INK, fontSize: 15, fontWeight: 700 }}>
            {ball.inBag ? 'Pensionera' : 'Tillbaka i väskan'}
          </button>
          <button onClick={() => { if (window.confirm('Ta bort klotet?')) { del.mutate(ball.id); onClose() } }}
            aria-label="Ta bort klot"
            style={{ padding: '13px 16px', borderRadius: 12, cursor: 'pointer', background: 'none', border: `1px solid ${HAIR}` }}>
            <Trash2 size={20} color="#e05555" />
          </button>
        </div>
      </div>
    </div>
  )
}
