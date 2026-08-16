'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Users, Ticket, LogOut, UserPlus, Clock, BadgeCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useSession, usePlayerBitsResults, useFollows } from '@/lib/queries'
import { buildProfileFromBitsRows } from '@/lib/profile-adapter'
import { SEASON } from '@/lib/constants'
import ClaimPanel from './_components/ClaimPanel'

// Dark, native-matching palette (mirrors PlayerProfileView so /profile and the
// full /players/[id] page it doorways into read as one surface).
const BG = '#0b0d10'
const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'
const GOLD = '#f5c200'
const GREEN = '#30d47e'
const RED = '#e05555'
const SURFACE = '#14171c'
const SURFACE2 = '#1c2127'
const HAIR = 'rgba(244,245,247,0.08)'

type Claim = { id: string; publicId: string; status: string; name: string; club: string | null }
type ClaimRow = {
  id: string; player_id: string; status: string
  player: { first_name: string; sur_name: string; club_name: string | null } | null
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function ProfilePage() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [claimLoaded, setClaimLoaded] = useState(false)
  const [showClaim, setShowClaim] = useState(false)

  const fetchClaim = useCallback(async () => {
    if (!session) return
    const { data } = await createClient()
      .from('player_claims')
      .select('id, player_id, status, player:player_id(first_name, sur_name, club_name)')
      .eq('user_id', session.user.id)
      .maybeSingle()
    const row = data as unknown as ClaimRow | null
    setClaim(row ? {
      id: row.id, publicId: row.player_id, status: row.status,
      name: row.player ? `${row.player.first_name} ${row.player.sur_name}`.trim() : 'Min spelarprofil',
      club: row.player?.club_name ?? null,
    } : null)
    setClaimLoaded(true)
    setShowClaim(false)
  }, [session])

  useEffect(() => { if (session) fetchClaim() }, [session, fetchClaim])
  useEffect(() => { if (!sessionLoading && !session) window.location.href = '/login' }, [sessionLoading, session])

  const verified = claim?.status === 'verified'
  const publicId = verified ? claim!.publicId : ''
  const { data: bitsRows = [] } = usePlayerBitsResults(publicId)
  const { data: follows = [] } = useFollows()

  const currRows = bitsRows.filter((r) => r.matchDate >= SEASON.CURRENT)
  const activeRows = currRows.length ? currRows : bitsRows
  const stats = verified && activeRows.length ? buildProfileFromBitsRows(activeRows) : null

  const signOut = async () => { await createClient().auth.signOut(); window.location.href = '/' }

  if (sessionLoading || !session) return <main style={{ minHeight: '100vh', background: BG }} />

  const meta = session.user.user_metadata ?? {}
  const email = session.user.email ?? ''
  const accountName = (typeof meta.full_name === 'string' && meta.full_name) || email || 'Bowlare'
  const avatarUrl = typeof meta.avatar_url === 'string' ? meta.avatar_url : null
  const displayName = verified ? claim!.name : accountName
  const sub = verified ? (claim!.club ?? 'Min spelarprofil') : email

  const identityInner = (
    <>
      {avatarUrl ? (
        <Image src={avatarUrl} alt={displayName} width={60} height={60} style={{ borderRadius: '50%', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: SURFACE2, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: GOLD, letterSpacing: -0.5 }}>{initials(displayName)}</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          {verified && <BadgeCheck size={18} color={GOLD} fill={GOLD} fillOpacity={0.18} />}
        </div>
        <div style={{ fontSize: 14, color: INK3, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
      {verified && <ChevronRight size={22} color={INK4} />}
    </>
  )

  const identityStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14, padding: '16px', textDecoration: 'none',
    background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 16,
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px',
    textDecoration: 'none', color: INK, borderBottom: `1px solid ${HAIR}`,
  }

  return (
    <main style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: "var(--font-body,'DM Sans'),system-ui" }}>
      <div style={{ padding: '20px 16px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, margin: '4px 4px 8px' }}>Profil</h1>

        {/* Identity — your claimed player if verified (doorway to full profile) */}
        {verified ? (
          <Link href={`/players/${claim!.publicId}`} style={identityStyle}>{identityInner}</Link>
        ) : (
          <div style={identityStyle}>{identityInner}</div>
        )}

        {/* Season snapshot — another doorway to the full player page */}
        {verified && stats && (
          <Link href={`/players/${claim!.publicId}`}
            style={{ display: 'flex', textDecoration: 'none', background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 16, padding: '16px 8px' }}>
            <Snap value={stats.seasonAvg ? String(stats.seasonAvg) : '–'} label="SNITT" />
            <Divider />
            <Snap value={String(stats.matches.length)} label="MATCHER" />
            <Divider />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
                <span style={{ fontFamily: "var(--font-score,'Sora'),system-ui", fontSize: 24, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                  {stats.recentAvg ? String(stats.recentAvg) : '–'}
                </span>
                {!!stats.formDiff && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: stats.formDiff > 0 ? GREEN : RED }}>
                    {stats.formDiff > 0 ? '▲' : '▼'} {Math.abs(stats.formDiff)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: '0.08em', marginTop: 4 }}>FORM</div>
            </div>
          </Link>
        )}

        {/* Claim CTA / pending / inline connect flow */}
        {claimLoaded && !claim && !showClaim && (
          <button onClick={() => setShowClaim(true)}
            style={{ ...identityStyle, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={22} color={GOLD} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Koppla din spelarprofil</div>
              <div style={{ fontSize: 14, color: INK3, marginTop: 2 }}>Hitta dig själv för att se din statistik och rating.</div>
            </div>
            <ChevronRight size={20} color={INK4} />
          </button>
        )}
        {claimLoaded && !claim && showClaim && (
          <div style={{ background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 16, padding: 16 }}>
            <ClaimPanel onClaimed={fetchClaim} />
          </div>
        )}
        {claim?.status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 16, padding: '14px 16px' }}>
            <Clock size={18} color={INK3} />
            <span style={{ fontSize: 14, color: INK2 }}>Din spelarkoppling väntar på granskning.</span>
          </div>
        )}

        {/* KONTO */}
        <div style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.1em', padding: '20px 4px 8px' }}>KONTO</div>
        <div style={{ background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 16, overflow: 'hidden' }}>
          <Link href="/following" style={rowStyle}>
            <Users size={22} color={INK2} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Följer</span>
            <span style={{ fontSize: 15, color: INK3, fontVariantNumeric: 'tabular-nums' }}>{follows.length}</span>
            <ChevronRight size={18} color={INK4} />
          </Link>
          <Link href="/invite" style={rowStyle}>
            <Ticket size={22} color={INK2} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Lös in inbjudningskod</span>
            <ChevronRight size={18} color={INK4} />
          </Link>
          <button onClick={signOut} style={{ ...rowStyle, borderBottom: 'none', width: '100%', background: 'none', cursor: 'pointer' }}>
            <LogOut size={22} color={INK2} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600, textAlign: 'left' }}>Logga ut</span>
          </button>
        </div>
      </div>
    </main>
  )
}

function Snap({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: "var(--font-score,'Sora'),system-ui", fontSize: 24, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, background: HAIR, alignSelf: 'stretch', margin: '2px 0' }} />
}
