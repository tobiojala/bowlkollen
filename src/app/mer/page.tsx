'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { Trophy, LogOut, User, MapPin, ShoppingBag, ChevronRight } from 'lucide-react'
import { shortName } from '@/lib/utils'
import WidgetGrid from '@/components/widgets/WidgetGrid'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type Player = { id: string; name: string; teamName?: string }
type Claim = { id: string; player_id: string; status: string; players: { name: string; team_id: string } }
type ClubClaim = { id: string; team_id: string; role: string; status: string; teams: { name: string; club: string } }

export default function MerPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState<Claim | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [claiming, setClaiming] = useState(false)
  const [teams, setTeams] = useState<Record<string, string>>({})
  const [clubClaims, setClubClaims] = useState<ClubClaim[]>([])
  const [searchingClub, setSearchingClub] = useState(false)
  const [clubSearchQ, setClubSearchQ] = useState('')
  const [clubSearchResults, setClubSearchResults] = useState<any[]>([])
  const [claimingClub, setClaimingClub] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('captain')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: claimData } = await supabase
        .from('player_claims')
        .select('id, player_id, status, players:player_id(name, team_id)')
        .eq('user_id', session.user.id)
        .single()
      if (claimData) setClaim(claimData as any)

      const { data: clubClaimData } = await supabase
        .from('club_claims')
        .select('id, team_id, role, status, teams:team_id(name, club)')
        .eq('user_id', session.user.id)
      if (clubClaimData) setClubClaims(clubClaimData as any)

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
    const { data } = await supabase.from('players').select('id, name, team_id').ilike('name', '%' + searchQ + '%').limit(10)
    setSearchResults(data?.map((p: any) => ({ ...p, teamName: teams[p.team_id] || '' })) || [])
  }

  const claimPlayer = async (player: Player) => {
    setClaiming(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data, error } = await supabase.from('player_claims')
      .insert({ user_id: session.user.id, player_id: player.id, status: 'pending' })
      .select('id, player_id, status, players:player_id(name, team_id)').single()
    if (!error && data) { setClaim(data as any); setSearching(false); setSearchResults([]); setSearchQ('') }
    setClaiming(false)
  }

  const removeClaim = async () => {
    if (!claim) return
    await createClient().from('player_claims').delete().eq('id', claim.id)
    setClaim(null)
  }

  const searchClubs = async () => {
    if (!clubSearchQ.trim()) return
    const { data } = await createClient().from('teams').select('id, name, club, city').ilike('club', '%' + clubSearchQ + '%').limit(10)
    setClubSearchResults(data || [])
  }

  const claimClub = async (team: any) => {
    setClaimingClub(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data, error } = await supabase.from('club_claims')
      .insert({ user_id: session.user.id, team_id: team.id, role: selectedRole, status: 'pending' })
      .select('id, team_id, role, status, teams:team_id(name, club)').single()
    if (!error && data) { setClubClaims(prev => [...prev, data as any]); setSearchingClub(false); setClubSearchResults([]); setClubSearchQ('') }
    setClaimingClub(false)
  }

  const removeClubClaim = async (claimId: string) => {
    await createClient().from('club_claims').delete().eq('id', claimId)
    setClubClaims(prev => prev.filter(c => c.id !== claimId))
  }

  const signOut = async () => {
    await createClient().auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email
  const email = user?.email
  const hue = email?.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = isDark ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 96 }}>

        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '56px 16px 16px',
          borderBottom: '1px solid ' + C.border,
          background: isDark
            ? 'linear-gradient(180deg, rgba(245,194,0,0.05) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(245,194,0,0.04) 0%, transparent 100%)',
        }}>
          {avatar ? (
            <img src={avatar} alt={name} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid ' + C.border, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: tclo, border: '2px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: tc, flexShrink: 0 }}>
              {name?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{email}</div>
          </div>
        </div>

        {/* Widget grid */}
        <WidgetGrid isDark={isDark} C={C} showGreeting={false} />

        {/* ── Utforska ────────────────────────────────────── */}
        <SectionHeader label="UTFORSKA" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '4px 16px 8px' }}>
          {[
            { href: '/hallar', icon: MapPin, label: 'Bowlinghallar', sub: '174 hallar i Sverige' },
            { href: '/klotshopar', icon: ShoppingBag, label: 'Klotshopar', sub: '16 pro shops' },
          ].map(({ href, icon: Icon, label, sub }, i) => (
            <motion.a
              key={href}
              href={href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              style={{
                textDecoration: 'none',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: '16px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(245,194,0,0.10)',
                border: '1px solid rgba(245,194,0,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color="#f5c200" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* ── Konto ───────────────────────────────────────── */}
        <SectionHeader label="KONTO" />

        {/* Player claim */}
        <div style={{ borderBottom: '1px solid ' + C.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <User size={18} color={C.textMuted} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Spelarprofil</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                {claim ? 'Kopplad till ' + (claim.players as any)?.name : 'Länka till din spelarprofil'}
              </div>
            </div>
            {!claim && !searching && (
              <button onClick={() => setSearching(true)}
                style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Koppla
              </button>
            )}
            {claim && (
              <span style={{ fontSize: 10, fontWeight: 700, color: claim.status === 'verified' ? C.green : C.accent, background: (claim.status === 'verified' ? C.green : C.accent) + '18', borderRadius: 6, padding: '3px 8px' }}>
                {claim.status === 'verified' ? 'Verifierad' : 'Väntar'}
              </span>
            )}
          </div>

          {searching && !claim && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>Sök efter ditt namn i bowlingregistret:</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="Ditt namn..." style={{ flex: 1, background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none' }} />
                <button onClick={search} style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sök</button>
              </div>
              {searchResults.map(p => {
                const ph = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const ptc = 'hsl(' + ph + ',50%,45%)'
                const ptclo = isDark ? 'hsl(' + ph + ',40%,15%)' : 'hsl(' + ph + ',40%,92%)'
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.surface, borderRadius: 10, border: '1px solid ' + C.border, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: ptclo, border: '1.5px solid ' + ptc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: ptc, flexShrink: 0 }}>
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      {p.teamName && <div style={{ fontSize: 11, color: C.textMuted }}>{p.teamName}</div>}
                    </div>
                    <button onClick={() => claimPlayer(p)} disabled={claiming}
                      style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: claiming ? 0.7 : 1 }}>
                      Det är jag
                    </button>
                  </div>
                )
              })}
              {searchResults.length === 0 && searchQ && (
                <div style={{ fontSize: 12, color: C.textMuted, padding: '8px 0' }}>Inga spelare hittades — prova ett annat namn</div>
              )}
              <button onClick={() => { setSearching(false); setSearchResults([]); setSearchQ('') }}
                style={{ marginTop: 8, background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Avbryt
              </button>
            </div>
          )}

          {claim && (
            <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <a href={'/players/' + claim.player_id} style={{ flex: 1, fontSize: 13, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
                Se min spelarprofil →
              </a>
              <button onClick={removeClaim} style={{ background: 'transparent', border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: C.textMuted, cursor: 'pointer' }}>
                Ta bort
              </button>
            </div>
          )}
        </div>

        {/* Club claims */}
        <div style={{ borderBottom: '1px solid ' + C.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <Trophy size={18} color={C.textMuted} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Mina klubbar</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                {clubClaims.length > 0 ? clubClaims.length + ' lag registrerade' : 'Koppla till din klubb eller ditt lag'}
              </div>
            </div>
            {!searchingClub && (
              <button onClick={() => setSearchingClub(true)}
                style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                + Lägg till
              </button>
            )}
          </div>

          {clubClaims.map(cc => (
            <div key={cc.id} style={{ padding: '10px 16px', borderTop: '1px solid ' + C.border, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{(cc.teams as any)?.club || (cc.teams as any)?.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, background: C.surface, borderRadius: 6, padding: '2px 8px', border: '1px solid ' + C.border }}>
                    {cc.role === 'captain' ? 'Kapten' : cc.role === 'admin' ? 'Admin' : 'Styrelse'}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cc.status === 'verified' ? C.green : C.accent, background: (cc.status === 'verified' ? C.green : C.accent) + '18', borderRadius: 6, padding: '2px 8px' }}>
                    {cc.status === 'verified' ? 'Verifierad' : 'Väntar'}
                  </span>
                </div>
              </div>
              <a href={'/teams/' + cc.team_id} style={{ fontSize: 12, color: C.accent, textDecoration: 'none', fontWeight: 600, marginRight: 8 }}>Se sida →</a>
              <button onClick={() => removeClubClaim(cc.id)} style={{ background: 'transparent', border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: C.textMuted, cursor: 'pointer' }}>
                Ta bort
              </button>
            </div>
          ))}

          {searchingClub && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid ' + C.border }}>
              <div style={{ fontSize: 12, color: C.textMuted, margin: '12px 0 10px' }}>Sök efter din klubb:</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[{ key: 'captain', label: 'Kapten' }, { key: 'admin', label: 'Admin' }, { key: 'board', label: 'Styrelse' }].map(r => (
                  <button key={r.key} onClick={() => setSelectedRole(r.key)}
                    style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid ' + (selectedRole === r.key ? C.accent : C.border), background: selectedRole === r.key ? C.accent + '18' : 'transparent', color: selectedRole === r.key ? C.accent : C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {r.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={clubSearchQ} onChange={e => setClubSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchClubs()}
                  placeholder="Klubbnamn..." style={{ flex: 1, background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none' }} />
                <button onClick={searchClubs} style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sök</button>
              </div>
              {clubSearchResults.map(t => {
                const alreadyClaimed = clubClaims.some(cc => cc.team_id === t.id)
                const ch = t.club.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
                const ctc = 'hsl(' + ch + ',50%,45%)'
                const ctclo = isDark ? 'hsl(' + ch + ',40%,15%)' : 'hsl(' + ch + ',40%,92%)'
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.surface, borderRadius: 10, border: '1px solid ' + C.border, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: ctclo, border: '1.5px solid ' + ctc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: ctc, flexShrink: 0 }}>
                      {t.club.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.club}</div>
                      {t.city && <div style={{ fontSize: 11, color: C.textMuted }}>{t.city}</div>}
                    </div>
                    <button onClick={() => claimClub(t)} disabled={claimingClub || alreadyClaimed}
                      style={{ background: alreadyClaimed ? C.surface : C.accent, color: alreadyClaimed ? C.textMuted : '#1a1400', border: alreadyClaimed ? '1px solid ' + C.border : 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: alreadyClaimed ? 'default' : 'pointer' }}>
                      {alreadyClaimed ? 'Redan kopplat' : 'Det är mitt lag'}
                    </button>
                  </div>
                )
              })}
              <button onClick={() => { setSearchingClub(false); setClubSearchResults([]); setClubSearchQ('') }}
                style={{ marginTop: 8, background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Avbryt
              </button>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button onClick={signOut}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid ' + C.border, cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} color='#e05555' />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e05555' }}>Logga ut</div>
        </button>

      </div>
    </main>
  )
}

function SectionHeader({ label }: { label: string }) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 16px 8px', borderBottom: '1px solid ' + C.border }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: C.textMuted, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>{label}</span>
    </div>
  )
}
