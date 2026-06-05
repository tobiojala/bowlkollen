'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { shortName, shortDiv } from '@/lib/utils'
import { cn } from '@/lib/cn'
import { FilterChip } from '@/components/ui'

const DEMO = false

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
      { maxRank: 6,       color: '#38a088', label: 'Slutspelskval (playoff)' },
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
        { maxRank: 2,         color: '#38a088', label: 'Kval till Allsvenskan' },
        { maxRank: total - 3, color: 'transparent', label: '' },
        { maxRank: total - 2, color: '#e8a030', label: 'Kval Division 1' },
        { maxRank: total,     color: '#666',    label: 'Nedflyttning' },
      ]
      if (division.startsWith('Div 2') || division.startsWith('Division 2')) return [
        { maxRank: 1,         color: '#f5c200', label: 'Uppflyttning' },
        { maxRank: 2,         color: '#38a088', label: 'Kval till Division 1' },
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

const TABLE_GRID =
  'grid grid-cols-[24px_1fr_28px_68px_40px_30px] items-center gap-1 px-2 py-[9px]'

// ─── Component ───
export default function LeaguePage() {
  const [division, setDivision] = useState('Elitserien Herrar')
  const [teams, setTeams]   = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('followedTeams') || '[]')
      setFollowedIds(new Set(stored))
    } catch {}
  }, [])

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
  const activeGroup = TIER_GROUPS.find(g => g.divisions.includes(division))

  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">

      <div
        className={cn(
          'sticky top-14 z-30 border-b',
          'border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg',
        )}
      >
        <div
          className={cn(
            'flex gap-1.5 overflow-x-auto px-4 pt-2.5 pb-1.5',
            '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {TIER_GROUPS.map(group => {
            const isActive = activeGroup?.label === group.label
            return (
              <button
                key={group.label}
                type="button"
                onClick={() => setDivision(group.divisions[0])}
                className={cn(
                  'shrink-0 cursor-pointer rounded-full border px-3.5 py-[5px] text-xs font-bold whitespace-nowrap',
                  '[-webkit-tap-highlight-color:transparent]',
                  isActive
                    ? 'border-gold bg-gold text-[#1a1400]'
                    : 'border-light-border bg-transparent text-dark-muted dark:border-dark-border',
                )}
              >
                {group.label}
              </button>
            )
          })}
        </div>

        {activeGroup && activeGroup.divisions.length > 1 && (
          <div
            className={cn(
              'flex gap-1.5 overflow-x-auto px-4 pt-1 pb-2',
              '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {activeGroup.divisions.map(d => {
              const isActive = division === d
              return (
                <FilterChip key={d} active={isActive} onClick={() => setDivision(d)}>
                  {shortDiv(d)}
                </FilterChip>
              )
            })}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-app px-4 pb-12">
        {loading && (
          <div className="mt-3 flex flex-col gap-0.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className={cn(TABLE_GRID)}>
                <div className="h-[11px] w-4 animate-pulse rounded bg-black/7 dark:bg-white/7" />
                <div
                  className={cn(
                    'h-[11px] animate-pulse rounded bg-black/7 dark:bg-white/7',
                    (['w-1/2', 'w-[60%]', 'w-[70%]', 'w-[80%]'] as const)[i % 4],
                  )}
                />
                <div className="h-[11px] w-[22px] animate-pulse rounded bg-black/7 dark:bg-white/7" />
                <div className="h-[11px] w-[52px] animate-pulse rounded bg-black/7 dark:bg-white/7" />
                <div className="h-[11px] w-[30px] animate-pulse rounded bg-black/7 dark:bg-white/7" />
                <div className="h-[11px] w-6 animate-pulse rounded bg-black/7 dark:bg-white/7" />
              </div>
            ))}
          </div>
        )}

        {!loading && standings.length === 0 && (
          <p className="py-8 text-center text-[13px] text-dark-muted">Inga resultat</p>
        )}

        {!loading && standings.length > 0 && (
          <div className="mt-3">
            <div
              className={cn(
                TABLE_GRID,
                'border-b border-light-border pb-1.5 dark:border-dark-border',
              )}
            >
              <div />
              <div />
              {['M', 'V-O-F', '+/−', 'MP'].map(h => (
                <div
                  key={h}
                  className="text-center text-[10px] font-bold tracking-wide text-dark-muted"
                >
                  {h}
                </div>
              ))}
            </div>

            {standings.map((s, i) => {
              const rank = i + 1
              const zc = zoneColor(rank, zones)
              const dl = s.diff > 0 ? '+' + s.diff : String(s.diff)
              const followed = followedIds.has(s.teamId)

              return (
                <div key={s.teamId}>
                  {showDivider(rank, zones) && (
                    <div
                      className="my-0.5 h-0.5 rounded-sm opacity-30"
                      style={{
                        background: zc !== 'transparent' ? zc : '#444',
                      }}
                    />
                  )}
                  <Link
                    href={`/teams/${s.teamId}`}
                    className={cn(
                      TABLE_GRID,
                      'rounded-lg no-underline transition-colors',
                      'hover:bg-light-card dark:hover:bg-dark-card',
                      followed && 'bg-[rgba(91,130,180,0.07)] dark:bg-[rgba(91,130,180,0.10)]',
                    )}
                    style={{
                      borderLeftWidth: 3,
                      borderLeftStyle: 'solid',
                      borderLeftColor: zc !== 'transparent' ? zc : 'transparent',
                    }}
                  >
                    <div
                      className={cn(
                        'text-center text-xs font-bold',
                        zc === 'transparent' && 'text-dark-muted',
                      )}
                      style={zc !== 'transparent' ? { color: zc } : undefined}
                    >
                      {rank}
                    </div>
                    <div
                      className={cn(
                        'min-w-0 truncate text-sm bk-text-primary',
                        followed ? 'font-bold' : 'font-medium',
                      )}
                    >
                      {shortName(s.teamName)}
                    </div>
                    <div className="text-center text-xs text-dark-muted tabular-nums">
                      {s.played}
                    </div>
                    <div className="flex items-center justify-center text-xs tabular-nums">
                      <span className="inline-block w-[18px] text-center font-bold text-[#1a8870] dark:text-[#38a088]">
                        {s.wins}
                      </span>
                      <span className="text-[10px] text-dark-muted">-</span>
                      <span className="inline-block w-[18px] text-center text-dark-muted">
                        {s.draws}
                      </span>
                      <span className="text-[10px] text-dark-muted">-</span>
                      <span className="inline-block w-[18px] text-center text-red">
                        {s.losses}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'text-center text-[11px] font-semibold tabular-nums',
                        s.diff > 0 && 'text-[#1a8870] dark:text-[#38a088]',
                        s.diff < 0 && 'text-red',
                        s.diff === 0 && 'text-dark-muted',
                      )}
                    >
                      {dl}
                    </div>
                    <div className="text-center text-sm font-extrabold tabular-nums bk-text-primary">
                      {s.points}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {legendZones.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {legendZones.map(z => (
              <div
                key={z.label}
                className="flex items-center gap-[5px] text-[11px] text-dark-muted"
              >
                <div
                  className="h-2 w-2 rounded-sm"
                  style={{ background: z.color }}
                />
                {z.label}
              </div>
            ))}
          </div>
        )}

        <div className="mt-2.5 flex flex-wrap gap-3">
          {[['M', 'Matcher'], ['V-O-F', 'Vinst–Oavgjort–Förlust'], ['+/−', 'Banpoängsdifferens'], ['MP', 'Matchpoäng']].map(([abbr, full]) => (
            <div key={abbr} className="text-[10px] text-dark-muted">
              <span className="font-bold">{abbr}</span> {full}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
