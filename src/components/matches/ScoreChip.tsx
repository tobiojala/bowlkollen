'use client'

import { cn } from '@/lib/cn'

type ShareData = { playerName: string; matchLabel: string }

type Props = {
  score: number
  shareData?: ShareData
}

export function ScoreChip({ score, shareData }: Props) {
  if (!score) {
    return <span className="text-xl font-normal leading-none text-dark-muted/30">—</span>
  }

  const isElite = score >= 250
  const isGold = score >= 220 && score < 250
  const isGood = score >= 200 && score < 220
  const isShareable = score >= 220 && !!shareData

  const handleShare = () => {
    if (!shareData) return
    const text = `${shareData.playerName} rullade ${score} pinnar i ${shareData.matchLabel} 🎳`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Bowlkollen', text, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(`${text}\n${window.location.href}`)
    }
  }

  return (
    <div className="flex items-center gap-[5px]">
      <span
        className={cn(
          'leading-none font-black tabular-nums',
          isElite && 'text-[28px] text-white',
          isGold && 'text-[25px] text-gold',
          isGood && 'text-[23px] font-bold text-[#5a82b4]',
          !isElite && !isGold && !isGood && 'text-[21px] font-medium bk-text-primary',
        )}
        style={
          isElite
            ? { textShadow: '0 0 10px rgba(0,240,255,0.3), 0 0 24px rgba(0,240,255,0.15)' }
            : undefined
        }
      >
        {score}
      </span>
      {isShareable && (
        <button
          type="button"
          onClick={handleShare}
          title="Dela"
          className={cn(
            'cursor-pointer border-none bg-transparent p-0.5 text-[13px] leading-none [-webkit-tap-highlight-color:transparent]',
            isElite ? 'text-white/50' : 'text-gold/50',
          )}
        >
          ↗
        </button>
      )}
    </div>
  )
}
