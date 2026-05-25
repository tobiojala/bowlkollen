'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

const DEMO = true

// ─── Types ───
type Team = { id: string; name: string; club: string }
type Match = {
  id: string; home_team_id: string; away_team_id: string
  home_score: number | null; away_score: number | null
  division: string; date: string
}
type Standing = {
  teamId: string; teamName: string
  played: number; wins: number; draws: number; losses: number
  bpFor: number; bpAgainst: number; diff: number; points: number
}

// ─── Zone config per §D 109, §D 102–104 ───
// Ranking: 1) matchpoäng 2) bp-differens 3) inbördes möten (approx: bpFor) 4-6) h2h/lottning
// maxRank is 1-indexed inclusive; 'transparent' = mid-table / no movement
type Zone = { maxRank: number; color: string; label: string }

function getZones(division: string, total: number): Zone[] {
  switch (division) {
    case 'Elitserien Herrar': return [
      { maxRank: 2,       color: '#f5c200', label: 'SM-slutspel' },
      { maxRank: 6,       color: '#c49040', label: 'Slutspelskval (playoff)' },
      { maxRank: 8,       color: 'transparent', label: '' },
      { maxRank: 9,       color: '#e8a030', label: 'Kval till Elitserien' },
      { maxRank: 10,      color: '#666',    label: 'Nedflyttning' },
    ]
    case 'Elitserien Damer': return [
      { maxRank: 4,       color: '#f5c200', label: 'SM-slutspel' },
      { maxRank: 5,       color: 'transparent', label: '' },
      { maxRank: 7,       color: '#e8a030', label: 'Kval till Elitserien' },
      { maxRank: 8,       color: '#666',    label: 'Nedflyttning' },
    ]
    case 'Sydallsvenskan Herrar':
    case 'Mellanallsvenskan Herrar': return [
      { maxRank: 2,           color: '#f5c200', label: 'Kval till Elitserien' },
      { maxRank: total - 3,   color: 'transparent', label: '' },
      { maxRank: total - 2,   color: '#e8a030', label: 'Kval Allsvenskan' },
      { maxRank: total,       color: '#666',    label: 'Nedflyttning' },
    ]
    case 'Nordallsvenskan Herrar': return [
      { maxRank: 1,           color: '#f5c200', label: 'Kval till Elitserien' },
      { maxRank: total - 3,   color: 'transparent', label: '' },
      { maxRank: total - 1,   color: '#e8a030', label: 'Kval Allsvenskan' },
      { maxRank: total,       color: '#666',    label: 'Nedflyttning' },
    ]
    case 'Södra Allsvenskan Damer':
    case 'Norra Allsvenskan Damer': return [
      { maxRank: 2,           color: '#f5c200', label: 'Kval till Elitserien' },
      { maxRank: total - 2,   color: 'transparent', label: '' },
      { maxRank: total,       color: '#e8a030', label: 'Kval Allsvenskan' },
    ]
    default:
      if (division.startsWith('Div 1') || division.startsWith('Division 1')) return [
        { maxRank: 1,         color: '#f5c200', label: 'Uppflyttning' },
        { maxRank: 2,         color: '#c49040', label: 'Kval till Allsvenskan' },
        { maxRank: total - 3, color: 'transparent', label: '' },
        { maxRank: total - 2, color: '#e8a030', label: 'Kval Division 1' },
        { maxRank: total,     color: '#666',    label: 'Nedflyttning' },
      ]
      if (division.startsWith('Div 2') || division.startsWith('Division 2')) return [
        { maxRank: 1,         color: '#f5c200', label: 'Uppflyttning' },
        { maxRank: 2,         color: '#c49040', label: 'Kval till Division 1' },
        { maxRank: total - 3, color: 'transparent', label: '' },
        { maxRank: total - 2, color: '#e8a030', label: 'Kval Division 2' },
        { maxRank: total,     color: '#666',    label: 'Nedflyttning' },
      ]
      return [
        { maxRank: 1,         color: '#f5c200', label: 'Uppflyttning' },
        { maxRank: total - 1, color: 'transparent', label: '' },
        { maxRank: total,     color: '#666',    label: 'Nedflyttning' },
      ]
  }
}

function zoneColor(rank1: number, zones: Zone[]): string {
  for (const z of zones) {
    if (rank1 <= z.maxRank) return z.color
  }
  return 'transparent'
}

function showDivider(rank1: number, zones: Zone[]): boolean {
  for (let i = 1; i < zones.length; i++) {
    if (rank1 === zones[i - 1].maxRank + 1) return true
  }
  return false
}

// ─── Mock standings (swap for real API data when ready) ───
const MOCK: Record<string, Standing[]> = {
  'Elitserien Herrar': [
    { teamId: 'eh-1',  teamName: 'IK Hakarpspojkarna', played: 14, wins: 10, draws: 1, losses: 3,  bpFor: 198, bpAgainst: 134, diff: 64,  points: 21 },
    { teamId: 'eh-2',  teamName: 'Örebro BK',          played: 14, wins: 9,  draws: 2, losses: 3,  bpFor: 185, bpAgainst: 147, diff: 38,  points: 20 },
    { teamId: 'eh-3',  teamName: 'Stockholms BK',      played: 14, wins: 8,  draws: 1, losses: 5,  bpFor: 177, bpAgainst: 155, diff: 22,  points: 17 },
    { teamId: 'eh-4',  teamName: 'Mariestads BK',      played: 14, wins: 7,  draws: 2, losses: 5,  bpFor: 169, bpAgainst: 163, diff: 6,   points: 16 },
    { teamId: 'eh-5',  teamName: 'Linköpings BK',      played: 14, wins: 7,  draws: 1, losses: 6,  bpFor: 162, bpAgainst: 159, diff: 3,   points: 15 },
    { teamId: 'eh-6',  teamName: 'Göteborgs BK',       played: 14, wins: 6,  draws: 2, losses: 6,  bpFor: 158, bpAgainst: 162, diff: -4,  points: 14 },
    { teamId: 'eh-7',  teamName: 'Malmö BK',           played: 14, wins: 5,  draws: 3, losses: 6,  bpFor: 153, bpAgainst: 165, diff: -12, points: 13 },
    { teamId: 'eh-8',  teamName: 'Umeå BK',            played: 14, wins: 4,  draws: 2, losses: 8,  bpFor: 147, bpAgainst: 172, diff: -25, points: 10 },
    { teamId: 'eh-9',  teamName: 'Västerås BK',        played: 14, wins: 3,  draws: 1, losses: 10, bpFor: 138, bpAgainst: 181, diff: -43, points: 7  },
    { teamId: 'eh-10', teamName: 'Sundsvalls BSK',     played: 14, wins: 2,  draws: 1, losses: 11, bpFor: 122, bpAgainst: 191, diff: -69, points: 5  },
  ],
  'Elitserien Damer': [
    { teamId: 'ed-1', teamName: 'Spik Örebro',    played: 12, wins: 9, draws: 1, losses: 2,  bpFor: 161, bpAgainst: 103, diff: 58,  points: 19 },
    { teamId: 'ed-2', teamName: 'Malmö BK',       played: 12, wins: 8, draws: 2, losses: 2,  bpFor: 152, bpAgainst: 114, diff: 38,  points: 18 },
    { teamId: 'ed-3', teamName: 'Stockholms BK',  played: 12, wins: 7, draws: 1, losses: 4,  bpFor: 144, bpAgainst: 122, diff: 22,  points: 15 },
    { teamId: 'ed-4', teamName: 'Västerås BK',    played: 12, wins: 6, draws: 2, losses: 4,  bpFor: 138, bpAgainst: 128, diff: 10,  points: 14 },
    { teamId: 'ed-5', teamName: 'Göteborgs BK',   played: 12, wins: 4, draws: 2, losses: 6,  bpFor: 120, bpAgainst: 142, diff: -22, points: 10 },
    { teamId: 'ed-6', teamName: 'Linköpings BK',  played: 12, wins: 3, draws: 1, losses: 8,  bpFor: 108, bpAgainst: 154, diff: -46, points: 7  },
    { teamId: 'ed-7', teamName: 'Halmstads BK',   played: 12, wins: 2, draws: 2, losses: 8,  bpFor: 102, bpAgainst: 158, diff: -56, points: 6  },
    { teamId: 'ed-8', teamName: 'Norrköpings BK', played: 12, wins: 1, draws: 1, losses: 10, bpFor: 95,  bpAgainst: 179, diff: -84, points: 3  },
  ],
  'Sydallsvenskan Herrar': [
    { teamId: 'sah-1',  teamName: 'Göteborgs BK A',  played: 10, wins: 8, draws: 1, losses: 1, bpFor: 138, bpAgainst: 82,  diff: 56,  points: 17 },
    { teamId: 'sah-2',  teamName: 'Halmstads BK',    played: 10, wins: 7, draws: 2, losses: 1, bpFor: 132, bpAgainst: 90,  diff: 42,  points: 16 },
    { teamId: 'sah-3',  teamName: 'Jönköpings BK',   played: 10, wins: 6, draws: 1, losses: 3, bpFor: 120, bpAgainst: 98,  diff: 22,  points: 13 },
    { teamId: 'sah-4',  teamName: 'Malmö BK A',      played: 10, wins: 5, draws: 2, losses: 3, bpFor: 114, bpAgainst: 102, diff: 12,  points: 12 },
    { teamId: 'sah-5',  teamName: 'Norrköpings BK',  played: 10, wins: 5, draws: 1, losses: 4, bpFor: 108, bpAgainst: 106, diff: 2,   points: 11 },
    { teamId: 'sah-6',  teamName: 'Linköpings BK A', played: 10, wins: 4, draws: 2, losses: 4, bpFor: 104, bpAgainst: 108, diff: -4,  points: 10 },
    { teamId: 'sah-7',  teamName: 'Växjö BK',        played: 10, wins: 4, draws: 1, losses: 5, bpFor: 102, bpAgainst: 110, diff: -8,  points: 9  },
    { teamId: 'sah-8',  teamName: 'Helsingborgs BK', played: 10, wins: 3, draws: 2, losses: 5, bpFor: 98,  bpAgainst: 112, diff: -14, points: 8  },
    { teamId: 'sah-9',  teamName: 'Örebro BK F',     played: 10, wins: 3, draws: 1, losses: 6, bpFor: 96,  bpAgainst: 116, diff: -20, points: 7  },
    { teamId: 'sah-10', teamName: 'Borås BK',        played: 10, wins: 2, draws: 2, losses: 6, bpFor: 90,  bpAgainst: 118, diff: -28, points: 6  },
    { teamId: 'sah-11', teamName: 'Kalmar BK',       played: 10, wins: 2, draws: 0, losses: 8, bpFor: 84,  bpAgainst: 126, diff: -42, points: 4  },
    { teamId: 'sah-12', teamName: 'Luleå BK',        played: 10, wins: 1, draws: 1, losses: 8, bpFor: 74,  bpAgainst: 132, diff: -58, points: 3  },
  ],
}
// Mirror data for similar-structure divisions
MOCK['Mellanallsvenskan Herrar'] = MOCK['Sydallsvenskan Herrar'].map(r => ({ ...r, teamId: r.teamId.replace('sah', 'mah') }))
MOCK['Nordallsvenskan Herrar']   = MOCK['Sydallsvenskan Herrar'].slice(0, 9).map(r => ({ ...r, teamId: r.teamId.replace('sah', 'nah'), played: 8 }))
MOCK['Södra Allsvenskan Damer']  = MOCK['Sydallsvenskan Herrar'].slice(0, 8).map(r => ({ ...r, teamId: r.teamId.replace('sah', 'sad') }))
MOCK['Norra Allsvenskan Damer']  = MOCK['Sydallsvenskan Herrar'].slice(0, 6).map(r => ({ ...r, teamId: r.teamId.replace('sah', 'nad') }))
const D1_MOCK = MOCK['Sydallsvenskan Herrar'].map(r => ({ ...r }))
MOCK['Div 1 Norra Götaland Herrar'] = D1_MOCK.map(r => ({ ...r, teamId: r.teamId.replace('sah', 'ng') }))
MOCK['Div 1 Södra Götaland Herrar'] = D1_MOCK.map(r => ({ ...r, teamId: r.teamId.replace('sah', 'sg') }))
MOCK['Div 1 Norra Svealand Herrar'] = D1_MOCK.map(r => ({ ...r, teamId: r.teamId.replace('sah', 'ns') }))
MOCK['Div 1 Södra Svealand Herrar'] = D1_MOCK.map(r => ({ ...r, teamId: r.teamId.replace('sah', 'ss') }))
MOCK['Div 1 Norra Norrland Herrar'] = D1_MOCK.slice(0, 8).map(r => ({ ...r, teamId: r.teamId.replace('sah', 'nn') }))
MOCK['Div 1 Södra Norrland Herrar'] = D1_MOCK.slice(0, 8).map(r => ({ ...r, teamId: r.teamId.replace('sah', 'sn') }))
MOCK['Division 1 Damer']           = D1_MOCK.slice(0, 8).map(r => ({ ...r, teamId: r.teamId.replace('sah', 'd1d') }))

// ─── Calc standings from real Supabase data ───
// Sort per §D 109: 1) matchpoäng 2) bp-differens 3) inbördes möten (approx: bpFor)
function calcStandings(teams: Team[], matches: Match[], division: string): Standing[] {
  const divMatches = matches
    .filter(m => m.division === division && m.home_score !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const table: Record<string, Standing> = {}
  teams.forEach(t => {
    table[t.id] = { teamId: t.id, teamName: t.name, played: 0, wins: 0, draws: 0, losses: 0, bpFor: 0, bpAgainst: 0, diff: 0, points: 0 }
  })

  divMatches.forEach(m => {
    const h = table[m.home_team_id]
    const a = table[m.away_team_id]
    if (!h || !a) return
    const hs = m.home_score!, as_ = m.away_score!
    h.played++; a.played++
    h.bpFor += hs; h.bpAgainst += as_
    a.bpFor += as_; a.bpAgainst += hs
    if (hs > as_)      { h.wins++;  h.points += 2; a.losses++ }
    else if (as_ > hs) { a.wins++;  a.points += 2; h.losses++ }
    else               { h.draws++; h.points++;     a.draws++; a.points++ }
  })

  return Object.values(table)
    .map(s => ({ ...s, diff: s.bpFor - s.bpAgainst }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.bpFor - a.bpFor)
    .filter(s => s.played > 0)
}

// ─── Division layout ───
const TIER_GROUPS = [
  { label: 'Elitserien', divisions: [
    'Elitserien Herrar', 'Elitserien Damer',
  ]},
  { label: 'Allsvenskan', divisions: [
    'Sydallsvenskan Herrar', 'Mellanallsvenskan Herrar', 'Nordallsvenskan Herrar',
    'Södra Allsvenskan Damer', 'Norra Allsvenskan Damer',
  ]},
  { label: 'Division 1', divisions: [
    'Div 1 Norra Götaland Herrar', 'Div 1 Södra Götaland Herrar',
    'Div 1 Norra Svealand Herrar', 'Div 1 Södra Svealand Herrar',
    'Div 1 Norra Norrland Herrar', 'Div 1 Södra Norrland Herrar',
    'Division 1 Damer',
  ]},
]

function shortDiv(d: string) {
  return d
    .replace('Sydallsvenskan', 'Syd')
    .replace('Mellanallsvenskan', 'Mellan')
    .replace('Nordallsvenskan', 'Nord')
    .replace('Södra Allsvenskan', 'Södra')
    .replace('Norra Allsvenskan', 'Norra')
    .replace(' Herrar', ' H').replace(' Damer', ' D')
    .replace('Div 1 ', 'D1 ')
    .replace('Division 1 ', 'Div 1 ')
    .replace('Norra ', 'N.').replace('Södra ', 'S.')
    .replace('Götaland', 'Götal.').replace('Norrland', 'Norrl.').replace('Svealand', 'Sveal.')
}

function shortName(n: string) {
  return n.replace(/ (A|H A|DA|F)$/, '').trim()
}

// ─── Component ───
export default function LeaguePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [division, setDivision] = useState('Elitserien Herrar')
  const [teams, setTeams]   = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO) { setLoading(false); return }
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('id, name, club'),
      supabase.from('matches')
        .select('id, home_team_id, away_team_id, home_score, away_score, division, date')
        .eq('status', 'completed').not('home_score', 'is', null).not('division', 'is', null),
    ]).then(([{ data: t }, { data: m }]) => {
      if (t) setTeams(t as Team[])
      if (m) setMatches(m as Match[])
      setLoading(false)
    })
  }, [])

  const standings = DEMO
    ? (MOCK[division] ?? [])
    : calcStandings(teams, matches, division)

  const total = standings.length
  const zones = getZones(division, total)
  const legendZones = zones.filter(z => z.color !== 'transparent' && z.label)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ─── Sticky header ─── */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30, borderBottom: '1px solid ' + C.border }}>

        {/* Tier pills */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '10px 16px 6px' } as any}>
          {TIER_GROUPS.map(group => {
            const isActive = TIER_GROUPS.find(g => g.divisions.includes(division))?.label === group.label
            return (
              <button key={group.label} onClick={() => setDivision(group.divisions[0])}
                style={{
                  background: isActive ? C.accent : 'transparent',
                  border: '1px solid ' + (isActive ? C.accent : C.border),
                  borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700,
                  color: isActive ? '#1a1400' : C.textMuted,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                } as any}
              >
                {group.label}
              </button>
            )
          })}
        </div>

        {/* Division pills */}
        {(() => {
          const activeGroup = TIER_GROUPS.find(g => g.divisions.includes(division))
          if (!activeGroup || activeGroup.divisions.length <= 1) return null
          return (
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '4px 16px 8px' } as any}>
              {activeGroup.divisions.map(d => {
                const isActive = division === d
                return (
                  <button key={d} onClick={() => setDivision(d)}
                    style={{
                      background: isActive ? C.surface : 'transparent',
                      border: '1px solid ' + (isActive ? C.border : 'transparent'),
                      borderRadius: 20, padding: '4px 12px', fontSize: 11,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? C.text : C.textMuted,
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      WebkitTapHighlightColor: 'transparent',
                    } as any}
                  >
                    {shortDiv(d)}
                  </button>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* ─── Table ─── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 48px' }}>
        {loading && <div style={{ padding: 32, textAlign: 'center', color: C.textMuted }}>Laddar...</div>}
        {!loading && standings.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Inga resultat</div>
        )}
        {!loading && standings.length > 0 && (
          <div style={{ marginTop: 12 }}>

            {/* Column headers: pos | team | M | V | O | F | +/- | MP */}
            <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 26px 24px 24px 24px 40px 30px', gap: 4, padding: '4px 8px 6px', borderBottom: '1px solid ' + C.border }}>
              <div /><div />
              {['M', 'V', 'O', 'F', '+/−', 'MP'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: 'center', letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>

            {standings.map((s, i) => {
              const rank  = i + 1
              const zones_ = zones
              const zc    = zoneColor(rank, zones_)
              const dl    = s.diff > 0 ? '+' + s.diff : String(s.diff)
              const dc    = s.diff > 0 ? C.green : s.diff < 0 ? C.red : C.textMuted
              return (
                <div key={s.teamId}>
                  {showDivider(rank, zones_) && (
                    <div style={{ height: 2, background: zc !== 'transparent' ? zc : '#444', margin: '2px 0', borderRadius: 1, opacity: 0.3 }} />
                  )}
                  <a href={'/teams/' + s.teamId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr 26px 24px 24px 24px 40px 30px',
                      gap: 4, padding: '9px 8px',
                      textDecoration: 'none', borderRadius: 8, alignItems: 'center',
                      borderLeft: '3px solid ' + (zc !== 'transparent' ? zc : 'transparent'),
                    } as any}
                    onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: zc !== 'transparent' ? zc : C.textMuted, textAlign: 'center' }}>{rank}</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName(s.teamName)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{s.played}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.green, textAlign: 'center' }}>{s.wins}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{s.draws}</div>
                    <div style={{ fontSize: 12, color: C.red, textAlign: 'center' }}>{s.losses}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: dc, textAlign: 'center' }}>{dl}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, textAlign: 'center' }}>{s.points}</div>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Legend ─── */}
        {legendZones.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' as const }}>
            {legendZones.map(z => (
              <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: z.color }} />
                {z.label}
              </div>
            ))}
          </div>
        )}

        {/* Column legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' as const }}>
          {[['M', 'Matcher'], ['V', 'Vinst'], ['O', 'Oavgjort'], ['F', 'Förlust'], ['+/−', 'Banpoängsdifferens'], ['MP', 'Matchpoäng']].map(([abbr, full]) => (
            <div key={abbr} style={{ fontSize: 10, color: C.textMuted }}>
              <span style={{ fontWeight: 700 }}>{abbr}</span> {full}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
