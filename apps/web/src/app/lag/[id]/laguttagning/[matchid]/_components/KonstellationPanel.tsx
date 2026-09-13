'use client'

import { Plus, Check } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useKonstellationer } from '@/lib/lineup-aids'

const MIN_TOGETHER = 4 // enough shared bords to be a real pairing, not a fluke
const TOP_N = 4

type Person = { publicId: string; name: string }

// "Bästa konstellationer": among the lineup candidates, the pairs with the strongest
// historical 2-man record. Captains can tap + to seat a proven pair into an empty
// banpar (parity with native KonstellationPanel); a display-only list otherwise.
// Win-rate tints green only when strong — never colour alone, the record carries it.
export function KonstellationPanel({
  candidates, seatedIds, onSeatPair, onOpenPlayer,
}: {
  candidates: Person[]
  /** Omit these three to render a read-only panel (viewer/fan view). */
  seatedIds?: Set<string>
  onSeatPair?: (a: Person, b: Person) => void
  onOpenPlayer?: (publicId: string) => void
}) {
  const { data: pairs = [] } = useKonstellationer(candidates.map((c) => c.publicId))
  const nameById = new Map(candidates.map((c) => [c.publicId, c.name] as const))
  const interactive = !!onSeatPair

  const top = pairs
    .filter((p) => p.together >= MIN_TOGETHER && nameById.has(p.aPublicId) && nameById.has(p.bPublicId))
    .sort((a, b) => b.winRate - a.winRate || b.together - a.together)
    .slice(0, TOP_N)

  if (!top.length) return null

  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`, marginBottom: SPACE[4] }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, marginBottom: SPACE[1] }}>BÄSTA KONSTELLATIONER</div>
      {top.map((p) => {
        const a: Person = { publicId: p.aPublicId, name: nameById.get(p.aPublicId)! }
        const b: Person = { publicId: p.bPublicId, name: nameById.get(p.bPublicId)! }
        const pct = Math.round(p.winRate * 100)
        const bothFree = !seatedIds || (!seatedIds.has(a.publicId) && !seatedIds.has(b.publicId))
        const NameTag = ({ person, faint }: { person: Person; faint?: boolean }) => {
          const style = {
            display: 'block', textAlign: 'left' as const, background: 'none', border: 'none', padding: 0, margin: 0,
            fontSize: faint ? TYPE.caption : TYPE.body, fontWeight: 600, color: faint ? COLOR.ink2 : COLOR.ink,
            cursor: onOpenPlayer ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '100%',
          }
          return onOpenPlayer
            ? <button onClick={() => onOpenPlayer(person.publicId)} style={style}>{person.name}</button>
            : <span style={style}>{person.name}</span>
        }
        return (
          <div key={`${p.aPublicId}-${p.bPublicId}`}
            style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px 0`, borderTop: `1px solid ${COLOR.surface2}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <NameTag person={a} />
              <NameTag person={b} faint />
            </div>
            <div style={{ textAlign: 'right', minWidth: 74 }}>
              <div style={{ fontSize: TYPE.body, fontWeight: 800, color: COLOR.ink, fontVariantNumeric: 'tabular-nums' }}>{p.wins}–{p.losses}</div>
              <div style={{ fontSize: TYPE.caption, color: pct >= 60 ? COLOR.green : COLOR.ink3, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{pct}% · {p.together} ihop</div>
            </div>
            {interactive && (
              bothFree ? (
                <button onClick={() => onSeatPair!(a, b)} aria-label={`Placera ${a.name} och ${b.name}`}
                  style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${COLOR.surface2}`, background: COLOR.surface }}>
                  <Plus size={20} color={COLOR.ink} />
                </button>
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLOR.surface2}` }}>
                  <Check size={18} color={COLOR.ink4} />
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
