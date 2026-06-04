/** Player profile display helpers (rating tiers, stats). */

export type PlayerTier = {
  label: string
  accent: string
  glow: string
  bg: string
  border: string
}

export function calcPlayerRating(
  avg: number,
  best: number,
  over200: number,
  hasData: boolean,
): number {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 40) * 0.4 + over200 * 1.5))
}

export function getPlayerTier(rating: number): PlayerTier {
  if (rating >= 95) {
    return {
      label: 'LEGEND',
      accent: '#f5c200',
      glow: 'rgba(245,194,0,0.40)',
      bg: 'rgba(245,194,0,0.10)',
      border: 'rgba(245,194,0,0.55)',
    }
  }
  if (rating >= 85) {
    return {
      label: 'ELITE',
      accent: '#b8a9f0',
      glow: 'rgba(127,119,221,0.35)',
      bg: 'rgba(127,119,221,0.10)',
      border: 'rgba(127,119,221,0.50)',
    }
  }
  if (rating >= 75) {
    return {
      label: 'PRO',
      accent: '#5dcaa5',
      glow: 'rgba(29,158,117,0.30)',
      bg: 'rgba(29,158,117,0.10)',
      border: 'rgba(29,158,117,0.45)',
    }
  }
  if (rating >= 60) {
    return {
      label: 'VETERAN',
      accent: '#ef9f27',
      glow: 'rgba(186,117,23,0.28)',
      bg: 'rgba(186,117,23,0.10)',
      border: 'rgba(186,117,23,0.45)',
    }
  }
  return {
    label: 'ROOKIE',
    accent: '#8899aa',
    glow: 'rgba(100,120,160,0.20)',
    bg: 'rgba(100,120,160,0.08)',
    border: 'rgba(100,120,160,0.35)',
  }
}

export function scoreGameColor(score: number): string {
  if (score >= 250) return '#5a82b4'
  if (score >= 200) return '#f5c200'
  return 'rgba(160,175,200,0.32)'
}
