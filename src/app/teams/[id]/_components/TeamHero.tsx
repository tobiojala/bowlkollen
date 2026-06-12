'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Globe, Mail, Share2, Link as LinkIcon } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { teamColor, teamInitials, shortName } from '@/lib/utils'
import { divisionColor } from '@/lib/divisions'
import FollowButton from '@/components/FollowButton'
import type { Team, Match } from '@/lib/types'

type ClubTeam = { id: string; name: string; club_slug: string | null; team_path: string | null }

type Props = {
  team: Team
  id: string
  isAdmin: boolean
  completed: Match[]
  upcoming: Match[]
  clubLogoUrl: string | null
  clubTeams: ClubTeam[]
  hasSession: boolean
  todayMatch: Match | null
  onEditClick: () => void
}

export default function TeamHero({
  team, id, isAdmin, completed, upcoming,
  clubLogoUrl, clubTeams, hasSession, todayMatch, onEditClick,
}: Props) {
  const { C, isDark } = useColors()
  const [logoFailed, setLogoFailed] = useState(false)
  const [copied,     setCopied]     = useState(false)

  const tc  = teamColor(team.name, isDark)
  const ini = teamInitials(team.name)
  const hue = (team.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360

  const isHome   = (m: Match) => m.home_team_id === id
  const wins     = completed.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
  const losses   = completed.filter(m => isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!).length
  const draws    = completed.filter(m => m.home_score === m.away_score).length
  const pts      = wins * 2 + draws
  const last5    = [...completed].slice(0, 5).map(m => {
    const won  = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
    const lost = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
    return won ? 'V' : lost ? 'F' : 'O'
  })

  const division = completed[0]?.division || upcoming[0]?.division || null
  const divC     = divisionColor(division)
  const fColor   = (f: string) => f === 'V' ? C.green : f === 'F' ? '#e05555' : C.muted

  const heroGrad = isDark
    ? `linear-gradient(160deg, hsl(${hue},40%,7%) 0%, hsl(${hue},52%,16%) 55%, hsl(${hue},40%,9%) 100%)`
    : `linear-gradient(160deg, hsl(${hue},28%,93%) 0%, hsl(${hue},44%,79%) 55%, hsl(${hue},28%,90%) 100%)`

  const overlayColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,'

  const copyLink = () => {
    const url = team.slug ? window.location.origin + '/' + team.slug : window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section style={{ background: heroGrad }}>
      {/* Top bar: back + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
        <Link href="/teams" style={{ fontSize: 12, color: overlayColor + '0.50)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Alla lag
        </Link>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={copyLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: overlayColor + '0.12)', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: overlayColor + '0.65)', cursor: 'pointer' }}>
            <Share2 size={11} /> {copied ? 'Kopierad!' : 'Dela'}
          </button>
          {isAdmin && (
            <button onClick={onEditClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: overlayColor + '0.12)', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: overlayColor + '0.65)', cursor: 'pointer' }}>
              ✏ Redigera
            </button>
          )}
        </div>
      </div>

      {/* Logo + identity */}
      <div style={{ padding: '28px 20px 0' }}>
        <div style={{ width: 88, height: 88, borderRadius: 22, overflow: 'hidden', marginBottom: 18, flexShrink: 0, background: clubLogoUrl && !logoFailed ? overlayColor + '0.10)' : tc.bg, border: `2.5px solid ${clubLogoUrl && !logoFailed ? overlayColor + '0.18)' : tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: tc.text }}>
          {clubLogoUrl && !logoFailed
            ? <Image src={clubLogoUrl} alt={team.name} width={88} height={88} onError={() => setLogoFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />
            : ini}
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, color: isDark ? '#fff' : '#111', margin: '0 0 8px', lineHeight: 1.15 }}>
          {shortName(team.name)}
        </h1>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const, marginBottom: team.description ? 10 : 16 }}>
          {division && <span style={{ fontSize: 11, fontWeight: 700, color: divC, background: divC + '22', borderRadius: 8, padding: '3px 10px' }}>{division}</span>}
          {team.city  && <span style={{ fontSize: 12, color: overlayColor + '0.55)' }}>{team.city}</span>}
          {team.home_hall && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f5c200' }}>
              <MapPin size={10} color="#f5c200" />{team.home_hall}
            </span>
          )}
        </div>

        {team.description && (
          <p style={{ fontSize: 13, color: overlayColor + '0.58)', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.55, maxWidth: 420 }}>
            "{team.description}"
          </p>
        )}

        {/* Social links */}
        {(team.website || team.instagram || team.contact_email) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16 }}>
            {team.website      && <a href={team.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: tc.text, background: overlayColor + '0.14)', border: '1px solid ' + overlayColor + '0.18)', borderRadius: 20, padding: '4px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Globe size={10} />Webb</a>}
            {team.instagram    && <a href={'https://instagram.com/' + team.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: tc.text, background: overlayColor + '0.14)', border: '1px solid ' + overlayColor + '0.18)', borderRadius: 20, padding: '4px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}><LinkIcon size={10} />@{team.instagram}</a>}
            {team.contact_email && <a href={'mailto:' + team.contact_email} style={{ fontSize: 11, color: tc.text, background: overlayColor + '0.14)', border: '1px solid ' + overlayColor + '0.18)', borderRadius: 20, padding: '4px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Mail size={10} />Kontakt</a>}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16 }}>
          <FollowButton teamId={id} type="team" isDark={isDark} />
          {hasSession && (
            <Link href={'/team/' + id + '/intern'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.accent, color: '#1a1400', borderRadius: 20, padding: '8px 16px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              Lagets sida →
            </Link>
          )}
          <Link href={'/compare/teams/' + id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: overlayColor + '0.12)', color: overlayColor + '0.65)', borderRadius: 20, padding: '8px 16px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Jämför
          </Link>
        </div>

        {/* Club sibling teams */}
        {clubTeams.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 20 }}>
            <span style={{ fontSize: 10, color: overlayColor + '0.40)', alignSelf: 'center' }}>Fler lag:</span>
            {clubTeams.map(ct => {
              const label = ct.team_path === 'herrar' ? 'Herrar' : ct.team_path === 'damer' ? 'Damer' : ct.team_path === 'allsvenskan' ? 'Allsvenskan' : ct.name
              const url   = ct.club_slug && ct.team_path ? '/' + ct.club_slug + '/' + ct.team_path : '/teams/' + ct.id
              return (
                <Link key={ct.id} href={url} style={{ fontSize: 11, fontWeight: 700, color: overlayColor + '0.65)', background: overlayColor + '0.10)', border: '1px solid ' + overlayColor + '0.15)', borderRadius: 20, padding: '4px 12px', textDecoration: 'none' }}>
                  {label} ›
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Match day banner */}
      {todayMatch && (() => {
        const isHome = todayMatch.home_team_id === id
        const opp    = isHome ? todayMatch.away : todayMatch.home
        return (
          <div style={{ margin: '0 20px 16px', background: 'linear-gradient(135deg, ' + C.accent + '22, ' + C.accent + '10)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 16, border: '1px solid ' + C.accent + '40', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, boxShadow: '0 0 8px ' + C.accent, flexShrink: 0, animation: 'pulse 2s infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: C.accent, letterSpacing: 2 }}>MATCHDAG</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#fff' : '#111', marginTop: 1 }}>
                {isHome ? 'Hemma' : 'Borta'} mot {opp.name}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Stats strip — frosted glass */}
      {completed.length > 0 && (
        <div style={{ margin: '0 20px 28px', background: overlayColor + '0.18)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid ' + overlayColor + '0.12)', padding: '14px 8px 10px' } as React.CSSProperties}>
          <div style={{ display: 'flex' }}>
            {[
              { label: 'Spelade',    value: completed.length, color: isDark ? '#fff' : '#111' },
              { label: 'Vunna',      value: wins,             color: C.green },
              { label: 'Oavgjorda', value: draws,             color: overlayColor + '0.45)' },
              { label: 'Förlorade', value: losses,            color: '#e05555' },
              { label: 'Poäng',     value: pts,               color: C.accent },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', borderRight: i < 4 ? '1px solid ' + overlayColor + '0.12)' : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 8, color: overlayColor + '0.42)', marginTop: 3, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          {last5.length > 0 && (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12 }}>
              {last5.map((f, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 800, color: fColor(f), background: fColor(f) + '25', border: '1px solid ' + fColor(f) + '55', borderRadius: 20, padding: '3px 9px', letterSpacing: 0.5 }}>{f}</span>
              ))}
              <span style={{ fontSize: 9, color: overlayColor + '0.35)', alignSelf: 'center', marginLeft: 4 }}>senaste 5</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
