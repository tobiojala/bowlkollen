'use client'

import { motion } from 'framer-motion'
import { COLOR } from '@/lib/brand'
import { shortName, teamColor, teamInitials } from '@/lib/utils'
import type { FeedFilter, FeedView, StoryEntity } from '@/lib/story-rail'

const SIZE = 76
const RING = 3
const SHEEN = 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0) 65%)'

// Native-style icons (replicated so web + native read the same): Ionicons `apps`
// (3×3 squares) for Allt, a dotted `calendar` for Matcher, target for Prediktion.
function AllIcon({ color }: { color: string }) {
  const g = [3.5, 9.5, 15.5]
  return <svg width={30} height={30} viewBox="0 0 24 24" fill={color}>{g.flatMap((y) => g.map((x) => <rect key={`${x}-${y}`} x={x} y={y} width={5} height={5} rx={1.4} />))}</svg>
}
function CalIcon({ color }: { color: string }) {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={4.5} width={18} height={16} rx={2} /><path d="M3 9.5h18" /><path d="M8 2.5v4M16 2.5v4" />
      {[13, 17].flatMap((cy) => [8, 12, 16].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1} fill={color} stroke="none" />))}
    </svg>
  )
}
function TargetIcon({ color }: { color: string }) {
  return <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx={12} cy={12} r={9} /><circle cx={12} cy={12} r={5} /><circle cx={12} cy={12} r={1.6} fill={color} stroke="none" /></svg>
}

const VIEWS: { view: FeedView; label: string; Icon: (p: { color: string }) => React.ReactElement }[] = [
  { view: 'allt',       label: 'Allt',       Icon: AllIcon },
  { view: 'matcher',    label: 'Matcher',    Icon: CalIcon },
  { view: 'prediktion', label: 'Prediktion', Icon: TargetIcon },
]

function Chip({ active, ringGold, label, children, onClick }: {
  active: boolean; ringGold: boolean; label: string; children: React.ReactNode; onClick: () => void
}) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} aria-label={label}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: SIZE, flexShrink: 0,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE, borderRadius: '50%', padding: RING, boxSizing: 'border-box',
        background: ringGold ? COLOR.gold : COLOR.ink4, transition: 'background 0.16s ease' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none', background: SHEEN }} />
        {children}
      </div>
      <span style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? COLOR.ink : COLOR.ink3,
        letterSpacing: 0.2, whiteSpace: 'nowrap', maxWidth: SIZE, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </motion.button>
  )
}

// Instagram-style story rail. Shared view chips, then a lit/quiet circle per
// followed player and team. Tapping an entity filters the feed to them and
// marks them seen (ring dims); it relights when they next do something.
export default function StoryRail({ filter, entities, isUnseen, onSelect }: {
  filter: FeedFilter
  entities: StoryEntity[]
  isUnseen: (key: string, latestTs: string) => boolean
  onSelect: (f: FeedFilter) => void
}) {
  const disc = (children: React.ReactNode) => (
    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: COLOR.surface, border: `2px solid ${COLOR.bg}`,
      boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
  )

  return (
    <div className="home-story-rail" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '10px 16px 14px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.home-story-rail::-webkit-scrollbar { display: none }`}</style>

      {VIEWS.map(({ view, label, Icon }) => {
        const active = filter.kind === 'view' && filter.view === view
        return (
          <Chip key={view} active={active} ringGold={active} label={label} onClick={() => onSelect({ kind: 'view', view })}>
            {disc(<Icon color={active ? COLOR.gold : COLOR.ink2} />)}
          </Chip>
        )
      })}

      {entities.length > 0 && <div style={{ alignSelf: 'stretch', width: 1, background: COLOR.hairline, margin: '2px 0', flexShrink: 0 }} />}

      {entities.map((e) => {
        const active = filter.kind === 'entity' && filter.entityType === e.entityType && filter.id === e.id
        const unseen = isUnseen(e.key, e.latestTs)
        const c = teamColor(e.name, true)
        return (
          <Chip key={e.key} active={active} ringGold={unseen} label={shortName(e.name)}
            onClick={() => onSelect({ kind: 'entity', entityType: e.entityType, id: e.id, name: e.name })}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `2px solid ${COLOR.bg}`, boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, color: c.text,
              fontSize: 22, fontWeight: 800, letterSpacing: -0.5, opacity: unseen ? 1 : 0.85 }}>
              {teamInitials(e.name)}
            </div>
          </Chip>
        )
      })}
    </div>
  )
}
