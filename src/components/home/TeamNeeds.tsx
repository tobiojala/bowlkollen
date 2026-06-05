import { dark } from '@/lib/colors'
import { shortName } from '@/lib/utils'
import { shortDiv } from '@/app/home/helpers'
import type { TableRow, Match } from '@/app/home/types'
import type { DIVISION_ZONES } from '@/app/home/demoData'

type MyPlayer = {
  name: string; team: string; teamId: string; division: string
  average: number; lastScores: number[]; teamRank: number
}

export default function TeamNeeds({ myPlayer, tables, divisionZones, upcoming, C, isDark }: {
  myPlayer: MyPlayer
  tables: Record<string, TableRow[]>
  divisionZones: typeof DIVISION_ZONES
  upcoming: Match[]
  C: typeof dark
  isDark: boolean
}) {
  const div    = myPlayer.division
  const table  = tables[div] ?? []
  const myRow  = table.find(r => r.teamId === myPlayer.teamId)
  const zones  = divisionZones[div]
  if (!myRow || !zones) return null

  const { rank, points, played } = myRow
  const total     = table.length
  const gamesLeft = zones.totalGames - played

  const topZoneRank   = zones.promotionRanks ?? zones.playoffRanks ?? 0
  const botZoneRank   = total - zones.relegationRanks + 1
  const inTopZone     = rank <= topZoneRank
  const inBotZone     = rank >= botZoneRank

  const topBoundaryPts = topZoneRank > 0 ? (table[topZoneRank - 1]?.points ?? points) : points
  const botBoundaryPts = table[botZoneRank - 1]?.points ?? 0
  const toTopZone  = Math.max(0, topBoundaryPts - points + 1)
  const toBotZone  = Math.max(0, points - botBoundaryPts)
  const rankAbovePts = rank > 1 ? (table[rank - 2]?.points ?? points) : points
  const toClimb    = Math.max(0, rankAbovePts - points + 1)

  const topLabel   = zones.promotionRanks ? 'Uppflyttning' : 'SM-slutspel'
  const topLabelSh = zones.promotionRanks ? 'Uppflyttning' : 'Slutspel'

  const nextMatch = upcoming.find(m => m.home.id === myPlayer.teamId || m.away.id === myPlayer.teamId) ?? null
  const isHome    = nextMatch?.home.id === myPlayer.teamId
  const opp       = nextMatch ? (isHome ? nextMatch.away.name : nextMatch.home.name) : null

  const dotPct    = total > 1 ? ((rank - 1) / (total - 1)) * 100 : 50

  const accentClr = inTopZone ? '#f5c200' : inBotZone ? '#e05555' : '#38a088'
  const cardBorder = inTopZone
    ? (isDark ? 'rgba(245,194,0,0.3)' : 'rgba(245,194,0,0.35)')
    : inBotZone
      ? (isDark ? 'rgba(224,85,85,0.28)' : 'rgba(224,85,85,0.32)')
      : (isDark ? 'rgba(56,160,136,0.28)' : 'rgba(56,160,136,0.32)')
  const cardBg = inTopZone
    ? (isDark ? 'linear-gradient(145deg,rgba(245,194,0,0.07) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(245,194,0,0.04) 0%,rgba(248,248,252,1) 100%)')
    : inBotZone
      ? (isDark ? 'linear-gradient(145deg,rgba(224,85,85,0.08) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(224,85,85,0.04) 0%,rgba(248,248,252,1) 100%)')
      : (isDark ? 'linear-gradient(145deg,rgba(56,160,136,0.08) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(56,160,136,0.05) 0%,rgba(248,248,252,1) 100%)')

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${cardBorder}`, background: cardBg }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${accentClr},${accentClr}20)` }} />
        <div style={{ padding: '14px 16px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: accentClr, letterSpacing: 1.4, flex: 1 }}>
              VAD BEHÖVER MITT LAG
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>
              {shortDiv(div)}
            </span>
          </div>

          {/* Team + rank */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
                {myPlayer.team}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                {played} matcher spelade · {gamesLeft} kvar
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 0.5 }}>PLATS</div>
              <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1,
                color: accentClr, fontVariantNumeric: 'tabular-nums' }}>{rank}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                {points}p
              </div>
            </div>
          </div>

          {/* Zone position bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ position: 'relative', height: 10, borderRadius: 5, overflow: 'visible',
              background: `linear-gradient(90deg, #f5c200 0%, #f5c200 ${(topZoneRank / total) * 100}%, #38a088 ${(topZoneRank / total) * 100}%, #38a088 ${((botZoneRank - 1) / total) * 100}%, #e05555 ${((botZoneRank - 1) / total) * 100}%, #e05555 100%)`,
              opacity: 0.35 } as any}>
            </div>
            <div style={{ position: 'relative', marginTop: -10, height: 10 }}>
              <div style={{ position: 'absolute', left: `calc(${dotPct}% - 7px)`, top: -3,
                width: 14, height: 14, borderRadius: '50%', background: accentClr,
                border: `2px solid ${isDark ? '#10161e' : '#f5f2ec'}`,
                boxShadow: `0 0 8px ${accentClr}60` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#f5c200', letterSpacing: 0.5 }}>
                {topLabelSh}
              </span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#e05555', letterSpacing: 0.5 }}>
                Nedflyttning
              </span>
            </div>
          </div>

          {/* Gap rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7,
            paddingTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
            {!inTopZone && toTopZone > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10 }}>↑</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f5c200' }}>
                  {toTopZone}p till {topLabel.toLowerCase()}
                </div>
                <div style={{ flex: 1, height: 3, borderRadius: 2,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: '#f5c200',
                    width: `${Math.max(5, 100 - (toTopZone / Math.max(gamesLeft * 2, 1)) * 100)}%` }} />
                </div>
              </div>
            )}
            {inTopZone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10 }}>✓</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f5c200' }}>
                  I {topLabel.toLowerCase()}-zonen · {toClimb > 0 ? `${toClimb}p till plats ${rank - 1}` : 'Ledande laget'}
                </div>
              </div>
            )}
            {!inBotZone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10 }}>↓</div>
                <div style={{ fontSize: 11, color: toBotZone <= 3 ? '#e05555' : C.textMuted, fontWeight: 600 }}>
                  {toBotZone}p {toBotZone <= 3 ? 'till nedflyttning' : 'över nedflyttning'}
                </div>
                <div style={{ flex: 1, height: 3, borderRadius: 2,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2,
                    background: toBotZone <= 3 ? '#e05555' : C.textMuted,
                    width: `${Math.min(100, (toBotZone / Math.max(gamesLeft * 2, 1)) * 100)}%` }} />
                </div>
              </div>
            )}
            {inBotZone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10 }}>!</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#e05555' }}>
                  I nedflyttnings-zonen · {toClimb}p till plats {rank - 1}
                </div>
              </div>
            )}
            <div style={{ fontSize: 10, color: C.textMuted }}>
              {gamesLeft} matcher kvar · max ~{gamesLeft * 2}p möjliga
            </div>
          </div>

          {/* Next match scenario */}
          {opp && gamesLeft > 0 && (
            <div style={{ marginTop: 12,
              paddingTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>
              <span style={{ color: accentClr, fontWeight: 700 }}>Nästa match</span>
              {' '}mot {shortName(opp)} — vinst ger 2p
              {!inTopZone && toTopZone <= 2 && (
                <span style={{ color: '#f5c200', fontWeight: 700 }}> · räcker till {topLabel.toLowerCase()}!</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
