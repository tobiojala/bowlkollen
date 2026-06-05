'use client'

import { useState } from 'react'
import { Flame, Target, Trophy, Star, TrendingUp, TrendingDown, Minus, Check } from 'lucide-react'
import { CHALLENGES, LAST_SEASON, COLORS } from '@/app/mockup/data'
import { smooth } from '@/app/mockup/helpers'
import { Card, CardLabel, CARD_W } from './Sheet'
import { MiniCurve } from './Curves'

const { GOLD, BLUE, GREEN, MUTED, BORDER } = COLORS

const ICON_MAP = { Flame, Target, Trophy, Star } as const
export function CIcon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const I = ICON_MAP[name as keyof typeof ICON_MAP]
  return I ? <I size={size} color={color ?? 'currentColor'} /> : null
}

export function CurveCard({ matchAvgs, seasonAvg, formDiff, onExpand }: {
  matchAvgs: number[]; seasonAvg: number; formDiff: number; onExpand: () => void
}) {
  return (
    <Card accent={GOLD} onExpand={onExpand}>
      <CardLabel text="SÄSONGSKURVA" />
      <MiniCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} />
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{seasonAvg}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          {formDiff > 0
            ? <TrendingUp size={12} color={GREEN} />
            : formDiff < 0
            ? <TrendingDown size={12} color="#e05555" />
            : <Minus size={12} color={MUTED} />}
          <span style={{ fontSize: 10, color: formDiff > 0 ? GREEN : formDiff < 0 ? '#e05555' : MUTED, fontWeight: 700 }}>
            {formDiff > 0 ? `+${formDiff}` : formDiff} form
          </span>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>Tryck för metric-jämförelse</div>
      </div>
    </Card>
  )
}

export function WhatIfCard({ seasonAvg, totalSum, totalGames, onExpand }: {
  seasonAvg: number; totalSum: number; totalGames: number; onExpand: () => void
}) {
  const [val, setVal] = useState(210)
  const proj = Math.round((totalSum + val * 4) / (totalGames + 4))
  const diff = proj - seasonAvg
  return (
    <Card accent={GREEN} onExpand={onExpand}>
      <CardLabel text="VAD HÄNDER OM..." isNew />
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', lineHeight: 1.4 }}>Nästa match snitt:</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{val}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>nästa</div>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.12)' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: diff > 0 ? GREEN : diff < 0 ? '#e05555' : 'rgba(255,255,255,0.4)' }}>{proj}</div>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: diff > 0 ? GREEN : diff < 0 ? '#e05555' : 'rgba(255,255,255,0.3)' }}>
            {diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : '→'}
          </div>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()}>
        <input type="range" min="140" max="280" step="5" value={val}
          onChange={e => setVal(Number(e.target.value))}
          style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>
          <span>140</span><span style={{ color: GOLD }}>{seasonAvg}</span><span>280</span>
        </div>
      </div>
    </Card>
  )
}

export function ChallengesCard({ onExpand }: { onExpand: () => void }) {
  return (
    <Card accent={GREEN} onExpand={onExpand}>
      <CardLabel text="UTMANINGAR" isNew />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {CHALLENGES.map((c, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: c.done ? 0 : 4 }}>
              <div style={{ flexShrink: 0, color: c.done ? GREEN : 'rgba(255,255,255,0.5)' }}>
                <CIcon name={c.icon} size={14} color={c.done ? GREEN : 'rgba(255,255,255,0.5)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.done ? GREEN : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
              </div>
              {c.done && <Check size={12} color={GREEN} />}
            </div>
            {!c.done && (
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div className={c.progress >= 85 ? 'challenge-urgent' : undefined}
                  style={{ height: '100%', width: `${c.progress}%`,
                    background: c.progress >= 85
                      ? 'linear-gradient(90deg, rgba(245,194,0,0.7), #f5c200)'
                      : 'linear-gradient(90deg, rgba(245,194,0,0.4), #f5c200)',
                    borderRadius: 3 }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export function DuellCard({ matchAvgs, onExpand }: { matchAvgs: number[]; onExpand: () => void }) {
  const W = CARD_W - 28, H = 68, PAD = { l: 2, r: 2, t: 4, b: 4 }
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
  const all = [...matchAvgs, ...LAST_SEASON]
  const mnV = Math.floor(Math.min(...all) / 10) * 10 - 5, mxV = Math.ceil(Math.max(...all) / 10) * 10 + 5
  const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW
  const cy = (v: number) => PAD.t + iH - ((v - mnV) / (mxV - mnV)) * iH
  const thisPts = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const lastPts = LAST_SEASON.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const thisAvg = Math.round(matchAvgs.reduce((a, b) => a + b) / matchAvgs.length)
  const lastAvg = Math.round(LAST_SEASON.reduce((a, b) => a + b) / LAST_SEASON.length)
  return (
    <Card accent={BLUE} onExpand={onExpand}>
      <CardLabel text="SÄSONGSDUELL" isNew />
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>I år vs förra säsongen</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <path d={smooth(lastPts)} fill="none" stroke="rgba(160,175,200,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,2" />
        <path d={smooth(thisPts)} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
        <circle cx={thisPts[thisPts.length-1].x} cy={thisPts[thisPts.length-1].y} r={3.5} fill={GOLD} />
        <circle cx={lastPts[lastPts.length-1].x} cy={lastPts[lastPts.length-1].y} r={2.5} fill="rgba(160,175,200,0.4)" />
      </svg>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '6px 4px', background: 'rgba(245,194,0,0.07)', border: '1px solid rgba(245,194,0,0.15)', borderRadius: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{thisAvg}</div>
          <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>I ÅR</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: GREEN }}>↑{thisAvg - lastAvg}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '6px 4px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'rgba(160,175,200,0.55)', lineHeight: 1 }}>{lastAvg}</div>
          <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>FÖRRA</div>
        </div>
      </div>
    </Card>
  )
}
