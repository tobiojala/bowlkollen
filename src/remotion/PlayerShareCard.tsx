import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  spring,
  Img,
} from 'remotion'
import {
  SHARE_CARD_LAYOUT,
  shareCardAvatarImgStyle,
  shareCardBgStyle,
  shareCardBottomCtaStyle,
  shareCardBottomCtaTextStyle,
  shareCardBottomPanelStyle,
  shareCardBrandingGoldStyle,
  shareCardBrandingTextStyle,
  shareCardBrandingWrapStyle,
  shareCardFooterRowStyle,
  shareCardFrameStyle,
  shareCardGridStyle,
  shareCardInitialsCircleStyle,
  shareCardInitialsWrapStyle,
  shareCardInnerBorderStyle,
  shareCardNameStyle,
  shareCardRatingStyle,
  shareCardRootStyle,
  shareCardRarityColStyle,
  shareCardRarityStyle,
  shareCardSeasonStyle,
  shareCardSerialStyle,
  shareCardShimmerStyle,
  shareCardStarsStyle,
  shareCardStatBoxStyle,
  shareCardStatGridStyle,
  shareCardStatLabelStyle,
  shareCardStatValueStyle,
  shareCardTeamStyle,
  shareCardTierBadgeStyle,
  shareCardTierGlowStyle,
  shareCardTopRowStyle,
  shareCardVignetteStyle,
} from './player-share-card-ui'

export type ShareCardProps = {
  name: string
  teamName: string
  avg: number
  bestSeries: number
  over200: number
  rating: number
  tierLabel: string
  tierAccent: string
  tierGlow: string
  tierBg: string
  tierRarity: string
  avatarUrl: string | null
}

function initials(n: string) {
  return n
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function PlayerShareCard({
  name,
  teamName,
  avg,
  bestSeries,
  over200,
  rating,
  tierLabel,
  tierAccent,
  tierGlow,
  tierBg,
  tierRarity,
  avatarUrl,
}: ShareCardProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 180 },
    from: 0.82,
    to: 1,
  })
  const cardOpacity = interpolate(frame, [5, 18], [0, 1], { extrapolateRight: 'clamp' })

  const statProgress = interpolate(frame, [20, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const dAvg = Math.round(avg * statProgress)
  const dBest = Math.round(bestSeries * statProgress)
  const dOver200 = Math.round(over200 * statProgress)
  const dRating = Math.round(rating * statProgress)

  const shimmerX = interpolate(frame, [28, 60], [-320, 700], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const shimmerOpacity = interpolate(frame, [28, 34, 54, 60], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const glowSize = interpolate(frame, [55, 65, 75], [30, 70, 30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const textY = interpolate(frame, [50, 68], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const textOpacity = interpolate(frame, [50, 66], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const starCount = Math.round(rating / 20)
  const stars = '★'.repeat(starCount) + '☆'.repeat(5 - starCount)

  const { cardW, cardH, cardX, cardY } = SHARE_CARD_LAYOUT

  return (
    <AbsoluteFill style={shareCardRootStyle()}>
      <AbsoluteFill style={shareCardBgStyle(bgOpacity)} />
      <AbsoluteFill style={shareCardGridStyle(bgOpacity)} />

      <div
        style={shareCardTierGlowStyle({
          cardX,
          cardY,
          cardW,
          cardH,
          tierGlow,
          glowSize,
          cardOpacity,
        })}
      />

      <div
        style={shareCardFrameStyle({
          cardX,
          cardY,
          cardW,
          cardH,
          cardScale,
          cardOpacity,
          tierAccent,
          tierGlow,
        })}
      >
        {avatarUrl ? (
          <Img src={avatarUrl} style={shareCardAvatarImgStyle()} />
        ) : (
          <div style={shareCardInitialsWrapStyle()}>
            <div style={shareCardInitialsCircleStyle(tierBg, tierAccent)}>{initials(name)}</div>
          </div>
        )}

        <div style={shareCardVignetteStyle()} />
        <div style={shareCardShimmerStyle(shimmerX, shimmerOpacity, tierAccent)} />
        <div style={shareCardInnerBorderStyle(tierAccent, tierGlow)} />

        <div style={shareCardTopRowStyle()}>
          <div style={shareCardTierBadgeStyle(tierBg, tierAccent)}>{tierLabel}</div>
          <div style={shareCardSeasonStyle()}>2025/26</div>
        </div>

        <div style={shareCardBottomPanelStyle()}>
          <div style={shareCardNameStyle()}>{name}</div>
          <div style={shareCardTeamStyle(tierAccent)}>{teamName}</div>

          <div style={shareCardStatGridStyle()}>
            {[
              { v: dAvg, l: 'SNITT' },
              { v: dBest, l: 'BÄSTA' },
              { v: dOver200, l: '200+' },
            ].map(s => (
              <div key={s.l} style={shareCardStatBoxStyle()}>
                <div style={shareCardStatValueStyle()}>{s.v}</div>
                <div style={shareCardStatLabelStyle()}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={shareCardFooterRowStyle()}>
            <div>
              <div style={shareCardStarsStyle(tierAccent)}>{stars}</div>
              <div style={shareCardRatingStyle(tierAccent)}>BK RATING {dRating}</div>
            </div>
            <div style={shareCardRarityColStyle()}>
              <div style={shareCardRarityStyle()}>{tierRarity}</div>
              <div style={shareCardSerialStyle()}>#001 / 500</div>
            </div>
          </div>
        </div>
      </div>

      <div style={shareCardBrandingWrapStyle(cardY, bgOpacity)}>
        <div style={shareCardBrandingTextStyle()}>
          Bowl<span style={shareCardBrandingGoldStyle()}>kollen</span>
        </div>
      </div>

      <div style={shareCardBottomCtaStyle(textY, textOpacity)}>
        <div style={shareCardBottomCtaTextStyle()}>BOWLKOLLEN.SE</div>
      </div>
    </AbsoluteFill>
  )
}
