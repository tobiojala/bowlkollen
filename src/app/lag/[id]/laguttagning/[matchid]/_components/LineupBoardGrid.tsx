'use client'

import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { LineupSlot } from '@/lib/queries'

type Props = {
  slots:        LineupSlot[]
  editable:     boolean
  onSlotClick?: (bord: number, pos: number, isReserve: boolean) => void
}

function findSlot(slots: LineupSlot[], bord: number, pos: number, isReserve: boolean): LineupSlot | null {
  return slots.find(s => s.bord === bord && s.pos === pos && s.isReserve === isReserve) ?? null
}

function SlotCell({ label, slot, editable, onClick }: {
  label: string; slot: LineupSlot | null; editable: boolean; onClick?: () => void
}) {
  return (
    <div
      onClick={editable ? onClick : undefined}
      style={{
        flex: 1, padding: SPACE[3], cursor: editable ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: 2, WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: COLOR.ink3, letterSpacing: '0.06em' }}>{label}</span>
      {slot ? (
        <span style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {slot.playerName}
        </span>
      ) : (
        <span style={{ fontSize: TYPE.body, color: editable ? COLOR.gold : COLOR.ink3 }}>
          {editable ? '+ Välj spelare' : '—'}
        </span>
      )}
    </div>
  )
}

/** The 4-board × 2-position grid + reserves. Captain: tap an empty or filled
 * slot to open the picker / clear it. Everyone else: read-only. */
export function LineupBoardGrid({ slots, editable, onSlotClick }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
      {[1, 2, 3, 4].map(bord => (
        <div key={bord} style={{ background: COLOR.surface, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
          <div style={{
            padding: `${SPACE[2]}px ${SPACE[3]}px`, background: 'rgba(245,194,0,0.06)',
            fontSize: 11, fontWeight: 800, color: COLOR.gold, letterSpacing: '0.08em',
          }}>
            BORD {bord}
          </div>
          <div style={{ display: 'flex' }}>
            <SlotCell label="POS 1" slot={findSlot(slots, bord, 1, false)} editable={editable} onClick={() => onSlotClick?.(bord, 1, false)} />
            <div style={{ width: 1, background: COLOR.hairline }} />
            <SlotCell label="POS 2" slot={findSlot(slots, bord, 2, false)} editable={editable} onClick={() => onSlotClick?.(bord, 2, false)} />
          </div>
        </div>
      ))}

      <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
        <div style={{ padding: `${SPACE[2]}px ${SPACE[3]}px`, background: COLOR.surface2, fontSize: 11, fontWeight: 800, color: COLOR.ink2, letterSpacing: '0.08em' }}>
          RESERVER
        </div>
        <div style={{ display: 'flex' }}>
          <SlotCell label="RESERV 1" slot={findSlot(slots, 0, 1, true)} editable={editable} onClick={() => onSlotClick?.(0, 1, true)} />
          <div style={{ width: 1, background: COLOR.hairline }} />
          <SlotCell label="RESERV 2" slot={findSlot(slots, 0, 2, true)} editable={editable} onClick={() => onSlotClick?.(0, 2, true)} />
        </div>
      </div>
    </div>
  )
}
