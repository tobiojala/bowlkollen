'use client'

import Link from 'next/link'
import Image from 'next/image'
import { COLOR, FONT } from '@/lib/brand'
import { TIER_COLOR, divisionTier } from '@/lib/division-standings'
import FollowButton from '@/components/FollowButton'
import type { PlayerHit, TeamHit, DivisionHit } from './queries'

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

// Stable per-club tint so avatars aren't a wall of identical gray
export function clubHue(club: string | null): string {
  if (!club) return COLOR.surface2
  const hash = [...club].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)
  return `hsl(${((hash % 360) + 360) % 360}, 22%, 24%)`
}

export function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
      color: COLOR.ink4, paddingTop: 20, paddingBottom: 10 }}>
      {label}
    </div>
  )
}

// ── Player card (2-col grid) ──────────────────────────────────────────────────

export function PlayerCard({ p }: { p: PlayerHit }) {
  const venue    = p.lastVenue ?? (p.lastDate ? formatDate(p.lastDate) : null)
  const activity = [p.lastTotal ? `${p.lastTotal} i serie` : null, venue].filter(Boolean).join(' · ')

  return (
    <div style={{ background: COLOR.surface, borderRadius: 16, padding: '14px',
      display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Link href={`/players/${p.id}`} style={{ textDecoration: 'none',
        display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: clubHue(p.teamName),
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.ink2, letterSpacing: -0.5 }}>
            {initials(p.name)}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, lineHeight: 1.25,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {p.name}
          </div>
          {p.teamName && (
            <div style={{ fontSize: 11, color: COLOR.ink4, marginTop: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.teamName}
            </div>
          )}
        </div>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: COLOR.ink3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activity}
        </div>
        <FollowButton entityType="player" entityId={p.id} size="sm" />
      </div>
    </div>
  )
}

// ── Search result rows ────────────────────────────────────────────────────────

export function PlayerRow({ p }: { p: PlayerHit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: `1px solid ${COLOR.hairline}` }}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: clubHue(p.teamName),
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink2 }}>{initials(p.name)}</span>
      </div>
      <Link href={`/players/${p.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        {p.teamName && (
          <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 2 }}>{p.teamName}</div>
        )}
      </Link>
      <FollowButton entityType="player" entityId={p.id} size="sm" />
    </div>
  )
}

export function TeamRow({ t }: { t: TeamHit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: `1px solid ${COLOR.hairline}` }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: COLOR.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        overflow: 'hidden', position: 'relative' }}>
        {t.logoUrl ? (
          <Image src={t.logoUrl} alt={t.clubName ?? t.name} fill style={{ objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 9, fontWeight: 800, color: COLOR.ink4, letterSpacing: 1 }}>LAG</span>
        )}
      </div>
      <Link href={`/clubs/${t.bitsClubId}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
        <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 2 }}>
          {t.clubName ? `${t.clubName} · ` : ''}klubbsida →
        </div>
      </Link>
      <FollowButton entityType="team" entityId={String(t.bitsTeamId)} size="sm" />
    </div>
  )
}

export function DivisionRow({ d }: { d: DivisionHit }) {
  const color = TIER_COLOR[divisionTier(d.name)] ?? COLOR.ink3
  return (
    <Link href={`/divisioner/${d.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
        borderBottom: `1px solid ${COLOR.hairline}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: COLOR.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
          <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 2 }}>Division · tabell & matcher</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={COLOR.ink4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  )
}

// ── Entry card (Seriespel section) ────────────────────────────────────────────

export function EntryCard({ href, icon, title, subtitle }: {
  href: string; icon: React.ReactNode; title: string; subtitle: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14,
        background: COLOR.surface, borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12,
          background: 'rgba(245,194,0,0.10)', border: '1px solid rgba(245,194,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink }}>{title}</div>
          <div style={{ fontSize: 12, color: COLOR.ink3, marginTop: 2 }}>{subtitle}</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={COLOR.ink4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  )
}

// ── Shelf rows: veckans serier + mest följda ──────────────────────────────────

export function SeriesRow({ rank, id, name, clubName, total, venue }: {
  rank: number; id: string; name: string; clubName: string | null; total: number; venue: string | null
}) {
  const isTop = rank === 1
  return (
    <Link href={`/players/${id}`} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
        borderBottom: `1px solid ${COLOR.hairline}` }}>
        <span style={{ width: 18, fontFamily: FONT.display, fontSize: 15, fontWeight: 900,
          color: isTop ? COLOR.gold : COLOR.ink4, textAlign: 'center', flexShrink: 0 }}>
          {rank}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 11, color: COLOR.ink4, marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[clubName, venue].filter(Boolean).join(' · ')}
          </div>
        </div>
        <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900,
          color: isTop ? COLOR.gold : COLOR.ink, flexShrink: 0 }}>
          {total}
        </span>
      </div>
    </Link>
  )
}

export function FollowedRow({ id, name, clubName, followers }: {
  id: string; name: string; clubName: string | null; followers: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
      borderBottom: `1px solid ${COLOR.hairline}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 18, background: clubHue(clubName),
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.ink2 }}>{initials(name)}</span>
      </div>
      <Link href={`/players/${id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 11, color: COLOR.ink4, marginTop: 1 }}>
          {[clubName, `${followers} följare`].filter(Boolean).join(' · ')}
        </div>
      </Link>
      <FollowButton entityType="player" entityId={id} size="sm" />
    </div>
  )
}
