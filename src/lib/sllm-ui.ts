/** SLLM event hero display helpers. */

import type { CSSProperties } from 'react'

export function sllmBannerOverlayStyle(): CSSProperties {
  return {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)',
  }
}

export function sllmStatusColor(isLive: boolean): string {
  return isLive ? '#e05555' : '#f5c200'
}

export function sllmStatusPillStyle(isLive: boolean, statusColor: string): CSSProperties {
  return {
    background: `rgba(${isLive ? '224,85,85' : '245,194,0'},0.2)`,
    border: `1px solid ${statusColor}55`,
  }
}

export function sllmLiveDotGlowStyle(): CSSProperties {
  return { boxShadow: '0 0 5px #e05555' }
}

export function sllmStatusTextStyle(statusColor: string): CSSProperties {
  return { color: statusColor }
}

export function sllmPlayerAvatarStyle(pc: {
  bg: string
  border: string
  text: string
}): CSSProperties {
  return {
    background: pc.bg,
    border: `1.5px solid ${pc.border}`,
    color: pc.text,
  }
}

export function sllmPlayerChipStyle(pc: {
  bg: string
  border: string
  text: string
}): CSSProperties {
  return {
    color: pc.text,
    background: pc.bg,
    border: `1px solid ${pc.border}`,
  }
}
