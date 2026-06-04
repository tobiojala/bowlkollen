'use client'

import { MapPin, Globe, Mail, Link as LinkIcon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import FollowButton from '@/components/FollowButton'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { teamColors } from '@/lib/team-ui'

type Team = {
  id: string
  name: string
  city: string | null
  slug: string | null
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  home_hall: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
}

type ClubTeam = {
  id: string
  name: string
  team_path?: string
  club_slug?: string
}

type EditFields = Record<string, string>

type Props = {
  team: Team
  teamId: string
  division: string | null
  divisionColor: string
  clubLogoUrl: string | null
  logoFailed: boolean
  onLogoError: () => void
  copied: boolean
  onCopyLink: () => void
  isAdmin: boolean
  editingTeam: boolean
  onToggleEdit: () => void
  teamEdit: EditFields
  onTeamEditChange: (key: string, value: string) => void
  onSaveTeam: () => void
  savingTeam: boolean
  onCancelEdit: () => void
  clubTeams: ClubTeam[]
}

const EDIT_FIELDS = [
  { label: 'Beskrivning', key: 'description', placeholder: 'Berätta om laget...', type: 'textarea' as const },
  { label: 'Stad', key: 'city', placeholder: 'T.ex. Stockholm' },
  { label: 'Hemmaplan', key: 'home_hall', placeholder: 'T.ex. Nässjö Bowling' },
  { label: 'Kontakt email', key: 'contact_email', placeholder: 'kapten@klubb.se' },
  { label: 'Telefon', key: 'contact_phone', placeholder: '+46 70 123 45 67' },
  { label: 'Webbplats', key: 'website', placeholder: 'https://...' },
  { label: 'Instagram', key: 'instagram', placeholder: 'användarnamn' },
  { label: 'Facebook', key: 'facebook', placeholder: 'https://facebook.com/...' },
]

export function TeamHero({
  team,
  teamId,
  division,
  divisionColor: divColor,
  clubLogoUrl,
  logoFailed,
  onLogoError,
  copied,
  onCopyLink,
  isAdmin,
  editingTeam,
  onToggleEdit,
  teamEdit,
  onTeamEditChange,
  onSaveTeam,
  savingTeam,
  onCancelEdit,
  clubTeams,
}: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const { accent: tc, bg: tclo } = teamColors(team.name, dark)
  const ini = shortName(team.name)
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

  return (
    <>
      <div
        className={cn(
          'px-5 pb-5 pt-6',
          dark
            ? 'bg-linear-to-br from-[#0d1a2e] to-[#1a2840]'
            : 'bg-linear-to-br from-[#e8f0f8] to-[#d0e0f0]',
        )}
      >
        <a
          href="/teams"
          className="mb-5 inline-flex items-center gap-1 text-xs text-dark-muted no-underline"
        >
          ← Alla lag
        </a>
        <div className="flex items-center gap-4">
          <div
            className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-black"
            style={{
              background:
                clubLogoUrl && !logoFailed
                  ? dark
                    ? 'rgba(255,255,255,0.07)'
                    : '#fff'
                  : tclo,
              border:
                clubLogoUrl && !logoFailed
                  ? dark
                    ? '1px solid rgba(255,255,255,0.12)'
                    : '1px solid rgba(0,0,0,0.10)'
                  : `2.5px solid ${tc}`,
              color: tc,
            }}
          >
            {clubLogoUrl && !logoFailed ? (
              <img
                src={clubLogoUrl}
                alt={team.name}
                onError={onLogoError}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              ini
            )}
          </div>
          <div>
            <h1 className="mb-1 text-[22px] font-black leading-tight bk-text-primary">
              {shortName(team.name)}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              {team.city && <span className="text-xs text-dark-muted">{team.city}</span>}
              {division && (
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{ color: divColor, background: `${divColor}22` }}
                >
                  {division}
                </span>
              )}
            </div>
            {team.home_hall && (
              <div className="mt-1.5 inline-flex items-center gap-1.25 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1">
                <MapPin size={11} className="text-gold" />
                <span className="text-[11px] font-bold tracking-wide text-gold">{team.home_hall}</span>
              </div>
            )}
            {team.slug && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-dark-muted">bowlkollen.vercel.app/{team.slug}</span>
                <button
                  type="button"
                  onClick={onCopyLink}
                  className={cn(
                    'rounded-md border px-2.5 py-[3px] text-[10px] font-bold',
                    copied
                      ? 'border-green/40 bg-green/15 text-green'
                      : 'border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
                  )}
                >
                  {copied ? '✓ Kopierad' : 'Kopiera'}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onToggleEdit}
                    className={cn(
                      'rounded-md border px-2.5 py-[3px] text-[10px] font-bold',
                      editingTeam
                        ? 'border-gold/40 bg-gold/15 text-gold'
                        : 'border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
                    )}
                  >
                    {editingTeam ? '✕ Stang' : '✏️ Redigera'}
                  </button>
                )}
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap gap-2">
              <a
                href={`/team/${teamId}/intern`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-xs font-bold text-[#1a1400] no-underline"
              >
                Till lagets sida →
              </a>
              <a
                href={`/compare/teams/${teamId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold/35 px-3.5 py-1.5 text-xs font-bold text-gold no-underline"
              >
                Jämför →
              </a>
            </div>

            <FollowButton teamId={teamId} type="team" isDark={dark} />

            {clubTeams.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[10px] text-dark-muted">Fler lag:</span>
                {clubTeams.map(ct => {
                  const label =
                    ct.team_path === 'herrar'
                      ? 'Herrar'
                      : ct.team_path === 'damer'
                        ? 'Damer'
                        : ct.team_path === 'allsvenskan'
                          ? 'Allsvenskan'
                          : ct.name
                  const url =
                    ct.club_slug && ct.team_path
                      ? `/${ct.club_slug}/${ct.team_path}`
                      : `/teams/${ct.id}`
                  return (
                    <a
                      key={ct.id}
                      href={url}
                      className="flex items-center gap-1 rounded-full border border-light-border bg-light-card px-3 py-1 text-[11px] font-bold bk-text-primary no-underline dark:border-dark-border dark:bg-dark-card"
                    >
                      {label} ›
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {team.description && !editingTeam && (
        <p className="border-b border-light-border px-5 py-3.5 text-[13px] leading-relaxed text-dark-muted italic dark:border-dark-border">
          &ldquo;{team.description}&rdquo;
        </p>
      )}

      {(team.home_hall || team.website || team.instagram || team.contact_email) && !editingTeam && (
        <div className="flex flex-wrap gap-2 border-b border-light-border px-5 py-2.5 dark:border-dark-border">
          {team.home_hall && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-light-border bg-light-card px-2.5 py-[3px] text-[11px] text-dark-muted dark:border-dark-border dark:bg-dark-card">
              <MapPin size={10} />
              {team.home_hall}
            </span>
          )}
          {team.website && (
            <a
              href={team.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-light-border bg-light-card px-2.5 py-[3px] text-[11px] text-gold no-underline dark:border-dark-border dark:bg-dark-card"
            >
              <Globe size={10} />
              Webbplats
            </a>
          )}
          {team.instagram && (
            <a
              href={`https://instagram.com/${team.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-light-border bg-light-card px-2.5 py-[3px] text-[11px] text-dark-muted no-underline dark:border-dark-border dark:bg-dark-card"
            >
              <LinkIcon size={10} />@{team.instagram}
            </a>
          )}
          {team.contact_email && (
            <a
              href={`mailto:${team.contact_email}`}
              className="inline-flex items-center gap-1 rounded-lg border border-light-border bg-light-card px-2.5 py-[3px] text-[11px] text-dark-muted no-underline dark:border-dark-border dark:bg-dark-card"
            >
              <Mail size={10} />
              {team.contact_email}
            </a>
          )}
        </div>
      )}

      {editingTeam && isAdmin && (
        <div
          className={cn(
            'border-b border-light-border px-5 py-4 dark:border-dark-border',
            dark ? 'bg-[#0d1a2e]' : 'bg-[#f0f4f8]',
          )}
        >
          <div className="mb-3.5 text-xs font-extrabold tracking-wide text-gold">REDIGERA LAGSIDA</div>
          {EDIT_FIELDS.map(f => (
            <div key={f.key} className="mb-3">
              <label className="mb-1 block text-[10px] font-bold tracking-wide text-dark-muted uppercase">
                {f.label}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  value={teamEdit[f.key] || ''}
                  onChange={e => onTeamEditChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className="box-border w-full resize-y rounded-[10px] border border-light-border bg-light-card px-3 py-2 text-[13px] bk-text-primary outline-none dark:border-dark-border dark:bg-dark-card"
                />
              ) : (
                <input
                  value={teamEdit[f.key] || ''}
                  onChange={e => onTeamEditChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="box-border w-full rounded-[10px] border border-light-border bg-light-card px-3 py-2 text-[13px] bk-text-primary outline-none dark:border-dark-border dark:bg-dark-card"
                />
              )}
            </div>
          ))}
          <div className="mt-1 flex gap-2">
            <Button className="flex-1" onClick={onSaveTeam} disabled={savingTeam}>
              {savingTeam ? 'Sparar...' : 'Spara'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={onCancelEdit}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
