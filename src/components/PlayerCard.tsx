'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/cn'
import {
  LEGEND_PARTICLES,
  buildPlayerCardHoloStyle,
  calcPlayerCardRating,
  getPlayerCardTier,
  playerCardBack,
  playerCardBackBody,
  playerCardBackFooter,
  playerCardBackFooterText,
  playerCardBackHeader,
  playerCardBackSectionTitle,
  playerCardBackStatLabel,
  playerCardBackStatRow,
  playerCardBackStatValue,
  playerCardBackStripe,
  playerCardBottomPanel,
  playerCardEmptyStars,
  playerCardExportHost,
  playerCardFace,
  playerCardFaceBack,
  playerCardFaceHidden,
  playerCardFlipInner,
  playerCardFooterRow,
  playerCardName,
  playerCardPerspective,
  playerCardPhoto,
  playerCardPhotoPlaceholder,
  playerCardRatingLabel,
  playerCardRarity,
  playerCardSeason,
  playerCardSerial,
  playerCardShimmer,
  playerCardStarDisplay,
  playerCardStatBox,
  playerCardStatGrid,
  playerCardStatLabel,
  playerCardStatValue,
  playerCardStars,
  playerCardTeam,
  playerCardTopRow,
  playerCardVignette,
  type PlayerCardTier,
} from '@/lib/player-card-ui'

const RemotionPlayer = dynamic(() => import('./RemotionPlayerEmbed'), { ssr: false })

type Props = {
  name: string
  teamName: string
  avatarUrl: string | null
  avg: number
  bestSeries: number
  over200: number
  matches: number
  division: string
  hand: string | null
  style: string | null
  ballBrand: string | null
  bio: string | null
  achievements?: string[]
  isDark: boolean
  isOwner: boolean
  onClose?: () => void
}

function initials(n: string) {
  return n
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

type FrontProps = {
  name: string
  teamName: string
  avatarUrl: string | null
  avg: number
  bestSeries: number
  over200: number
  tier: PlayerCardTier
  rating: number
  mousePos: { x: number; y: number }
  isHovered: boolean
  shimmerKey: number
}

function CardFront({
  name,
  teamName,
  avatarUrl,
  avg,
  bestSeries,
  over200,
  tier,
  rating,
  mousePos,
  isHovered,
  shimmerKey,
}: FrontProps) {
  const st = playerCardStarDisplay(rating)
  const hc = tier.holoColors

  return (
    <div className={playerCardFace} style={{ background: tier.cardBg }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} crossOrigin="anonymous" className={playerCardPhoto} />
      ) : (
        <div className={playerCardPhotoPlaceholder}>
          <div
            className="flex h-[90px] w-[90px] items-center justify-center rounded-full text-[30px] font-black tracking-tight"
            style={{
              background: `rgba(${hc[0]}, 0.12)`,
              border: `2px solid ${tier.borderColor}`,
              color: tier.accent,
            }}
          >
            {initials(name)}
          </div>
        </div>
      )}

      <div className={playerCardVignette} />
      <div style={buildPlayerCardHoloStyle(tier, mousePos, isHovered)} />
      <div
        key={shimmerKey}
        className={playerCardShimmer}
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tier.shimmerColor} 50%, transparent 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[18px]"
        style={{
          border: `1.5px solid ${tier.borderColor}`,
          boxShadow: `inset 0 0 28px ${tier.glowColor}, inset 0 1.5px 0 rgba(255,255,255,0.22)`,
        }}
      />

      <div className={playerCardTopRow}>
        <div
          className="rounded-full px-2.5 py-[3px] text-[7.5px] font-extrabold tracking-wide text-white"
          style={{
            background: tier.tierGradient,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            boxShadow: `0 2px 8px ${tier.glowColor}`,
          }}
        >
          {tier.label}
        </div>
        <div className={playerCardSeason}>2025/26</div>
      </div>

      {tier.particles &&
        LEGEND_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
              background: tier.accent,
              animation: `${i % 2 === 0 ? 'particleRise' : 'particleRise2'} ${2 + i * 0.4}s ease-out infinite`,
              animationDelay: p.delay,
              boxShadow: `0 0 4px ${tier.accent}`,
            }}
          />
        ))}

      <div className={playerCardBottomPanel} style={{ background: tier.panelBg }}>
        <div className={playerCardName}>{name}</div>
        <div className={playerCardTeam} style={{ color: tier.accent }}>
          {teamName}
        </div>

        <div className={playerCardStatGrid}>
          {[
            { v: avg > 0 ? avg : '—', l: 'SNITT' },
            { v: bestSeries || '—', l: 'BÄSTA' },
            { v: over200, l: '200+' },
          ].map(s => (
            <div key={s.l} className={playerCardStatBox}>
              <div className={playerCardStatValue}>{s.v}</div>
              <div className={playerCardStatLabel}>{s.l}</div>
            </div>
          ))}
        </div>

        <div className={playerCardFooterRow}>
          <div>
            <div className={playerCardStars}>
              <span style={{ color: tier.accent }}>{'★'.repeat(st.filled)}</span>
              <span className={playerCardEmptyStars}>{'★'.repeat(st.empty)}</span>
            </div>
            <div className={playerCardRatingLabel} style={{ color: tier.accent }}>
              BK RATING {rating}
            </div>
          </div>
          <div>
            <div className={playerCardRarity}>{tier.rarity}</div>
            <div className={playerCardSerial}>#001 / 500</div>
          </div>
        </div>
      </div>
    </div>
  )
}

type BackProps = {
  name: string
  teamName: string
  tier: PlayerCardTier
  avg: number
  bestSeries: number
  over200: number
  matches: number
  division: string
  hand: string | null
  style: string | null
  ballBrand: string | null
  achievements: string[]
  rating: number
}

function CardBack({
  tier,
  avg,
  bestSeries,
  over200,
  matches,
  division,
  hand,
  style: bStyle,
  ballBrand,
  achievements,
}: BackProps) {
  return (
    <div className={playerCardBack}>
      <div className={playerCardBackHeader} style={{ background: tier.topBg }}>
        <div className={playerCardBackStripe} />
        <div
          className="absolute right-0 bottom-0 left-0 h-px opacity-40"
          style={{ background: tier.borderColor }}
        />
        <div className="z-[2] text-[22px] font-black tracking-tight text-white">
          Bowl<span className="text-gold">kollen</span>
        </div>
      </div>

      <div className={playerCardBackBody}>
        <div
          className="rounded-[10px] border px-2.5 py-[7px]"
          style={{ background: tier.bg, borderColor: `${tier.borderColor}55` }}
        >
          <div className={playerCardBackSectionTitle} style={{ color: tier.accent }}>
            SÄSONGSSTATISTIK 2025/26
          </div>
          {(
            [
              ['Snittpoäng', avg > 0 ? avg : '—'],
              ['Bästa serie', bestSeries || '—'],
              ['200+ spel', over200],
              ['Matcher', matches],
              ['Division', division],
            ] as [string, string | number][]
          ).map(([l, v]) => (
            <div key={l} className={playerCardBackStatRow}>
              <span className={playerCardBackStatLabel}>{l}</span>
              <span className={playerCardBackStatValue}>{v}</span>
            </div>
          ))}
        </div>

        {achievements.length > 0 && (
          <div className="rounded-[10px] border border-white/8 bg-white/[0.03] px-2.5 py-[7px]">
            <div className={playerCardBackSectionTitle} style={{ color: tier.accent }}>
              MERITER
            </div>
            <div className="flex flex-wrap gap-[3px]">
              {achievements.map(a => (
                <span
                  key={a}
                  className="rounded-full px-1.5 py-0.5 text-[7px] font-semibold"
                  style={{ background: tier.bg, color: tier.accent }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[10px] border border-white/8 bg-white/[0.03] px-2.5 py-[7px]">
          <div className={cn(playerCardBackSectionTitle, 'text-white/30')}>SPELARPROFIL</div>
          {(
            [
              ['Hand', hand === 'right' ? 'Höger' : hand === 'left' ? 'Vänster' : '—'],
              ['Stil', bStyle || '—'],
              ['Klot', ballBrand || '—'],
            ] as [string, string][]
          ).map(([l, v]) => (
            <div key={l} className={playerCardBackStatRow}>
              <span className={playerCardBackStatLabel}>{l}</span>
              <span className={playerCardBackStatValue}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={playerCardBackFooter}>
        <span className={playerCardBackFooterText}>BOWLKOLLEN.SE</span>
        <span className={playerCardBackFooterText}>
          #001 / 500 · {tier.label}
        </span>
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-[18px]"
        style={{
          border: `1.5px solid ${tier.borderColor}`,
          boxShadow: `inset 0 0 25px ${tier.glowColor}`,
        }}
      />
    </div>
  )
}

export default function PlayerCard({
  name,
  teamName,
  avatarUrl,
  avg,
  bestSeries,
  over200,
  matches,
  division,
  hand,
  style: bStyle,
  ballBrand,
  achievements = [],
  isDark,
  isOwner,
  onClose,
}: Props) {
  const [flipped, setFlipped] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [isHovered, setIsHovered] = useState(false)
  const [shimmerKey, setShimmerKey] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  const rating = calcPlayerCardRating(avg, bestSeries, over200, avg > 0)
  const tier = getPlayerCardTier(rating)
  const st = playerCardStarDisplay(rating)

  useEffect(() => {
    const t = setInterval(() => setShimmerKey(k => k + 1), 4500)
    return () => clearInterval(t)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current || isFlipping) return
      const rect = cardRef.current.getBoundingClientRect()
      const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
      setMousePos({ x: mx, y: my })
      setTilt({ x: -(my - 0.5) * 18, y: (mx - 0.5) * 18 })
    },
    [isFlipping],
  )

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
    setMousePos({ x: 0.5, y: 0.5 })
    setIsHovered(false)
  }, [])

  const handleFlip = () => {
    setIsFlipping(true)
    setFlipped(f => !f)
    setTimeout(() => setIsFlipping(false), 750)
  }

  const baseRotY = flipped ? 180 : 0
  const tx = isFlipping ? 0 : tilt.x
  const ty = isFlipping ? 0 : tilt.y
  const cardTransition = isFlipping
    ? 'transform 720ms cubic-bezier(0.4,0.2,0.2,1)'
    : 'transform 80ms linear'

  const shareText = encodeURIComponent(
    `Kolla mitt Bowlkollen spelarkort! Snitt ${avg}, BK Rating ${rating} – ${tier.label} tier 🎳 bowlkollen.se`,
  )

  const getCardCanvas = async (side: 'front' | 'back') => {
    const html2canvas = (await import('html2canvas')).default
    const el = side === 'front' ? frontRef.current : backRef.current
    if (!el) return null
    return html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true, allowTaint: true })
  }

  const downloadCard = async () => {
    setDownloading(true)
    try {
      const fc = await getCardCanvas('front')
      if (fc) {
        const a = document.createElement('a')
        a.download = `${name.replace(/\s/g, '_')}_front.png`
        a.href = fc.toDataURL('image/png')
        a.click()
      }
      await new Promise(r => setTimeout(r, 200))
      const bc = await getCardCanvas('back')
      if (bc) {
        const a = document.createElement('a')
        a.download = `${name.replace(/\s/g, '_')}_back.png`
        a.href = bc.toDataURL('image/png')
        a.click()
      }
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  const shareToSocial = async (platform: string) => {
    const canvas = await getCardCanvas('front')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    if (platform === 'video') {
      setVideoOpen(v => !v)
      return
    }
    if (platform === 'download') {
      const a = document.createElement('a')
      a.download = `${name.replace(/\s/g, '_')}_card.png`
      a.href = dataUrl
      a.click()
    } else if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
        '_blank',
      )
    } else if (platform === 'x') {
      window.open(
        `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(window.location.href)}`,
        '_blank',
      )
    } else if (platform === 'instagram' || platform === 'tiktok') {
      const a = document.createElement('a')
      a.download = `${name.replace(/\s/g, '_')}_card.png`
      a.href = dataUrl
      a.click()
      alert(
        platform === 'instagram'
          ? 'Kortet har laddats ner! Öppna Instagram och dela det som en story eller post.'
          : 'Kortet har laddats ner! Öppna TikTok och använd det i ditt nästa klipp.',
      )
    }
    setShareOpen(false)
  }

  const sharedProps = {
    name,
    teamName,
    tier,
    avg,
    bestSeries,
    over200,
    matches,
    division,
    hand,
    style: bStyle,
    ballBrand,
    achievements,
    rating,
  }

  return (
    <div
      className={cn(
        'fixed top-0 right-0 bottom-0 z-100 flex w-full max-w-[360px] flex-col overflow-y-auto',
        'bg-light-bg shadow-[-4px_0_40px_rgba(0,0,0,0.4)] dark:bg-dark-bg',
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-between border-b px-5 py-4',
          'border-light-border dark:border-dark-border',
        )}
      >
        <div>
          <div className="text-[11px] font-bold tracking-widest text-dark-muted">SPELARKORT</div>
          <div className="mt-0.5 text-sm font-bold bk-text-primary">{name}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer border-0 bg-transparent px-2 py-1 text-2xl leading-none text-dark-muted"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col items-center gap-3.5 px-5 pt-7 pb-4">
        <div
          style={{
            filter: `drop-shadow(0 20px 36px rgba(0,0,0,0.55)) drop-shadow(0 4px 12px ${tier.glowColor})`,
          }}
        >
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleFlip}
            className={playerCardPerspective}
            style={{ perspective: 900 }}
          >
            <div
              className={playerCardFlipInner}
              style={{
                transform: `rotateX(${tx}deg) rotateY(${baseRotY + ty}deg)`,
                transition: cardTransition,
              }}
            >
              <div className={playerCardFaceHidden}>
                <CardFront
                  {...sharedProps}
                  avatarUrl={avatarUrl}
                  mousePos={mousePos}
                  isHovered={isHovered}
                  shimmerKey={shimmerKey}
                />
              </div>
              <div className={playerCardFaceBack}>
                <CardBack {...sharedProps} />
              </div>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-dark-muted">
          {flipped ? 'Klicka för att se framsidan' : 'Klicka för att vända kortet'}
        </div>
      </div>

      <div
        className="mx-5 mb-4 rounded-xl border p-3.5"
        style={{ background: tier.bg, borderColor: `${tier.borderColor}44` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold" style={{ color: tier.accent }}>
              {tier.label} tier
            </div>
            <div className="mt-0.5 text-[11px] text-dark-muted">BK Rating {rating} / 99</div>
          </div>
          <div className="text-xl tracking-widest">
            <span className="text-gold">{'★'.repeat(st.filled)}</span>
            <span className="text-light-border dark:text-dark-border">{'★'.repeat(st.empty)}</span>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-col gap-2.5 px-5 pb-6">
          <button
            type="button"
            onClick={() => setShareOpen(s => !s)}
            className="w-full cursor-pointer rounded-xl border px-3 py-3.25 text-[13px] font-bold"
            style={{
              background: tier.bg,
              borderColor: `${tier.borderColor}66`,
              color: tier.accent,
            }}
          >
            Dela kortet
          </button>
          {shareOpen && (
            <div
              className={cn(
                'overflow-hidden rounded-[14px] border',
                'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
              )}
            >
              {[
                {
                  platform: 'video',
                  label: 'Animerat kort (1080×1080)',
                  emoji: '🎬',
                  hint: 'Förhandsgranska & exportera',
                },
                {
                  platform: 'instagram',
                  label: 'Instagram',
                  emoji: '📸',
                  hint: 'Laddar ner PNG för Stories/Post',
                },
                {
                  platform: 'tiktok',
                  label: 'TikTok',
                  emoji: '🎵',
                  hint: 'Laddar ner PNG för TikTok',
                },
                { platform: 'facebook', label: 'Facebook', emoji: '👥', hint: 'Öppnar Facebook' },
                { platform: 'x', label: 'X / Twitter', emoji: '𝕏', hint: 'Öppnar X' },
                {
                  platform: 'download',
                  label: 'Ladda ner PNG',
                  emoji: '⬇',
                  hint: 'Framsida som PNG',
                },
              ].map((s, i) => (
                <button
                  key={s.platform}
                  type="button"
                  onClick={() => shareToSocial(s.platform)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3.25 text-left',
                    'hover:bg-black/5 dark:hover:bg-white/3',
                    i < 5 && 'border-b border-light-border dark:border-dark-border',
                  )}
                >
                  <span className="w-7 text-center text-xl">{s.emoji}</span>
                  <div>
                    <div className="text-[13px] font-semibold bk-text-primary">{s.label}</div>
                    <div className="text-[11px] text-dark-muted">{s.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {videoOpen && (
            <RemotionPlayer
              name={name}
              teamName={teamName}
              avg={avg}
              bestSeries={bestSeries}
              over200={over200}
              rating={rating}
              tierLabel={tier.label}
              tierAccent={tier.accent}
              tierGlow={tier.glowColor}
              tierBg={tier.bg}
              tierRarity={tier.rarity}
              avatarUrl={avatarUrl}
              isDark={isDark}
              playerName={name}
            />
          )}

          <button
            type="button"
            onClick={downloadCard}
            disabled={downloading}
            className={cn(
              'w-full cursor-pointer rounded-xl border px-3 py-3.25 text-[13px] font-semibold',
              'border-light-border text-dark-muted dark:border-dark-border',
              downloading && 'opacity-70',
            )}
          >
            {downloading ? 'Laddar ner...' : '⬇ Ladda ner framsida + baksida'}
          </button>
        </div>
      )}

      {!isOwner && (
        <div className="px-5 pb-6 text-center">
          <div className="text-xs text-dark-muted">
            Är det du? Claima profilen för att ladda ner och dela ditt kort.
          </div>
        </div>
      )}

      <div className={playerCardExportHost}>
        <div ref={frontRef}>
          <CardFront
            {...sharedProps}
            avatarUrl={avatarUrl}
            mousePos={{ x: 0.5, y: 0.5 }}
            isHovered={false}
            shimmerKey={0}
          />
        </div>
        <div ref={backRef}>
          <CardBack {...sharedProps} />
        </div>
      </div>
    </div>
  )
}
