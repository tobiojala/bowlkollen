'use client'

import Link from 'next/link'
import { MapPin, Camera, Loader2, Check, ExternalLink } from 'lucide-react'
import FollowButton from '@/components/FollowButton'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { teamColors } from '@/lib/team-ui'
import type { PlayerTier } from '@/lib/player-ui'
import {
  playerAvatarRingStyle,
  playerInitialsAvatarStyle,
  playerTierAccentStyle,
  playerTierBannerStyle,
  playerTierChipStyle,
  playerTierFilledStyle,
  playerTrendStyle,
} from '@/lib/player-ui'

type Player = {
  id: string
  name: string
  bio: string | null
  hometown: string | null
  avatar_url: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
}

type Props = {
  player: Player
  team: { id: string; name: string } | null
  tier: PlayerTier
  rating: number
  hasStats: boolean
  formTrend: 'up' | 'down' | 'neutral' | null
  trendColor: string
  isOwner: boolean
  editing: boolean
  onEdit: () => void
  playerId: string
  uploadingAvatar: boolean
  onAvatarUpload: (file: File) => void
  onOpenCard: () => void
  onOpenCompare: () => void
  dark: boolean
}

export function PlayerHero({
  player,
  team,
  tier,
  rating,
  hasStats,
  formTrend,
  trendColor,
  isOwner,
  editing,
  onEdit,
  playerId,
  uploadingAvatar,
  onAvatarUpload,
  onOpenCard,
  onOpenCompare,
  dark,
}: Props) {
  const { accent: tc, bg: tclo } = teamColors(player.name, dark)
  const initials = player.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative">
      <div className="h-[100px] border-b" style={playerTierBannerStyle(tier, dark)} />

      <div className="-mt-7 px-5">
        <div className="flex items-end justify-between">
          <div className="relative shrink-0">
            {player.avatar_url ? (
              <img
                src={player.avatar_url}
                alt={player.name}
                className="h-[88px] w-[88px] rounded-full object-cover"
                style={playerAvatarRingStyle(tier)}
              />
            ) : (
              <div
                className="flex h-[88px] w-[88px] items-center justify-center rounded-full text-[26px] font-black"
                style={playerInitialsAvatarStyle(tier, tclo, tc)}
              >
                {initials}
              </div>
            )}
            {isOwner && (
              <label
                className="absolute right-0.5 bottom-0.5 flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full shadow-md"
                style={playerTierFilledStyle(tier)}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-[13px] w-[13px] animate-spin text-[#1a1400]" />
                ) : (
                  <Camera size={13} className="text-[#1a1400]" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && onAvatarUpload(e.target.files[0])}
                />
              </label>
            )}
          </div>

          <div className="flex gap-2 pb-2">
            {isOwner && !editing && (
              <button
                type="button"
                onClick={onEdit}
                className="cursor-pointer rounded-full border border-light-border bg-transparent px-4 py-[7px] text-[13px] font-semibold bk-text-primary dark:border-dark-border"
              >
                Redigera
              </button>
            )}
            {!isOwner && <FollowButton playerId={playerId} type="player" size="sm" isDark={dark} />}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-black tracking-tight bk-text-primary">{player.name}</h1>
            {isOwner && (
              <span className="inline-flex items-center gap-1 rounded-md bg-green/15 px-[7px] py-0.5 text-[10px] font-bold text-green">
                <Check size={9} />
                Din profil
              </span>
            )}
          </div>

          {hasStats && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className="rounded-full border px-[9px] py-[3px] text-[10px] font-extrabold tracking-wide"
                style={playerTierChipStyle(tier)}
              >
                {tier.label}
              </span>
              <span className="text-xs font-bold" style={playerTierAccentStyle(tier)}>
                BK Rating {rating}
              </span>
              {formTrend && (
                <span className="text-[13px]" style={playerTrendStyle(trendColor)}>
                  {formTrend === 'up' ? '↑' : formTrend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {team && (
              <Link href={`/teams/${team.id}`} className="text-sm font-semibold text-gold no-underline">
                {shortName(team.name)}
              </Link>
            )}
            {player.hometown && (
              <span className="inline-flex items-center gap-1 text-[13px] text-dark-muted">
                <MapPin size={12} />
                {player.hometown}
              </span>
            )}
          </div>

          {player.bio && !editing && (
            <p className="mt-2.5 text-[13px] leading-relaxed text-dark-muted">{player.bio}</p>
          )}

          {(player.instagram || player.facebook || player.youtube) && (
            <div className="mt-2.5 flex gap-2.5">
              {player.instagram && (
                <a
                  href={`https://instagram.com/${player.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.25 text-xs text-dark-muted no-underline"
                >
                  <ExternalLink size={12} />@{player.instagram}
                </a>
              )}
              {player.facebook && (
                <a
                  href={player.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.25 text-xs text-dark-muted no-underline"
                >
                  <ExternalLink size={12} />
                  Facebook
                </a>
              )}
              {player.youtube && (
                <a
                  href={player.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.25 text-xs text-dark-muted no-underline"
                >
                  <ExternalLink size={12} />
                  YouTube
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 mb-1 flex gap-2">
          <button
            type="button"
            onClick={onOpenCard}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.25 rounded-full border py-2 text-[13px] font-bold"
            style={playerTierChipStyle(tier)}
          >
            🃏 Spelarkort
          </button>
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-full border border-gold/30 bg-gold/8 py-2 text-[13px] font-bold text-gold"
          >
            ⚔ H2H
          </button>
        </div>
      </div>
    </div>
  )
}
