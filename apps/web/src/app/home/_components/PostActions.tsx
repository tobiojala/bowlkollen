'use client'

import { Heart, Send, Bookmark } from 'lucide-react'
import { COLOR, SPACE, TYPE } from '@/lib/brand'

const btn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center' }

// Instagram-style action row for a feed post: like (+ count) + share left, save
// right. Controlled — state comes from the feed_reactions store.
export function PostActions({
  postKey, liked, saved, likeCount, onLike, onSave, shareMessage, shareUrl,
}: {
  postKey: string
  liked: boolean
  saved: boolean
  likeCount: number
  onLike: (key: string, liked: boolean) => void
  onSave: (key: string, saved: boolean) => void
  shareMessage: string
  shareUrl?: string
}) {
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); fn() }
  const share = () => {
    if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ text: shareMessage, url: shareUrl }).catch(() => {})
    else if (shareUrl && navigator.clipboard) navigator.clipboard.writeText(shareUrl).catch(() => {})
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACE[1] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[6] }}>
        <button onClick={stop(() => onLike(postKey, liked))} aria-label="Gilla" style={btn}>
          <Heart size={24} color={liked ? COLOR.red : COLOR.ink2} fill={liked ? COLOR.red : 'none'} />
          {likeCount > 0 && <span style={{ marginLeft: 6, fontSize: TYPE.caption, fontWeight: 700, color: COLOR.ink2, fontVariantNumeric: 'tabular-nums' }}>{likeCount}</span>}
        </button>
        <button onClick={stop(share)} aria-label="Dela" style={btn}>
          <Send size={24} color={COLOR.ink2} />
        </button>
      </div>
      <button onClick={stop(() => onSave(postKey, saved))} aria-label="Spara" style={btn}>
        <Bookmark size={24} color={saved ? COLOR.gold : COLOR.ink2} fill={saved ? COLOR.gold : 'none'} />
      </button>
    </div>
  )
}
