'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Player = { id: string; name: string; teamName?: string }
type Claim = { id: string; player_id: string; status: string; players: { name: string; team_id: string } }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export default function ProfilePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState<Claim | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [claiming, setClaiming] = useState(false)
  const [teams, setTeams] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      // Load existing claim
      const { data: claimData } = await supabase
        .from('player_claims')
        .select('id, player_id, status, players:player_id(name, team_id)')
        .eq('user_id', session.user.id)
        .single()

      if (claimData) setClaim(claimData as any)

      // Load teams for name lookup
      const { data: teamsData } = await supabase.from('teams').select('id, name')
      if (teamsData) {
        const map: Record<string, string> = {}
        teamsData.forEach((t: any) => { map[t.id] = shortName(t.name) })
        setTeams(map)
      }

      setLoading(false)
    })
  }, [])

  const search = async () => {
    if (!searchQ.trim()) return
    const supabase = createClient()
    const { data } = await supabase
      .from('players')
      .select('id, name, team_id')
      .ilike('name', '%' + searchQ + '%')
      .limit(10)
    setSearchResults(data?.map((p: any) => ({ ...p, teamName: teams[p.team_id] || '' })) || [])
  }

  const claimPlayer = async (player: Player) => {
    setClaiming(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('player_claims')
      .insert({ user_id: session.user.id, player_id: player.id, status: 'pending' })
      .select('id, player_id, status, players:player_id(name, team_id)')
      .single()

    if (!error && data) {
      setClaim(data as any)
      setSearching(false)
      setSearchResults([])
      setSearchQ('')
    }
    setClaiming(false)
  }

  const removeClaim = async () => {
    if (!claim) return
    const supabase = createClient()
    await supabase.from('player_claims').delete().eq('id', claim.id)
    setClaim(null)
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email
  const email = user?.email
  const hue = email?.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px 48px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Min profil</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>Hantera ditt konto</div>
        </div>

        {/* User card */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {avatar ? (
              <img src={avatar} alt={name} style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid ' + C.border }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: tclo, border: '2px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: tc }}>
                {name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{name}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{email}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>Inloggad med Google</div>
            </div>
          </div>
        </div>

        {/* Player claim section */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '16px 20px', borderBottom: claim || searching ? '1px solid ' + C.border : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22 }}>🎳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Spelarprofil</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {claim ? 'Kopplad till ' + (claim.players as any)?.name : 'Länka ditt konto till din spelarprofil'}
                </div>
              </div>
              {!claim && !searching && (
                <button onClick={() => setSearching(true)}
                  style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Claima
                </button>
              )}
              {claim && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: claim.status === 'verified' ? C.green : C.accent, background: (claim.status === 'verified' ? C.green : C.accent) + '18', borderRadius: 6, padding: '3px 8px' }}>
                    {claim.status === 'verified' ? '✓ Verifierad' : '⏳ Väntar'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Claim search */}
          {searching && !claim && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>
                Sök efter ditt namn i bowlingregistret:
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="Ditt namn..."
                  style={{ flex: 1, background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none' }}
                />
                <button onClick={search}
                  style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Sok
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {searchResults.map(p => {
                    const phue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                    const ptc = 'hsl(' + phue + ',50%,45%)'
                    const ptclo = theme === 'dark' ? 'hsl(' + phue + ',40%,15%)' : 'hsl(' + phue + ',40%,92%)'
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.surface, borderRadius: 10, border: '1px solid ' + C.border }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: ptclo, border: '1.5px solid ' + ptc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: ptc, flexShrink: 0 }}>
                          {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</div>
                          {p.teamName && <div style={{ fontSize: 11, color: C.textMuted }}>{p.teamName}</div>}
                        </div>
                        <button onClick={() => claimPlayer(p)} disabled={claiming}
                          style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: claiming ? 0.7 : 1 }}>
                          Det ar jag
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {searchResults.length === 0 && searchQ && (
                <div style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '16px 0' }}>
                  Inga spelare hittades — prova ett annat namn
                </div>
              )}

              <button onClick={() => { setSearching(false); setSearchResults([]); setSearchQ('') }}
                style={{ marginTop: 12, background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Avbryt
              </button>
            </div>
          )}

          {/* Claimed player info */}
          {claim && (
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <a href={'/players/' + claim.player_id} style={{ flex: 1, fontSize: 13, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
                Se min spelarprofil →
              </a>
              <button onClick={removeClaim}
                style={{ background: 'transparent', border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: C.textMuted, cursor: 'pointer' }}>
                Ta bort
              </button>
            </div>
          )}
        </div>

        {/* Club claim - coming soon */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 22 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Klubbsida</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Hantera din klubbs sida pa Bowlkollen</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.border, borderRadius: 8, padding: '4px 10px' }}>Kom snart</div>
          </div>
        </div>

        {/* Sign out */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          <button onClick={signOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontSize: 16 }}>🚪</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e05555' }}>Logga ut</div>
          </button>
        </div>

      </div>
    </main>
  )
}
