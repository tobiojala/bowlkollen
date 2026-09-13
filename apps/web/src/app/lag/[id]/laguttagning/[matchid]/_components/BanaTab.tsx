'use client'

import { MapPin } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useOilProfiles } from '@/lib/diary'
import { divisionRank } from '@/lib/lineup-aids'

// The oil-profile categories that fit a match's level. We don't get the exact booked
// pattern from BITS, so these are the division's candidates — the captain confirms in
// BITS (registered 5 weekdays before, 19:00). Mirrors native BanaTab.categoriesFor.
function categoriesFor(division: string | null): string[] {
  const r = divisionRank(division)
  if (r === 1) return ['elite', 'elite_damer']
  if (r === 2) return ['elite', 'bredare']
  if (r >= 3 && r <= 6) return ['bredare', 'sammandrag']
  return []
}

// Venue + the oil patterns likely for this match's level.
export function BanaTab({ hall, division }: { hall: string | null; division: string | null }) {
  const { data: profiles = [] } = useOilProfiles()
  const cats = categoriesFor(division)
  const relevant = cats.length ? profiles.filter(p => cats.includes(p.category ?? '')) : profiles

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[2], padding: SPACE[4], borderRadius: RADIUS.lg, background: COLOR.surface }}>
        <MapPin size={22} color={COLOR.gold} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLOR.ink, letterSpacing: '-0.01em' }}>{hall ?? 'Okänd hall'}</div>
          {division && <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 2 }}>{division}</div>}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, margin: `${SPACE[8]}px 0 ${SPACE[3]}px` }}>TROLIGA OLJEBILDER</div>
      {relevant.length > 0 ? (
        relevant.map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3], padding: `${SPACE[3]}px 0`, borderBottom: `1px solid ${COLOR.hairline}` }}>
            <span style={{ flex: 1, minWidth: 0, color: COLOR.ink, fontSize: TYPE.body, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            {(p.lengthFt != null || p.ratio != null) && (
              <span style={{ color: COLOR.ink2, fontSize: TYPE.caption, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {[p.lengthFt != null ? `${p.lengthFt} ft` : null, p.ratio != null ? `${p.ratio.toFixed(2)}:1` : null].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        ))
      ) : (
        <p style={{ color: COLOR.ink3, fontSize: TYPE.caption, padding: `${SPACE[3]}px 0` }}>Inga oljebilder inlästa.</p>
      )}
      <p style={{ color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[4], lineHeight: 1.6 }}>
        Exakt oljebild bekräftas i BITS (registreras 5 vardagar före match, senast 19:00).
      </p>
    </div>
  )
}
