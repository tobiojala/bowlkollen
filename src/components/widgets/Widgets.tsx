'use client'

import React from 'react'
import { ChevronRight, Trophy, Calendar, Heart, BarChart2, Bell, FileText, User, Check, HelpCircle, X } from 'lucide-react'

function shortName(n: string) {
  return n?.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim() || ''
}
function teamInitials(n: string) {
  return shortName(n).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}
function teamColor(n: string, isDark: boolean) {
  const hue = (n || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return { bg: isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`, border: `hsl(${hue},50%,45%)`, text: `hsl(${hue},50%,45%)` }
}
function calcRating(avg: number, best: number, over200: number) {
  if (!avg) return 0
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}
function getTierColor(r: number) {
  if (r >= 95) return '#f5c200'
  if (r >= 85) return '#afa9ec'
  if (r >= 75) return '#5dcaa5'
  if (r >= 60) return '#ef9f27'
  return '#8899aa'
}
function getTierLabel(r: number) {
  if (r >= 95) return 'LEGEND'
  if (r >= 85) return 'ELITE'
  if (r >= 75) return 'PRO'
  if (r >= 60) return 'VETERAN'
  return 'ROOKIE'
}

type WProps = { isDark: boolean; C: any; data: any }

function base(isDark: boolean, bg?: string, borderColor?: string) {
  return {
    borderRadius: 20,
    background: bg || (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'),
    border: `1px solid ${borderColor || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)')}`,
    overflow: 'hidden' as const,
    height: '100%',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    padding: '14px',
  }
}

export function NextMatchWidget({ isDark, C, data }: WProps) {
  const m = data.myNextMatch
  if (!m) return (
    <div style={base(isDark)}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#f5c200', letterSpacing: 1.5, marginBottom: 8 }}>NÄSTA MATCH</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.textMuted }}>Inga kommande matcher</div>
    </div>
  )
  const isHome = m.home_team_id === data.myTeam?.id
  const opp = isHome ? m.away : m.home
  const days = Math.max(0, Math.ceil((new Date(m.date).getTime() - Date.now()) / 86400000))
  const tc = teamColor(opp?.name || '', isDark)
  return (
    <a href={'/matches/' + m.id} style={{ ...base(isDark, isDark ? 'linear-gradient(135deg,#0d1a2e,#192540)' : 'linear-gradient(135deg,#e8f4ff,#ddeeff)', isDark ? 'rgba(245,194,0,0.15)' : 'rgba(245,194,0,0.2)'), textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#f5c200', letterSpacing: 1.5 }}>NÄSTA MATCH</div>
        <div style={{ fontSize: 9, color: C.textMuted }}>{isHome ? 'HEMMA' : 'BORTA'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, border: `2px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: tc.text, flexShrink: 0 }}>
          {teamInitials(opp?.name || '')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(opp?.name || '')}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{new Date(m.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
        </div>
        <div style={{ textAlign: 'center', background: days <= 3 ? 'rgba(245,194,0,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${days <= 3 ? 'rgba(245,194,0,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '6px 10px', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: days <= 3 ? '#f5c200' : C.text, lineHeight: 1 }}>{days}</div>
          <div style={{ fontSize: 7, color: C.textMuted, marginTop: 1 }}>DAGAR</div>
        </div>
      </div>
      <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: Math.max(5, Math.min(95, (1 - days/30)*100)) + '%', height: '100%', background: 'linear-gradient(90deg,#f5c200,#f5c20066)', borderRadius: 2 }} />
      </div>
    </a>
  )
}

export function LastResultWidget({ isDark, C, data }: WProps) {
  const m = data.myLastMatch
  if (!m) return (
    <div style={base(isDark)}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>SENASTE MATCH</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.textMuted }}>Inga resultat</div>
    </div>
  )
  const isHome = m.home_team_id === data.myTeam?.id
  const opp = isHome ? m.away : m.home
  const myScore = isHome ? m.home_score : m.away_score
  const oppScore = isHome ? m.away_score : m.home_score
  const won = myScore > oppScore
  const drew = myScore === oppScore
  const rc = won ? '#1d9e75' : drew ? '#f5c200' : '#e24b4a'
  const rl = won ? 'V' : drew ? 'O' : 'F'
  return (
    <a href={'/matches/' + m.id} style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>SENASTE MATCH</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: rc + '22', border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: rc, flexShrink: 0 }}>{rl}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{myScore} – {oppScore}</div>
          <div style={{ fontSize: 10, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>vs {shortName(opp?.name || '')}</div>
        </div>
      </div>
    </a>
  )
}

export function StandingsWidget({ isDark, C, data }: WProps) {
  return (
    <a href="/league" style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#4a90d9', letterSpacing: 1.5 }}>ELITSERIEN H</div>
        <ChevronRight size={12} color={C.textMuted} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
        {data.standings.slice(0, 4).map((row: any, i: number) => (
          <div key={row.team.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, fontSize: 10, fontWeight: 700, color: i < 2 ? '#f5c200' : C.textMuted }}>{i+1}</div>
            <div style={{ flex: 1, fontSize: 11, color: i === 0 ? C.text : C.textMuted, fontWeight: i === 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(row.team.name)}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#f5c200' : C.textMuted }}>{row.points}p</div>
          </div>
        ))}
      </div>
    </a>
  )
}

export function MyStatsWidget({ isDark, C, data }: WProps) {
  const stats = data.myStats
  const player = data.myPlayer
  if (!stats || !player) return (
    <a href="/profile" style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>MIN STATISTIK</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <User size={24} color={C.textMuted} />
        <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'center' }}>Claima din spelarprofil</div>
      </div>
    </a>
  )
  const rating = calcRating(stats.avg, stats.best, stats.over200)
  const tc = getTierColor(rating)
  const tl = getTierLabel(rating)
  return (
    <a href={'/players/' + player.id} style={{ ...base(isDark, isDark ? 'linear-gradient(135deg,#1c1640,#0d1520)' : '#ffffff', tc + '33'), textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: tc, letterSpacing: 1.5 }}>MIN STATISTIK</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: tc, background: tc + '22', borderRadius: 6, padding: '2px 6px' }}>{tl}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: tc, lineHeight: 1, marginBottom: 4 }}>{stats.avg || '—'}</div>
      <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 8 }}>SNITT · {stats.matches} MATCHER</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
        {[{l:'BÄSTA',v:stats.best||'—'},{l:'200+',v:stats.over200}].map(s => (
          <div key={s.l} style={{ flex: 1, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '5px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.v}</div>
            <div style={{ fontSize: 7, color: C.textMuted, marginTop: 1 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </a>
  )
}

export function AvailabilityWidget({ isDark, C, data, onRespond }: WProps & { onRespond: (r: string) => void }) {
  const m = data.availabilityMatch
  const myResponse = data.availabilityStatus
  const teamId = data.myTeam?.id
  if (!m || !teamId) return (
    <div style={base(isDark)}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>TILLGÄNGLIGHET</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.textMuted }}>Inga matcher</div>
    </div>
  )
  const isHome = m.home_team_id === teamId
  const opp = isHome ? m.away : m.home
  return (
    <div style={{ ...base(isDark, isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.04)', isDark ? 'rgba(245,194,0,0.2)' : 'rgba(245,194,0,0.25)') }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#f5c200', letterSpacing: 1.5, marginBottom: 6 }}>TILLGÄNGLIGHET</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>vs {shortName(opp?.name || '')}</div>
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10 }}>{new Date(m.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
      {myResponse ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {myResponse === 'yes' && <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.green + '22', border: '2px solid ' + C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={16} color={C.green} /></div>}
          {myResponse === 'maybe' && <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5c20022', border: '2px solid #f5c200', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><HelpCircle size={16} color="#f5c200" /></div>}
          {myResponse === 'no' && <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.red + '22', border: '2px solid ' + C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={16} color={C.red} /></div>}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: myResponse === 'yes' ? C.green : myResponse === 'maybe' ? '#f5c200' : C.red }}>
              {myResponse === 'yes' ? 'Du spelar!' : myResponse === 'maybe' ? 'Kanske' : 'Kan inte'}
            </div>
            <a href={'/team/' + teamId + '/tillganglighet/' + m.id} style={{ fontSize: 10, color: C.textMuted, textDecoration: 'none' }}>Ändra →</a>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          {[{k:'yes',l:'Ja',c:C.green},{k:'maybe',l:'?',c:'#f5c200'},{k:'no',l:'Nej',c:C.red}].map(r => (
            <button key={r.k} onClick={() => onRespond(r.k)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${r.c}44`, background: r.c + '18', color: r.c, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {r.l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TeamFeedWidget({ isDark, C, data }: WProps) {
  const posts = data.teamPosts
  const team = data.myTeam
  if (!team) return null
  return (
    <a href={'/team/' + team.id + '/intern'} style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5 }}>LAGFEED</div>
        <ChevronRight size={12} color={C.textMuted} />
      </div>
      {posts.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.textMuted }}>Inga inlägg än</div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {posts.slice(0,2).map((p: any) => (
            <div key={p.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: p.post_type === 'lineup' ? '#f5c200' : '#1d9e75', marginBottom: 3 }}>
                {p.post_type === 'lineup' ? 'LAGUTTAGNING' : 'NYHET'}
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                {p.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </a>
  )
}

export function UpcomingWidget({ isDark, C, data }: WProps) {
  return (
    <a href="/schema" style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5 }}>KOMMANDE</div>
        <ChevronRight size={12} color={C.textMuted} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center' }}>
        {data.upcoming.slice(0,3).map((m: any) => {
          const hc = teamColor(m.home?.name || '', isDark)
          const ac = teamColor(m.away?.name || '', isDark)
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: hc.bg, border: `1px solid ${hc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, fontWeight: 800, color: hc.text, flexShrink: 0 }}>{teamInitials(m.home?.name||'')}</div>
              <div style={{ flex: 1, fontSize: 10, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.home?.name||'')} – {shortName(m.away?.name||'')}</div>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: ac.bg, border: `1px solid ${ac.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, fontWeight: 800, color: ac.text, flexShrink: 0 }}>{teamInitials(m.away?.name||'')}</div>
            </div>
          )
        })}
      </div>
    </a>
  )
}

export function RecentResultsWidget({ isDark, C, data }: WProps) {
  return (
    <a href="/schema" style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5 }}>SENASTE RESULTAT</div>
        <ChevronRight size={12} color={C.textMuted} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
        {data.recentResults.slice(0,4).map((m: any) => {
          const hc = teamColor(m.home?.name || '', isDark)
          const ac = teamColor(m.away?.name || '', isDark)
          const hw = m.home_score > m.away_score
          const aw = m.away_score > m.home_score
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: hc.bg, border: `1px solid ${hc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, fontWeight: 800, color: hc.text, flexShrink: 0 }}>{teamInitials(m.home?.name||'')}</div>
              <div style={{ flex: 1, fontSize: 9, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.home?.name||'')}</div>
              <div style={{ fontSize: 11, fontWeight: 800, minWidth: 32, textAlign: 'center' }}>
                <span style={{ color: hw ? '#f5c200' : C.textMuted }}>{m.home_score}</span>
                <span style={{ color: C.textMuted, fontSize: 9 }}>–</span>
                <span style={{ color: aw ? '#f5c200' : C.textMuted }}>{m.away_score}</span>
              </div>
              <div style={{ flex: 1, fontSize: 9, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{shortName(m.away?.name||'')}</div>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: ac.bg, border: `1px solid ${ac.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, fontWeight: 800, color: ac.text, flexShrink: 0 }}>{teamInitials(m.away?.name||'')}</div>
            </div>
          )
        })}
      </div>
    </a>
  )
}

export function FavTeamsWidget({ isDark, C, data }: WProps) {
  const teams = data.favTeams
  if (!teams.length) return (
    <a href="/teams" style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#e05555', letterSpacing: 1.5, marginBottom: 8 }}>FAVORITLAG</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Heart size={22} color={C.textMuted} />
        <div style={{ fontSize: 11, color: C.textMuted }}>Följ lag för att se dem här</div>
      </div>
    </a>
  )
  return (
    <a href="/teams" style={{ ...base(isDark), textDecoration: 'none' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#e05555', letterSpacing: 1.5, marginBottom: 8 }}>FAVORITLAG</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center' }}>
        {teams.slice(0,3).map((t: any) => {
          const tc = teamColor(t.name, isDark)
          const m = t.lastResult
          const isHome = m?.home_team_id === t.id
          const myScore = isHome ? m?.home_score : m?.away_score
          const oppScore = isHome ? m?.away_score : m?.home_score
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: tc.bg, border: `1.5px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: tc.text, flexShrink: 0 }}>{teamInitials(t.name)}</div>
              <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(t.name)}</div>
              {m && <div style={{ fontSize: 11, fontWeight: 700, color: myScore > oppScore ? '#f5c200' : C.textMuted }}>{myScore}–{oppScore}</div>}
            </div>
          )
        })}
      </div>
    </a>
  )
}

export const WIDGET_REGISTRY = [
  { id: 'next_match', label: 'Nästa match', desc: 'Nedräkning till nästa match', icon: Calendar, requiresTeam: true },
  { id: 'last_result', label: 'Senaste match', desc: 'Ditt lags senaste resultat', icon: Trophy, requiresTeam: true },
  { id: 'standings', label: 'Serietabell', desc: 'Elitserien topp 4', icon: BarChart2 },
  { id: 'my_stats', label: 'Min statistik', desc: 'Ditt snitt och tier', icon: User, requiresPlayer: true },
  { id: 'availability', label: 'Tillgänglighet', desc: 'Svara direkt från startsidan', icon: Bell, requiresTeam: true },
  { id: 'team_feed', label: 'Lagfeed', desc: 'Senaste från ditt lag', icon: FileText, requiresTeam: true },
  { id: 'upcoming', label: 'Kommande matcher', desc: 'Nästa matcher', icon: Calendar },
  { id: 'recent_results', label: 'Senaste resultat', desc: 'Nyliga matchresultat', icon: Trophy },
  { id: 'fav_teams', label: 'Favoritlag', desc: 'Dina följda lag', icon: Heart },
]
