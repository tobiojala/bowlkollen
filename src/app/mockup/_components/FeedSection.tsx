'use client'

import { useState } from 'react'
import { Zap, Swords, Heart } from 'lucide-react'
import { FlameIcon } from '@phosphor-icons/react'
import MatchSparkline from '@/components/mockup/MatchSparkline'
import { CIcon } from '@/components/mockup/StatCards'
import { MATCHES, CHALLENGES, MOCK_REACTIONS, MATCH_HOME_AWAY, COLORS } from '../data'

const { GOLD, GREEN, MUTED } = COLORS

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
    setMyReactions(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

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
      {/* Challenge breakout */}
      {urgent && (
        <div className="glass-row" style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
          onClick={onOpenChallenges}>
          <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(245,194,0,0.12) 0%, rgba(245,194,0,0.04) 45%, transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(245,194,0,0.10)', border: '1.5px solid rgba(245,194,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CIcon name={urgent.icon} size={18} color={GOLD} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>{urgent.title}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', margin: '7px 0 5px' }}>
                <div className="challenge-urgent"
                  style={{ height: '100%', width: `${urgent.progress}%`,
                    background: 'linear-gradient(90deg, rgba(245,194,0,0.55), #f5c200)', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>{urgent.desc} · {urgent.cur}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: MUTED, marginBottom: 3 }}>klar</div>
              <div className="num" style={{ fontSize: 22, color: GOLD }}>{urgent.progress}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Hot streak banner */}
      {streakCurrent >= 4 && (
        <div role="button" onClick={onOpenChallenges} className="glass-row" style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', margin: '8px 0 0', cursor: 'pointer' }}>
          <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(245,194,0,0.12) 0%, rgba(245,100,0,0.05) 40%, transparent 68%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px' }}>
            <div className="streak-icon" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(245,194,0,0.10)', border: '1.5px solid rgba(245,194,0,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlameIcon size={18} weight="fill" color={GOLD} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                {streakCurrent} spel i rad över snitt
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>Bowla idag — håll elden vid liv</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: MUTED, marginBottom: 3 }}>svit</div>
              <div className="num" style={{ fontSize: 22, color: GOLD }}>{streakCurrent}</div>
            </div>
          </div>
        </div>
      )}

      {/* Explore rows */}
      <div style={{ padding: '12px 16px 4px' }}>

        {/* WhatIf row */}
        <div className="glass-row" style={{ position: 'relative', marginBottom: 4, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
          onClick={onOpenWhatIf}>
          <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(93,202,165,0.1) 0%, rgba(93,202,165,0.03) 45%, transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(93,202,165,0.10)', border: '1.5px solid rgba(93,202,165,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color={GREEN} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>Vad händer om...</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>Projicera nästa matchs påverkan</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: MUTED, marginBottom: 3 }}>proj. snitt</div>
              <div className="num" style={{ fontSize: 22, color: projDiff > 0 ? GREEN : projDiff < 0 ? '#e05555' : GOLD }}>{projAvg}</div>
            </div>
          </div>
        </div>

        {/* Duell row */}
        <div className="glass-row" style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
          onClick={onOpenDuell}>
          <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(245,194,0,0.08) 0%, rgba(245,194,0,0.02) 45%, transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(245,194,0,0.08)', border: '1.5px solid rgba(245,194,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Swords size={16} color={GOLD} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>Säsongsduell</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{seasonAvg} i år · {lastSeasonAvg} förra</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: MUTED, marginBottom: 3 }}>förbättring</div>
              <div className="num" style={{ fontSize: 22, color: GREEN }}>+{seasonAvg - lastSeasonAvg}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Match log */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px 10px', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginRight: 4 }}>MATCHLOGG</span>
          {(['alla', 'bästa', 'hemma', 'borta'] as const).map(f => (
            <button key={f} onClick={() => setMatchFilter(f)}
              style={{ padding: '8px 12px', minHeight: 36, borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                background: matchFilter === f ? 'rgba(245,194,0,0.15)' : 'rgba(255,255,255,0.05)',
                color: matchFilter === f ? GOLD : 'rgba(255,255,255,0.3)',
                outline: `1px solid ${matchFilter === f ? 'rgba(245,194,0,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.map(({ m, i, total }, filteredIdx) => {
          const avg      = Math.round(total / m.games.length)
          const rxData   = MOCK_REACTIONS[i]
          const myFlame  = myReactions.has(`${i}-flame`)
          const myHeart  = myReactions.has(`${i}-heart`)
          const isWin    = m.result.startsWith('W')
          const isLoss   = m.result.startsWith('L')
          const resultColor = isWin ? GREEN : isLoss ? '#e05555' : 'rgba(255,255,255,0.2)'
          const teamHue  = m.opp.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) * 137 % 360
          const initials = m.opp.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div key={i} className="glass-row feed-in" style={{ position: 'relative', marginBottom: 4, borderRadius: 12, overflow: 'hidden', animationDelay: `${filteredIdx * 0.06}s` }}>
              <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0,
                background: `linear-gradient(90deg, ${resultColor}1c 0%, ${resultColor}08 40%, transparent 68%)`,
              }} />
              <div onClick={() => onOpenMatch(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px 4px', cursor: 'pointer', transition: 'background 0.15s ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${teamHue}, 50%, 18%)`,
                  border: `1.5px solid hsl(${teamHue}, 55%, 34%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, letterSpacing: 0.3,
                  color: `hsl(${teamHue}, 75%, 68%)`,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>{m.opp}</div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', marginTop: 5 }}>
                    {m.games.map((g, gi) => (
                      <span key={gi} style={{
                        fontSize: g >= 250 ? 14 : g >= 200 ? 13 : 12,
                        fontWeight: g >= 250 ? 900 : g >= 200 ? 800 : 500,
                        color: g >= 200 ? GOLD : MUTED,
                        background: g >= 200 ? 'rgba(245,194,0,0.09)' : 'transparent',
                        borderRadius: g >= 200 ? 6 : 0,
                        padding: g >= 200 ? '2px 5px' : '0',
                      }}>{g}</span>
                    ))}
                    <span style={{ marginLeft: 2 }}><MatchSparkline games={m.games} /></span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4, color: resultColor }}>{m.result}</div>
                  <div className="num" style={{ fontSize: 22, color: avg >= seasonAvg ? GOLD : MUTED }}>{total}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{m.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '4px 20px 10px 70px' }}>
                {[
                  { type: 'flame' as const, Icon: FlameIcon, my: myFlame, count: (rxData?.flame ?? 0) + (myFlame ? 1 : 0), color: '#f5a623' },
                  { type: 'heart' as const, Icon: Heart, my: myHeart, count: (rxData?.heart ?? 0) + (myHeart ? 1 : 0), color: '#e05555' },
                ].map(({ type, Icon, my, count, color }) => (
                  <button key={type} onClick={e => toggleReaction(i, type, e)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5,
                      padding: '10px 16px', minHeight: 44, borderRadius: 22, border: 'none', cursor: 'pointer',
                      background: my ? `${color}22` : 'rgba(255,255,255,0.05)',
                      outline: `1px solid ${my ? color + '55' : 'rgba(255,255,255,0.08)'}` }}>
                    <Icon size={14} color={my ? color : 'rgba(255,255,255,0.3)'} fill={my ? color : 'none'} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: my ? color : 'rgba(255,255,255,0.35)' }}>{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
