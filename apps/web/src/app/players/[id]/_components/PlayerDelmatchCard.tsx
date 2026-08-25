'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { usePlayerDelmatchRecord } from './use-player-delmatch'

// The "Bord" section on a web player profile: head-to-head duel record, bordform,
// milestones, fiercest rivalries and best partners — reconstructed from BITS bord
// data (shared core engine). Renders nothing until there's history. Records shown
// win-first + form dots carry V/F/O, so meaning never rides on colour alone.
export function PlayerDelmatchCard({ playerId }: { playerId: string }) {
  const { data } = usePlayerDelmatchRecord(playerId)
  if (!data?.hasData) return null
  const { record: r, milestones: m, rivalries, partners, recent } = data
  const has2v2 = partners.length > 0

  return (
    <section style={{ padding: `${SPACE[8]}px 20px 0` }}>
      <div style={{ color: COLOR.ink3, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: SPACE[3] }}>BORD</div>

      {/* Duel record hero */}
      <div style={{ textAlign: 'center', marginBottom: SPACE[4] }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: COLOR.ink }}>{r.wins}</span>
          <span style={{ fontSize: 22, color: COLOR.ink4, margin: `0 ${SPACE[2]}px` }}>–</span>
          <span style={{ fontSize: 34, fontWeight: 800, color: COLOR.ink3 }}>{r.losses}</span>
          {r.ties > 0 && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginLeft: SPACE[2] }}>({r.ties} oavgj)</span>}
        </div>
        <div style={{ color: COLOR.ink2, fontSize: TYPE.caption, fontWeight: 600, marginTop: 2 }}>
          {Math.round(r.winRate * 100)}% vinst · {r.played} bord
        </div>
      </div>

      {/* Bordform — V/F/O dots (letter + colour, never colour alone) */}
      {recent.length > 0 && (
        <div style={{ marginBottom: SPACE[4] }}>
          <div style={{ color: COLOR.ink3, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', marginBottom: SPACE[2] }}>BORDFORM</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {recent.slice(0, 12).map((d, i) => {
              const kind = d.outcome === 'home' ? 'V' : d.outcome === 'away' ? 'F' : 'O'
              const c = kind === 'V' ? COLOR.green : kind === 'F' ? COLOR.red : COLOR.ink2
              return (
                <span key={`${d.matchId}-${i}`} style={{
                  width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: TYPE.caption, fontWeight: 800, color: c, background: `${c}22`, border: `1px solid ${c}55`,
                }}>{kind}</span>
              )
            })}
            <span style={{ color: COLOR.ink3, fontSize: TYPE.caption, marginLeft: 2 }}>senaste</span>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[2], marginBottom: SPACE[4] }}>
        <Milestone label="Bästa serie" value={String(m.bestGame)} gold={m.bestGame >= 300} />
        {m.perfectGames > 0 && <Milestone label="Perfekt spel" value={`${m.perfectGames}× 300`} gold />}
        {has2v2 && <Milestone label="Bästa par" value={String(m.bestPairTotal)} />}
        {m.biggestWinMargin > 0 && <Milestone label="Största seger" value={`+${m.biggestWinMargin}`} />}
      </div>

      {rivalries.length > 0 && (
        <Block label="RIVALER">
          {rivalries.slice(0, 3).map(riv => (
            <FaceRow key={riv.opponentId} name={riv.opponentName} publicId={riv.opponentId} wins={riv.wins} losses={riv.losses} meta={`${riv.meetings} möten`} />
          ))}
        </Block>
      )}

      {has2v2 && (
        <Block label="BÄSTA PARTNER">
          {partners.slice(0, 2).map(p => (
            <FaceRow key={p.partnerId} name={p.partnerName} publicId={p.partnerId} wins={p.wins} losses={p.losses} meta={`${p.together} ihop`} />
          ))}
        </Block>
      )}
    </section>
  )
}

function Milestone({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div style={{ flexGrow: 1, minWidth: 82, textAlign: 'center', background: COLOR.surface, borderRadius: RADIUS.md, padding: `${SPACE[3]}px ${SPACE[2]}px` }}>
      <div style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 800, color: gold ? COLOR.gold : COLOR.ink }}>{value}</div>
      <div style={{ color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 }}>{label}</div>
    </div>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: SPACE[2] }}>
      <div style={{ color: COLOR.ink3, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', margin: `${SPACE[3]}px 0 ${SPACE[1]}px` }}>{label}</div>
      {children}
    </div>
  )
}

function FaceRow({ name, publicId, wins, losses, meta }: { name: string; publicId: string; wins: number; losses: number; meta: string }) {
  const c = wins > losses ? COLOR.green : wins < losses ? COLOR.red : COLOR.ink2
  return (
    <Link href={`/players/${publicId}`} style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px 0`, textDecoration: 'none',
      borderTop: `1px solid ${COLOR.hairline}`,
    }}>
      <span style={{ flex: 1, minWidth: 0, color: COLOR.ink, fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ color: COLOR.ink3, fontSize: TYPE.caption }}>{meta}</span>
      <span style={{ color: c, fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'right' }}>{wins}–{losses}</span>
      <ChevronRight size={16} color={COLOR.ink4} style={{ flexShrink: 0 }} />
    </Link>
  )
}
