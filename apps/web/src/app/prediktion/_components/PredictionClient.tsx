'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useColors } from '@/components/ThemeProvider'
import { useSession, useMatchPredictions, useMyPrediction } from '@/lib/queries'
import { shortName, shortDiv } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { SEASON } from '@/lib/constants'
import Reveal from '@/components/Reveal'
import type { LeaderboardEntry, UpcomingMatch } from '../page'

// ── Mini match card — quick-vote CTA linking to match page ────────────────────

function UpcomingCard({ m, userId }: { m: UpcomingMatch; userId: string | null }) {
  const { C, isDark } = useColors()
  const { data: counts } = useMatchPredictions(m.id)
  const { data: myPick } = useMyPrediction(m.id, userId)

  const total  = counts?.total ?? 0
  const wPct   = total > 0 ? Math.round((counts!.W / total) * 100) : null
  const lPct   = total > 0 ? 100 - wPct! : null
  const hasPick = !!myPick

  const dateStr = new Date(m.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const gold   = '#f5c200'
  const green  = '#5dcaa5'

  return (
    <Link href={`/matches/${m.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${border}`, borderRadius: 16, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, padding: '2px 7px', borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
            {shortDiv(m.division)}
          </span>
          <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto' }}>{dateStr} · {timeStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: hasPick && myPick === 'W' ? gold : C.text, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(m.home.name)}
          </span>
          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 64 }}>
            {wPct !== null ? (
              <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: C.muted }}>
                <span style={{ color: myPick === 'W' ? gold : C.muted }}>{wPct}%</span>
                <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                <span style={{ color: myPick === 'L' ? gold : C.muted }}>{lPct}%</span>
              </div>
            ) : (
              <span style={{ fontSize: 12, color: C.muted, letterSpacing: 2 }}>vs</span>
            )}
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: hasPick && myPick === 'L' ? gold : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(m.away.name)}
          </span>
        </div>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          {hasPick ? (
            <span style={{ fontSize: 11, color: green, fontWeight: 600 }}>
              ✓ Du har röstat · Ändra →
            </span>
          ) : (
            <span style={{ fontSize: 11, color: gold, fontWeight: 700, letterSpacing: '0.04em' }}>
              Rösta nu →
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─�� Leaderboard row ────────────────────────────────────────────────────────────

function LeaderboardRow({ entry, rank, isMe }: { entry: LeaderboardEntry; rank: number; isMe: boolean }) {
  const { C, isDark } = useColors()
  const gold  = '#f5c200'
  const green = '#5dcaa5'

  const medal = rank === 1 ? gold : rank === 2 ? (isDark ? '#c0c8d8' : '#8090a8') : rank === 3 ? '#c87a3a' : null
  const hue   = entry.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const avatarBg  = `hsl(${hue},40%,${isDark ? 18 : 88}%)`
  const avatarFg  = `hsl(${hue},50%,45%)`
  const initials  = entry.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isMe ? (isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.04)') : 'transparent', borderRadius: 12 }}>
      {/* Rank */}
      <div style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: medal ? 16 : 13, fontWeight: 700, color: medal ?? C.muted }}>
        {medal ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
      </div>

      {/* Avatar */}
      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: avatarBg, border: `1.5px solid ${isMe ? gold : avatarFg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: avatarFg, overflow: 'hidden' }}>
        {entry.avatarUrl
          ? <img src={entry.avatarUrl} alt={entry.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials
        }
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? gold : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.name}{isMe ? ' (du)' : ''}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
          {entry.correct}/{entry.total} rätt
        </div>
      </div>

      {/* Percentage */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: entry.pct >= 70 ? green : entry.pct >= 55 ? C.text : C.muted, fontVariantNumeric: 'tabular-nums' }}>
          {entry.pct}%
        </div>
      </div>
    </div>
  )
}

// ── Main page component ───────���─────────────────────────────���──────────────────

export default function PredictionClient() {
  const { C, isDark } = useColors()
  const { data: session } = useSession()
  const userId = session?.user?.id ?? null

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['prediktion', 'leaderboard'],
  })
  const { data: upcoming = [] } = useQuery<UpcomingMatch[]>({
    queryKey: ['prediktion', 'upcoming'],
  })

  // My own season stats — computed client-side from all my predictions
  const { data: myStats } = useQuery({
    queryKey: ['prediktion', 'my-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null
      const supabase = createClient()

      const { data: myPreds } = await supabase
        .from('match_predictions')
        .select('match_id,prediction')
        .eq('user_id', userId)
      if (!myPreds?.length) return null

      const matchIds = myPreds.map(p => p.match_id)
      const { data: matches } = await supabase
        .from('matches')
        .select('id,home_score,away_score')
        .in('id', matchIds)
        .eq('status', 'completed')
        .gte('date', SEASON.CURRENT)
        .not('home_score', 'is', null)

      if (!matches?.length) return null

      let correct = 0, total = 0
      for (const pred of myPreds) {
        const match = matches.find(m => m.id === pred.match_id)
        if (!match) continue
        const hs = match.home_score!, as = match.away_score!
        const right = hs > as ? 'W' : as > hs ? 'L' : null
        if (!right) continue
        total++
        if (pred.prediction === right) correct++
      }
      if (!total) return null

      const myRank = leaderboard.findIndex(e => e.userId === userId) + 1
      return { correct, total, pct: Math.round((correct / total) * 100), rank: myRank || null }
    },
  })

  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const gold   = '#f5c200'
  const green  = '#5dcaa5'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>

        {/* Page header */}
        <div style={{ padding: '24px 20px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.muted }}>
            PREDIKTION · SÄSONG 25/26
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginTop: 4, color: C.text }}>
            Vem är bäst på att gissa?
          </div>
        </div>

        {/* Personal stats strip */}
        {myStats && (
          <Reveal direction="up" distance={10}>
            <div style={{ margin: '8px 16px 0', padding: '12px 16px', borderRadius: 14, background: isDark ? 'rgba(245,194,0,0.07)' : 'rgba(245,194,0,0.05)', border: '1px solid rgba(245,194,0,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: gold }}>Dina säsongsresultat</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {myStats.correct}/{myStats.total} rätt · {myStats.pct}%
                  {myStats.rank ? ` · Rang #${myStats.rank}` : ''}
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: myStats.pct >= 60 ? green : C.text, fontVariantNumeric: 'tabular-nums' }}>
                {myStats.pct}%
              </div>
            </div>
          </Reveal>
        )}

        {/* Upcoming matches to predict */}
        {upcoming.length > 0 && (
          <div style={{ padding: '28px 16px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.muted, marginBottom: 12 }}>
              KOMMANDE ATT RÖSTA PÅ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.map((m, i) => (
                <Reveal key={m.id} direction="up" distance={10} delay={i * 0.04}>
                  <UpcomingCard m={m} userId={userId} />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ padding: '32px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.muted }}>
              TOPPLISTA
            </div>
            {leaderboard.length > 0 && (
              <div style={{ fontSize: 10, color: C.muted }}>minimum 2 gissningar</div>
            )}
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.muted }}>Inga gissningar ännu denna säsong</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, opacity: 0.6 }}>Var den första — gissa en match ovan</div>
            </div>
          ) : (
            <Reveal direction="up" distance={10} delay={0.1}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', padding: '6px 0' }}>
                {leaderboard.map((entry, i) => (
                  <div key={entry.userId} style={{ borderBottom: i < leaderboard.length - 1 ? `1px solid ${border}` : 'none' }}>
                    <LeaderboardRow entry={entry} rank={i + 1} isMe={entry.userId === userId} />
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {!userId && (
            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8f6f2', border: `1px solid ${border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Logga in för att gissa och hamna på topplistan</div>
              <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color: gold, textDecoration: 'none' }}>
                Logga in →
              </Link>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
