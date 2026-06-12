'use client'

import { useState } from 'react'
import { Zap, Swords, Heart, Flame } from 'lucide-react'
import MatchSparkline from '@/components/mockup/MatchSparkline'
import { CIcon } from '@/components/mockup/StatCards'
import { Pill, SectionHeader } from '@/components/ui/primitives'
import { MATCHES, CHALLENGES, MOCK_REACTIONS, MATCH_HOME_AWAY, COLORS } from '../data'

const { GOLD, GREEN, BLUE, RED } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface FeedSectionProps {
  seasonAvg: number
  projAvg: number
  projDiff: number
  lastSeasonAvg: number
  streakCurrent: number
  onOpenChallenges: () => void
  onOpenWhatIf: () => void
  onOpenDuell: () => void
  onOpenMatch: (i: number) => void
}

export default function FeedSection({
  seasonAvg, projAvg, projDiff, lastSeasonAvg, streakCurrent,
  onOpenChallenges, onOpenWhatIf, onOpenDuell, onOpenMatch,
}: FeedSectionProps) {
  const [matchFilter, setMatchFilter] = useState<'alla' | 'bästa' | 'hemma' | 'borta'>('alla')
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set())

  const toggleReaction = (matchIdx: number, type: 'flame' | 'heart', e: React.MouseEvent) => {
    e.stopPropagation()
    const key = `${matchIdx}-${type}`
    setMyReactions(prev => {
      const s = new Set(prev)
      if (s.has(key)) s.delete(key); else s.add(key)
      return s
    })
  }

  // Score tone: 250+ is the gold moment, 200+ is solid, rest is quiet
  const scoreColor  = (g: number) => g >= 250 ? GOLD : g >= 200 ? INK : INK3
  const scoreWeight = (g: number) => g >= 250 ? 900 : g >= 200 ? 700 : 400

  const urgent = CHALLENGES
    .filter(c => !c.done && c.progress >= 80)
    .sort((a, b) => b.progress - a.progress)[0]

  const filtered = MATCHES
    .map((m, i) => ({ m, i, total: m.games.reduce((a: number, b: number) => a + b, 0) }))
    .filter(({ i }) => {
      if (matchFilter === 'hemma') return MATCH_HOME_AWAY[i] === true
      if (matchFilter === 'borta') return MATCH_HOME_AWAY[i] === false
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
              background: 'rgba(122,180,232,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Swords size={16} color={BLUE} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {filtered.map(({ m, i, total }, filteredIdx) => {
            const avg      = Math.round(total / m.games.length)
            const rxData   = MOCK_REACTIONS[i]
            const myFlame  = myReactions.has(`${i}-flame`)
            const myHeart  = myReactions.has(`${i}-heart`)
            const isWin    = m.result.startsWith('W')
            const isLoss   = m.result.startsWith('L')
            const resultColor = isWin ? GREEN : isLoss ? RED : INK3
            const teamHue  = m.opp.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) * 137 % 360
            const initials = m.opp.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={i} className="glass-row feed-in" style={{ borderRadius: 16, overflow: 'hidden', animationDelay: `${filteredIdx * 0.05}s` }}>
                <div onClick={() => onOpenMatch(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `14px 16px ${rxData ? 4 : 14}px`, cursor: 'pointer' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `hsl(${teamHue}, 22%, 16%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
                    color: `hsl(${teamHue}, 38%, 66%)`,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{m.opp}</div>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>
                      {m.games.map((g, gi) => (
                        <span key={gi} style={{ fontSize: 13, fontWeight: scoreWeight(g), color: scoreColor(g) }}>{g}</span>
                      ))}
                      <span style={{ marginLeft: 2 }}><MatchSparkline games={m.games} /></span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, color: resultColor }}>{m.result}</div>
                    <div className="num" style={{ fontSize: 20, color: avg >= seasonAvg ? INK : INK3 }}>{total}</div>
                    <div style={{ fontSize: 11, color: INK4, marginTop: 3 }}>{m.date}</div>
                  </div>
                </div>
                {rxData && (
                  <div style={{ display: 'flex', gap: 8, padding: '4px 16px 12px 68px' }}>
                    {[
                      { type: 'flame' as const, Icon: Flame, my: myFlame, count: (rxData?.flame ?? 0) + (myFlame ? 1 : 0), color: '#f5a623' },
                      { type: 'heart' as const, Icon: Heart, my: myHeart, count: (rxData?.heart ?? 0) + (myHeart ? 1 : 0), color: RED },
                    ].map(({ type, Icon, my, count, color }) => (
                      <button key={type} onClick={e => toggleReaction(i, type, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6,
                          padding: '0 16px', minHeight: 40, borderRadius: 999, border: 'none', cursor: 'pointer',
                          background: my ? `${color}1f` : 'rgba(244,245,247,0.05)' }}>
                        <Icon size={14} color={my ? color : INK3} fill={my ? color : 'none'} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: my ? color : INK3, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
