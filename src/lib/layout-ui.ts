/** Shared layout / skeleton display helpers. */

import type { CSSProperties } from 'react'

export function skeletonBoneWidthStyle(widthPct: number): CSSProperties {
  return { width: `${widthPct}%` }
}

export function skeletonOverlapStyle(offsetPx: number): CSSProperties {
  return { marginTop: offsetPx }
}
