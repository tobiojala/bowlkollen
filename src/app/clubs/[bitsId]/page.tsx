'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/cn'

type Club = {
  bits_id: number
  name: string
  county: string | null
  hall_name: string | null
  is_active: boolean
  logo_url: string | null
}

type BitsTeam = {
  bits_team_id: number
  bits_club_id: number
  name: string
  hall_name: string | null
  team_type: number | null
  team_type_desc: string | null
  team_alias: string | null
}

type OurTeam = {
  id: string
  name: string
  club: string | null
  club_slug: string | null
  team_path: string | null
  division: string | null
}

type Props = { params: Promise<{ bitsId: string }> }

function divisionColor(d: string | null) {
  if (!d) return '#6b7a99'
  if (d.includes('Elitserien')) return '#4a90d9'
  if (d.includes('Allsvenskan')) return '#5ba85a'
  return '#8a9ab5'
}

function teamTypeLabel(t: BitsTeam): string {
  const desc = t.team_type_desc ?? ''
  if (desc.includes('A - Lag')) return 'A-lag'
  if (desc.includes('B - Lag')) return 'B-lag'
  if (desc.includes('C - Lag')) return 'C-lag'
  if (desc.includes('F - Lag')) return 'F-lag'
  if (desc.includes('DA - Lag')) return 'Damer A'
  if (desc.includes('DB - Lag')) return 'Damer B'
  if (desc.includes('JH - Lag') || desc.includes('Junior')) return 'Junior'
  return desc || ''
}

export default function ClubPage({ params }: Props) {
  const router = useRouter()
  const [club, setClub] = useState<Club | null>(null)
  const [bitsTeams, setBitsTeams] = useState<BitsTeam[]>([])
  const [ourTeams, setOurTeams] = useState<OurTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    params.then(async ({ bitsId }) => {
      const numId = Number(bitsId)
      const supabase = createClient()

      const { data: c } = await supabase
        .from('bits_clubs')
        .select('bits_id, name, county, hall_name, is_active, logo_url')
        .eq('bits_id', numId)
        .single()

      if (!c) {
        setLoading(false)
        return
      }
      setClub(c as Club)

      const [{ data: bt }, { data: ot }, { data: matchDiv }] = await Promise.all([
        supabase
          .from('bits_teams')
          .select('bits_team_id, bits_club_id, name, hall_name, team_type, team_type_desc, team_alias')
          .eq('bits_club_id', numId)
          .order('name'),
        supabase
          .from('teams')
          .select('id, name, club, club_slug, team_path')
          .eq('club', (c as Club).name),
        supabase
          .from('matches')
          .select('home_team_id, away_team_id, division')
          .not('division', 'is', null)
          .eq('status', 'completed')
          .limit(200),
      ])

      const divMap: Record<string, string> = {}
      matchDiv?.forEach((m: { home_team_id?: string; away_team_id?: string; division?: string }) => {
        if (m.division) {
          if (m.home_team_id) divMap[m.home_team_id] = m.division
          if (m.away_team_id) divMap[m.away_team_id] = m.division
        }
      })

      if (bt) setBitsTeams(bt as BitsTeam[])
      if (ot) setOurTeams((ot as OurTeam[]).map(t => ({ ...t, division: divMap[t.id] ?? null })))
      setLoading(false)
    })
  }, [params])

  function findOurTeam(bt: BitsTeam): OurTeam | null {
    const n = bt.name.toLowerCase()
    return (
      ourTeams.find(
        t =>
          t.name.toLowerCase() === n ||
          t.name.toLowerCase().includes(n) ||
          n.includes(t.name.toLowerCase()),
      ) ?? null
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <div className="text-sm text-dark-muted">Laddar...</div>
      </main>
    )
  }

  if (!club) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <div className="text-sm text-dark-muted">Klubben hittades inte</div>
      </main>
    )
  }

  const initials = club.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
  const hue = club.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const teamsWithData = bitsTeams.filter(bt => findOurTeam(bt) !== null)
  const showLogo = club.logo_url && !logoFailed

  return (
    <main className="min-h-screen bg-light-bg pb-12 font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app">
        <div
          className={cn(
            'px-5 pt-5 pb-6',
            'bg-linear-to-br from-[#e8f0f8] to-[#d0e0f0]',
            'dark:from-[#0d1a2e] dark:to-[#1a2840]',
          )}
        >
          <button
            type="button"
            onClick={() => router.push('/teams')}
            className="mb-5 inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs text-dark-muted"
          >
            ← Alla klubbar
          </button>

          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-black',
                showLogo
                  ? 'border border-black/10 bg-white dark:border-white/12 dark:bg-white/6'
                  : 'border-2',
              )}
              style={
                showLogo
                  ? undefined
                  : {
                      background: `hsla(${hue},50%,45%,0.15)`,
                      borderColor: `hsla(${hue},50%,45%,0.5)`,
                      color: `hsl(${hue},50%,55%)`,
                    }
              }
            >
              {showLogo ? (
                <img
                  src={club.logo_url!}
                  alt={club.name}
                  onError={() => setLogoFailed(true)}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <h1 className="m-0 mb-1 text-[22px] font-black bk-text-primary">{club.name}</h1>
              <div className="text-[13px] text-dark-muted">
                {[club.county, club.hall_name].filter(Boolean).join(' · ')}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-lg border border-gold/25 bg-gold/12 px-2.5 py-1 text-[11px] font-extrabold text-gold">
                  {bitsTeams.length} lag
                </span>
                {teamsWithData.length > 0 && (
                  <span className="inline-flex items-center rounded-lg border border-[#38a088]/25 bg-[#38a088]/12 px-2.5 py-1 text-[11px] font-extrabold text-[#38a088]">
                    {teamsWithData.length} med resultat
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pt-4">
          {bitsTeams.length === 0 ? (
            <div
              className={cn(
                'rounded-2xl border px-6 py-12 text-center',
                'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
              )}
            >
              <div className="mb-3 text-[32px]">🎳</div>
              <div className="mb-1.5 text-[15px] font-bold bk-text-primary">Inga aktiva lag</div>
              <div className="text-[13px] text-dark-muted">
                Den här klubben har inga registrerade lag i BITS just nu
              </div>
            </div>
          ) : (
            <>
              <div className="px-1 pb-3 text-[11px] font-extrabold tracking-widest text-dark-muted uppercase">
                Lag ({bitsTeams.length})
              </div>
              <div className="flex flex-col gap-2">
                {bitsTeams.map(bt => {
                  const ourTeam = findOurTeam(bt)
                  const href =
                    ourTeam?.club_slug && ourTeam?.team_path
                      ? `/${ourTeam.club_slug}/${ourTeam.team_path}`
                      : ourTeam
                        ? `/teams/${ourTeam.id}`
                        : null
                  const typeLabel = teamTypeLabel(bt)
                  const divClr = ourTeam?.division ? divisionColor(ourTeam.division) : null

                  const inner = (
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border p-4',
                        'border-light-border bg-light-card shadow-sm',
                        'dark:border-dark-border dark:bg-dark-card dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
                        !ourTeam && 'opacity-65',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                          ourTeam
                            ? 'border-[#38a088]/30 bg-[#38a088]/10 dark:bg-[#38a088]/12'
                            : 'border-light-border bg-black/5 dark:border-dark-border dark:bg-white/5',
                        )}
                      >
                        <Users
                          size={18}
                          className={ourTeam ? 'text-[#38a088]' : 'text-dark-muted'}
                          strokeWidth={2}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-[3px] truncate text-[15px] font-bold bk-text-primary">
                          {bt.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ourTeam?.division && divClr ? (
                            <span
                              className="rounded-[5px] px-[7px] py-0.5 text-[10px] font-extrabold"
                              style={{
                                color: divClr,
                                background: `${divClr}20`,
                              }}
                            >
                              {ourTeam.division}
                            </span>
                          ) : null}
                          {typeLabel && !ourTeam?.division ? (
                            <span
                              className={cn(
                                'rounded-[5px] px-[7px] py-0.5 text-[10px] font-bold',
                                ourTeam
                                  ? 'bg-[#38a088]/12 text-[#38a088]'
                                  : 'bg-black/6 text-dark-muted dark:bg-white/6',
                              )}
                            >
                              {typeLabel}
                            </span>
                          ) : null}
                          {bt.hall_name ? (
                            <span className="text-[11px] text-dark-muted">{bt.hall_name}</span>
                          ) : null}
                          {!ourTeam ? (
                            <span className="text-[10px] text-dark-muted italic">
                              Inte i Bowlkollen än
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {ourTeam ? <ChevronRight size={14} className="shrink-0 text-dark-muted" /> : null}
                    </div>
                  )

                  return href ? (
                    <Link key={bt.bits_team_id} href={href} className="block no-underline">
                      {inner}
                    </Link>
                  ) : (
                    <div key={bt.bits_team_id}>{inner}</div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
