'use client'

import { Plus, X } from 'lucide-react'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { LineupSlot } from '@/lib/queries'

const BOARDS = [1, 2, 3, 4]
type Target = { bord: number; pos: number; isReserve: boolean }

type Props = {
  slots:        LineupSlot[]
  editable:     boolean
  onSeatEmpty?: (target: Target) => void
  onRemove?:    (publicId: string) => void
}

const label: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: COLOR.ink3, letterSpacing: '0.1em', marginBottom: SPACE[2] }

// One seat — the native LineupSeating look: empty = dashed "+", filled = avatar +
// name + a remove ✕ (captain only). Compact variant for reserves.
function Seat({ slot, editable, compact, onAdd, onRemove }: {
  slot?: LineupSlot | null; editable: boolean; compact?: boolean
  onAdd?: () => void; onRemove?: (publicId: string) => void
}) {
  const box: React.CSSProperties = {
    flex: compact ? '0 0 auto' : 1, minWidth: compact ? 150 : 0, minHeight: compact ? 52 : 60,
    borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: SPACE[2], padding: `0 ${SPACE[3]}px`, boxSizing: 'border-box',
  }
  if (!slot) {
    if (!editable) return <div style={{ ...box, background: COLOR.surface, color: COLOR.ink4 }}>—</div>
    return (
      <button onClick={onAdd} style={{ ...box, cursor: 'pointer', background: 'transparent', border: `1px dashed ${COLOR.hairline}` }}>
        <Plus size={compact ? 20 : 24} color={COLOR.ink3} />
      </button>
    )
  }
  return (
    <div style={{ ...box, background: COLOR.surface, justifyContent: 'flex-start' }}>
      <IdentityAvatar name={slot.playerName} size={30} />
      <span style={{ flex: 1, minWidth: 0, fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.playerName}</span>
      {editable && onRemove && (
        <button onClick={() => onRemove(slot.publicId)} aria-label={`Ta bort ${slot.playerName}`} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
          <X size={18} color={COLOR.ink4} />
        </button>
      )}
    </div>
  )
}

/** 4 banpar × 2 seats + a dynamic reserve row. Captain taps an empty seat to open
 * the picker, ✕ to clear; everyone else sees it read-only. */
export function LineupBoardGrid({ slots, editable, onSeatEmpty, onRemove }: Props) {
  const starter = (bord: number, pos: number) => slots.find(s => !s.isReserve && s.bord === bord && s.pos === pos) ?? null
  const reserves = slots.filter(s => s.isReserve).sort((a, b) => a.pos - b.pos)
  const nextReservePos = (reserves[reserves.length - 1]?.pos ?? 0) + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
      {BOARDS.map(bord => (
        <div key={bord}>
          <div style={label}>BANPAR {bord}</div>
          <div style={{ display: 'flex', gap: SPACE[3] }}>
            {[1, 2].map(pos => (
              <Seat key={pos} slot={starter(bord, pos)} editable={editable}
                onAdd={() => onSeatEmpty?.({ bord, pos, isReserve: false })} onRemove={onRemove} />
            ))}
          </div>
        </div>
      ))}

      {(editable || reserves.length > 0) && (
        <div>
          <div style={label}>RESERVER</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[3] }}>
            {reserves.map(r => <Seat key={r.publicId} slot={r} editable={editable} compact onRemove={onRemove} />)}
            {editable && <Seat editable compact onAdd={() => onSeatEmpty?.({ bord: 0, pos: nextReservePos, isReserve: true })} />}
          </div>
        </div>
      )}
    </div>
  )
}
