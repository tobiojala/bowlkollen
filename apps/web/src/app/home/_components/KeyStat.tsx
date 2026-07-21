'use client'

import { motion } from 'framer-motion'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { CountUp } from '@/components/CountUp'
import { FormCurve } from '@/components/FormCurve'
import type {
  TeamEvent,
  MatchResultPayload,
  MatchPreviewPayload,
  PersonalBestPayload,
  StreakPayload,
  FormRisingPayload,
} from '@/lib/types'

export function KeyStat({ event, accent }: { event: TeamEvent; accent: string }) {
  const numStyle: React.CSSProperties = {
    fontFamily: FONT.display,
    fontSize: 42, fontWeight: 900, lineHeight: 1,
    letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
    color: accent,
  }
  const unitStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: TYPE.caption, fontWeight: 600,
    color: COLOR.ink2, letterSpacing: '0.01em',
    display: 'block', marginTop: SPACE[2],
  }
  const wrap: React.CSSProperties = {
    margin: `${SPACE[4]}px 0 ${SPACE[4]}px`,
  }

  if (event.event_type === 'match_result') {
    const p          = event.payload as MatchResultPayload
    const myTeamName = event.team?.name

    const seriesMin = p.my_series ? Math.min(...p.my_series) - 40 : 0
    const seriesMax = p.my_series ? Math.max(...p.my_series) + 20 : 1
    const barH = (v: number) => Math.max(6, ((v - seriesMin) / (seriesMax - seriesMin)) * 52)

    // Rank bars by score: 0 = gold, 1 = dimmed gold, rest = white
    const rankMap = p.my_series
      ? new Map(
          [...p.my_series]
            .map((s, i) => ({ s, i }))
            .sort((a, b) => b.s - a.s)
            .map((r, rank) => [r.i, rank])
        )
      : new Map<number, number>()
    const barColor = (i: number) => {
      const rank = rankMap.get(i) ?? 99
      if (rank === 0) return COLOR.gold
      if (rank === 1) return '#f9e07a'
      return COLOR.ink
    }

    return (
      <div style={wrap}>
        {/* Animated score */}
        <div style={numStyle}>
          <CountUp to={p.my_score} delay={0.1} duration={0.9} />
          <span style={{ color: COLOR.ink3, fontWeight: 300, margin: '0 10px' }}>–</span>
          <span style={{ color: COLOR.ink }}>
            <CountUp to={p.opp_score} delay={0.2} duration={0.9} />
          </span>
        </div>
        <span style={unitStyle}>
          {myTeamName ? `${myTeamName} · ${p.opponent_name}` : `mot ${p.opponent_name}`}
        </span>

        {/* Series bars */}
        {p.my_series && p.my_series.length > 0 && (
          <div style={{ marginTop: SPACE[6] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[3] }}>
              <span style={{ fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.08em', color: COLOR.ink3 }}>
                SERIER
              </span>
              <span style={{ fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.06em', color: accent }}>
                BÄSTA {Math.max(...p.my_series)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              {p.my_series.map((s, i) => {
                const bh    = barH(s)
                const bCol  = barColor(i)
                const delay = 0.15 + i * 0.08
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2] }}>
                    <motion.div
                      style={{ width: 52, height: bh, borderRadius: '4px 4px 0 0', background: bCol, transformOrigin: 'bottom' }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ type: 'spring', stiffness: 90, damping: 12, delay }}
                    />
                    <motion.span
                      style={{ fontSize: TYPE.caption, fontWeight: 700, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: bCol }}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.25, delay: delay + 0.25 }}
                    >
                      {s}
                    </motion.span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {p.top_scorer && (
          <span style={{ fontSize: TYPE.label, color: COLOR.ink2, marginTop: SPACE[4], display: 'block' }}>
            Bäste:{' '}
            <span style={{ color: COLOR.ink }}>{p.top_scorer.name}</span>
            {' · '}
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 15, color: COLOR.ink }}>
              {p.top_scorer.high_game}
            </span>
          </span>
        )}
      </div>
    )
  }

  if (event.event_type === 'match_preview') {
    const p = event.payload as MatchPreviewPayload
    return (
      <div style={{ margin: `${SPACE[4]}px 0 ${SPACE[4]}px` }}>
        <div style={{ marginBottom: SPACE[6] }}>
          <span style={{
            display: 'inline-block',
            fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.06em',
            color: p.is_home ? COLOR.gold : COLOR.ink2,
            background: p.is_home ? 'rgba(245,194,0,0.10)' : 'rgba(244,245,247,0.06)',
            borderRadius: 20, padding: '5px 14px',
          }}>
            {p.venue ?? (p.is_home ? 'HEMMA' : 'BORTA')}
          </span>
        </div>
        {p.opponent_form.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 12 }}>
              {p.opponent_form.slice(-5).map((r, i) => (
                <span key={i} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  background: r === 'W' ? 'rgba(48,212,126,0.14)' : r === 'L' ? 'rgba(224,85,85,0.14)' : 'rgba(244,245,247,0.07)',
                  color: r === 'W' ? COLOR.green : r === 'L' ? COLOR.red : COLOR.ink3,
                }}>
                  {r}
                </span>
              ))}
            </div>
            <div style={{ fontSize: TYPE.label, fontWeight: 600, letterSpacing: '0.06em', color: COLOR.ink3, marginTop: SPACE[3] }}>
              MOTSTÅNDARENS FORM
            </div>
          </>
        )}
      </div>
    )
  }

  if (event.event_type === 'personal_best') {
    const p     = event.payload as PersonalBestPayload
    const delta = p.new_best - p.previous_best
    // Amplify the floor so the height difference reads clearly
    const floor = Math.max(0, p.previous_best - delta * 2)
    const ceil  = p.new_best + delta * 0.5
    const bH    = (v: number) => Math.max(6, ((v - floor) / (ceil - floor)) * 64)
    return (
      <div style={wrap}>
        <div style={numStyle}>
          <CountUp to={p.new_best} delay={0.1} duration={0.9} />
        </div>
        <span style={unitStyle}>pins · personbästa</span>

        <div style={{ marginTop: SPACE[6] }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            {/* Previous best */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2] }}>
              <motion.div
                style={{ width: 52, height: bH(p.previous_best), borderRadius: '4px 4px 0 0', background: COLOR.ink, transformOrigin: 'bottom' }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 90, damping: 12, delay: 0.1 }}
              />
              <motion.span
                style={{ fontSize: TYPE.caption, fontWeight: 700, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: COLOR.ink }}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.25, delay: 0.38 }}
              >
                {p.previous_best}
              </motion.span>
            </div>
            {/* New best */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2] }}>
              <motion.div
                style={{ width: 52, height: bH(p.new_best), borderRadius: '4px 4px 0 0', background: COLOR.gold, transformOrigin: 'bottom' }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 90, damping: 12, delay: 0.22 }}
              />
              <motion.span
                style={{ fontSize: TYPE.caption, fontWeight: 700, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: COLOR.gold }}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.25, delay: 0.5 }}
              >
                {p.new_best}
              </motion.span>
            </div>
          </div>

          {/* Delta label */}
          <div style={{ marginTop: SPACE[3], fontSize: TYPE.label, fontWeight: 700, color: COLOR.green, letterSpacing: '0.04em' }}>
            +{delta} PINS
          </div>
        </div>
      </div>
    )
  }

  if (event.event_type === 'win_streak') {
    const p       = event.payload as StreakPayload
    const visible = Math.min(p.streak_length, 8)
    const overflow = p.streak_length - visible
    return (
      <div style={wrap}>
        <div style={numStyle}>
          <CountUp to={p.streak_length} delay={0.1} duration={0.7} />
        </div>
        <span style={unitStyle}>raka segrar</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[6], flexWrap: 'wrap' }}>
          {Array.from({ length: visible }).map((_, i) => (
            <motion.div
              key={i}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(245,194,0,0.12)',
                border: '1px solid rgba(245,194,0,0.30)',
                fontSize: 11, fontWeight: 800, color: COLOR.gold,
                letterSpacing: '0.02em',
              }}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 + i * 0.07 }}
            >
              V
            </motion.div>
          ))}
          {overflow > 0 && (
            <motion.span
              style={{ fontSize: TYPE.caption, fontWeight: 700, color: COLOR.gold }}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.15 + visible * 0.07 + 0.1 }}
            >
              +{overflow}
            </motion.span>
          )}
        </div>
      </div>
    )
  }

  if (event.event_type === 'form_rising') {
    const p = event.payload as FormRisingPayload
    return (
      <div style={wrap}>
        <div style={{ ...numStyle, color: COLOR.ink }}>+{p.delta.toFixed(1)}</div>
        <span style={unitStyle}>över säsongssnitt</span>
        {p.match_avgs && p.match_avgs.length >= 2 && (
          <FormCurve
            matchAvgs={p.match_avgs}
            seasonAvg={p.season_avg}
            recentAvg={p.recent_avg}
            gid={p.player_id}
          />
        )}
      </div>
    )
  }

  return null
}
