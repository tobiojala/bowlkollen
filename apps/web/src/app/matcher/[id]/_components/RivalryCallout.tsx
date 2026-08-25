'use client'

import Link from 'next/link'
import { Flame, ChevronRight } from 'lucide-react'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { MatchRivalry } from './use-match-bord'

// "Kvällens hetaste bord" — the finished match's marquee career head-to-head,
// framed like a match score with a balance bar and a "how tonight went" footer.
// Leader by weight + green on the ahead side (name also present, never colour
// alone). Port of the native RivalryCallout. Tap a name → their profile.
const first = (n: string) => n.split(' ')[0]

export function RivalryCallout({ rivalry, onOpenBord }: { rivalry: MatchRivalry; onOpenBord?: () => void }) {
  const { a, b, meetings, tonight } = rivalry
  const aLeads = a.wins > b.wins, bLeads = b.wins > a.wins
  const decided = a.wins + b.wins
  const aShare = decided > 0 ? (a.wins / decided) * 100 : 50
  const tonightText = tonight === 'a' ? `Ikväll tog ${first(a.name)} bordet`
    : tonight === 'b' ? `Ikväll tog ${first(b.name)} bordet`
    : 'Ikväll delade de bordet'

  return (
    <div style={{ marginTop: SPACE[6] }}>
      <div style={{ color: COLOR.ink3, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.12em', marginBottom: SPACE[3] }}>KVÄLLENS BORD</div>
      <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE[1] }}>
          <Flame size={14} color={COLOR.gold} />
          <span style={{ color: COLOR.gold, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.12em' }}>HETASTE BORDET</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: SPACE[4] }}>
          <PlayerSide name={a.name} publicId={a.publicId} />
          <div style={{ minWidth: 96, textAlign: 'center', padding: `0 ${SPACE[2]}px` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: aLeads ? COLOR.ink : COLOR.ink2 }}>{a.wins}</span>
              <span style={{ fontSize: 20, color: COLOR.ink4, margin: `0 ${SPACE[2]}px` }}>–</span>
              <span style={{ fontSize: 30, fontWeight: 800, color: bLeads ? COLOR.ink : COLOR.ink2 }}>{b.wins}</span>
            </div>
            <div style={{ color: COLOR.ink2, fontSize: TYPE.caption, fontWeight: 600, marginTop: 2 }}>{meetings} möten</div>
          </div>
          <PlayerSide name={b.name} publicId={b.publicId} />
        </div>

        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: SPACE[4], background: COLOR.surface2 }}>
          <div style={{ width: `${aShare}%`, background: aLeads ? COLOR.ink2 : COLOR.ink4 }} />
          <div style={{ width: `${100 - aShare}%`, background: bLeads ? COLOR.ink2 : COLOR.ink4 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE[4], paddingTop: SPACE[3], borderTop: `1px solid ${COLOR.hairline}` }}>
          <span style={{ flex: 1, minWidth: 0, color: COLOR.ink2, fontSize: TYPE.caption, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tonightText}</span>
          {onOpenBord && (
            <button onClick={onOpenBord} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: COLOR.ink2, fontSize: TYPE.caption, fontWeight: 700 }}>
              Bordvyn <ChevronRight size={15} color={COLOR.ink2} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerSide({ name, publicId }: { name: string; publicId: string | null }) {
  const inner = (
    <>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: COLOR.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: COLOR.ink2 }}>
        {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <span style={{ color: COLOR.ink, fontSize: TYPE.caption, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{name}</span>
    </>
  )
  const wrap: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2], textDecoration: 'none' }
  return publicId ? <Link href={`/players/${publicId}`} style={wrap}>{inner}</Link> : <div style={wrap}>{inner}</div>
}
