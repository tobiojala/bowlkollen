'use client'

import { useState } from 'react'
import { Zap, Swords, Flame } from 'lucide-react'
import { CIcon } from '@/components/mockup/StatCards'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import { SerieBars } from '@/components/SerieBars'
import { serieBarLevel } from '@bowlkollen/core'
import { Pill, SectionHeader } from '@/components/ui/primitives'
import { COLORS } from '../data'
import type { ProfileData, ProfileChallenge, ProfileReactions } from '@/lib/profile'

const { GOLD, GREEN, RED } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'

interface FeedSectionProps {
  data: ProfileData
  challenges: readonly ProfileChallenge[]
  reactions: ProfileReactions
  /** Feed-specific "next match at 210" projection. */
  projAvg: number
  projDiff: number
  onOpenChallenges: () => void
  onOpenWhatIf: () => void
  onOpenDuell: () => void
  onOpenMatch: (i: number) => void
}

export default function FeedSection({
  data, challenges, projAvg, projDiff,
  onOpenChallenges, onOpenWhatIf, onOpenDuell, onOpenMatch,
}: FeedSectionProps) {
  const { seasonAvg, lastSeasonAvg } = data
  const streakCurrent = data.streakAvg.current
  const [matchFilter, setMatchFilter] = useState<'alla' | 'bästa' | 'hemma' | 'borta'>('alla')
  const [showAllMatches, setShowAllMatches] = useState(false)

  const urgent = challenges
    .filter(c => !c.done && c.progress >= 80)
    .sort((a, b) => b.progress - a.progress)[0]

  const filtered = data.matches
    .map((m, i) => ({ m, i, total: m.games.reduce((a: number, b: number) => a + b, 0) }))
    .filter(({ m }) => {
      if (matchFilter === 'hemma') return m.home === true
      if (matchFilter === 'borta') return m.home === false
      return true
    })
    .sort(matchFilter === 'bästa' ? (a, b) => b.total - a.total : (a, b) => b.i - a.i)
    .slice(0, matchFilter === 'bästa' ? 5 : undefined)

  return (
    <>
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Challenge breakout — the one gold block in the feed */}
        {urgent && (
          <div className="glass-row" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}
            onClick={onOpenChallenges}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(245,194,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CIcon name={urgent.icon} size={18} color={GOLD} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{urgent.title}</div>
                <div style={{ height: 4, background: 'rgba(244,245,247,0.08)', borderRadius: 3, overflow: 'hidden', margin: '7px 0 6px' }}>
                  <div className="challenge-urgent"
                    style={{ height: '100%', width: `${urgent.progress}%`, background: GOLD, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: INK3 }}>{urgent.desc} · {urgent.cur}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: INK3, marginBottom: 3 }}>klar</div>
                <div className="num" style={{ fontSize: 22, color: GOLD }}>{urgent.progress}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Hot streak */}
        {streakCurrent >= 4 && (
          <div role="button" onClick={onOpenChallenges} className="glass-row" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(93,202,165,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={18} color={GREEN} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{streakCurrent} spel i rad över snitt</div>
                <div style={{ fontSize: 12, color: INK3, marginTop: 3 }}>Bowla idag — håll sviten vid liv</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: INK3, marginBottom: 3 }}>svit</div>
                <div className="num" style={{ fontSize: 22, color: GREEN }}>{streakCurrent}</div>
              </div>
            </div>
          </div>
        )}

        {/* What if */}
        <div className="glass-row" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}
          onClick={onOpenWhatIf}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(93,202,165,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color={GREEN} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>Vad händer om...</div>
              <div style={{ fontSize: 12, color: INK3, marginTop: 3 }}>Projicera nästa matchs påverkan</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: INK3, marginBottom: 3 }}>proj. snitt</div>
              <div className="num" style={{ fontSize: 22, color: projDiff > 0 ? GREEN : projDiff < 0 ? RED : INK2 }}>{projAvg}</div>
            </div>
          </div>
        </div>

        {/* Duell */}
        <div className="glass-row" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}
          onClick={onOpenDuell}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(244,245,247,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Swords size={16} color={INK2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>Säsongsduell</div>
              <div style={{ fontSize: 12, color: INK3, marginTop: 3 }}>{seasonAvg} i år · {lastSeasonAvg} förra</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: INK3, marginBottom: 3 }}>förbättring</div>
              <div className="num" style={{ fontSize: 22, color: GREEN }}>+{seasonAvg - lastSeasonAvg}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Match log */}
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHeader label="Matchlogg" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          {(['alla', 'bästa', 'hemma', 'borta'] as const).map(f => (
            <Pill key={f} label={f.charAt(0).toUpperCase() + f.slice(1)}
              active={matchFilter === f} onClick={() => setMatchFilter(f)} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {(showAllMatches ? filtered : filtered.slice(0, 5)).map(({ m, i, total }, filteredIdx) => {
            const avg  = Math.round(total / m.games.length)
            const high = Math.max(...m.games)
            const highGold = serieBarLevel(high) === 'gold'
            return (
              <div key={i} onClick={() => onOpenMatch(i)} className="feed-in"
                style={{ background: '#14171c', borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 12, animationDelay: `${filteredIdx * 0.05}s` }}>
                {/* Opponent + home/away · date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <IdentityAvatar name={m.opp} size={38} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.opp}</div>
                  <div style={{ fontSize: 13, color: INK3, flexShrink: 0, textAlign: 'right' }}>{m.home ? 'hemma' : 'borta'} · {m.date}</div>
                </div>
                {/* Series — the shared bar language (gold only on a >=250 game) */}
                <SerieBars series={m.games} />
                {/* Total + snitt/högsta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(244,245,247,0.07)', paddingTop: 11 }}>
                  <span className="num" style={{ fontSize: 23, fontWeight: 800, color: INK }}>{total}</span>
                  <span style={{ fontSize: 13, color: INK3 }}>⌀ {avg} snitt · högsta <b style={{ color: highGold ? GOLD : INK, fontWeight: 700 }}>{high}</b></span>
                </div>
              </div>
            )
          })}
          {filtered.length > 5 && !showAllMatches && (
            <button onClick={() => setShowAllMatches(true)}
              style={{ width: '100%', marginTop: 2, background: '#14171c', border: 'none', borderRadius: 12,
                color: INK2, fontSize: 14, fontWeight: 700, padding: 13, cursor: 'pointer' }}>
              Visa fler ({filtered.length - 5})
            </button>
          )}
        </div>
      </div>
    </>
  )
}
