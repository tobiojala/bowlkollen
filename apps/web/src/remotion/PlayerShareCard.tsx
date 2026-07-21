import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  spring,
  Img,
} from 'remotion'

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
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function PlayerShareCard({
  name, teamName, avg, bestSeries, over200, rating,
  tierLabel, tierAccent, tierGlow, tierBg, tierRarity, avatarUrl,
}: ShareCardProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // ── Entrance ──────────────────────────────────────────────────
  const bgOpacity  = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
  const cardScale  = spring({ frame, fps, config: { damping: 16, stiffness: 180 }, from: 0.82, to: 1 })
  const cardOpacity = interpolate(frame, [5, 18], [0, 1], { extrapolateRight: 'clamp' })

  // ── Stats count-up (frames 20–50) ─────────────────────────────
  const statProgress = interpolate(frame, [20, 52], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const dAvg     = Math.round(avg * statProgress)
  const dBest    = Math.round(bestSeries * statProgress)
  const dOver200 = Math.round(over200 * statProgress)
  const dRating  = Math.round(rating * statProgress)

  // ── Shimmer sweep (frames 28–58) ──────────────────────────────
  const shimmerX = interpolate(frame, [28, 60], [-320, 700], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const shimmerOpacity = interpolate(frame, [28, 34, 54, 60], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // ── Glow pulse (frames 55–75) ─────────────────────────────────
  const glowSize = interpolate(frame, [55, 65, 75], [30, 70, 30], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // ── Bottom text slide in (frames 50–70) ───────────────────────
  const textY = interpolate(frame, [50, 68], [30, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const textOpacity = interpolate(frame, [50, 66], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  const starCount = Math.round(rating / 20)
  const stars = '★'.repeat(starCount) + '☆'.repeat(5 - starCount)

  // Card dimensions inside 1080×1080
  const CARD_W = 420
  const CARD_H = 630
  const CARD_X = (1080 - CARD_W) / 2
  const CARD_Y = 140

  return (
    <AbsoluteFill style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Background */}
      <AbsoluteFill style={{
        opacity: bgOpacity,
        background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(20,30,55,1) 0%, #070d16 100%)',
      }} />

      {/* Subtle grid texture */}
      <AbsoluteFill style={{
        opacity: bgOpacity * 0.18,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '54px 54px',
      }} />

      {/* Tier glow behind card */}
      <div style={{
        position: 'absolute',
        left: CARD_X + CARD_W / 2 - 200,
        top: CARD_Y + CARD_H / 2 - 200,
        width: 400, height: 400,
        borderRadius: '50%',
        background: tierGlow,
        filter: `blur(${glowSize}px)`,
        opacity: cardOpacity * 0.9,
      }} />

      {/* ── TRADING CARD ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: CARD_X, top: CARD_Y,
        width: CARD_W, height: CARD_H,
        transform: `scale(${cardScale})`,
        transformOrigin: 'center center',
        opacity: cardOpacity,
        borderRadius: 28,
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #1a1400 0%, #0d1118 60%, #1a0a00 100%)',
        border: `2.5px solid ${tierAccent}`,
        boxShadow: `inset 0 0 60px ${tierGlow}, 0 0 60px ${tierGlow}`,
      }}>

        {/* Full-art avatar */}
        {avatarUrl ? (
          <Img src={avatarUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 160 }}>
            <div style={{ width: 160, height: 160, borderRadius: '50%', background: tierBg, border: `3px solid ${tierAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontWeight: 900, color: tierAccent }}>
              {initials(name)}
            </div>
          </div>
        )}

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.70) 62%, rgba(0,0,0,0.97) 100%)' }} />

        {/* Shimmer stripe */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: shimmerX, width: 120,
          background: `linear-gradient(90deg, transparent, ${tierAccent}aa, transparent)`,
          opacity: shimmerOpacity,
          transform: 'skewX(-12deg)',
        }} />

        {/* Card border inner */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: `2px solid ${tierAccent}`, boxShadow: `inset 0 0 40px ${tierGlow}`, pointerEvents: 'none' }} />

        {/* Top badges */}
        <div style={{ position: 'absolute', top: 18, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, padding: '5px 16px', borderRadius: 30, background: tierBg, border: `1px solid ${tierAccent}`, color: tierAccent }}>
            {tierLabel}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, fontWeight: 600 }}>2025/26</div>
        </div>

        {/* Bottom panel */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 22px 24px', background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: 0.2, lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: tierAccent, letterSpacing: 2, marginTop: 3, textTransform: 'uppercase' }}>{teamName}</div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {[{ v: dAvg, l: 'SNITT' }, { v: dBest, l: 'BÄSTA' }, { v: dOver200, l: '200+' }].map(s => (
              <div key={s.l} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 4px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 4, letterSpacing: 1.2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 18, letterSpacing: 2, color: tierAccent }}>{stars}</div>
              <div style={{ fontSize: 11, color: tierAccent, fontWeight: 700, marginTop: 2, letterSpacing: 1 }}>BK RATING {dRating}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', letterSpacing: 1 }}>{tierRarity}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: 2, marginTop: 2 }}>#001 / 500</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BRANDING ──────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: CARD_Y - 80, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: bgOpacity }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
          Bowl<span style={{ color: '#f5c200' }}>kollen</span>
        </div>
      </div>

      {/* ── BOTTOM TEXT ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: 0, right: 0,
        textAlign: 'center',
        transform: `translateY(${textY}px)`,
        opacity: textOpacity,
      }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.30)', letterSpacing: 3, fontWeight: 600 }}>
          BOWLKOLLEN.SE
        </div>
      </div>

    </AbsoluteFill>
  )
}
