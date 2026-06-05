'use client'

import { useRef, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { cn } from '@/lib/cn'
import { PlayerShareCard, type ShareCardProps } from '@/remotion/PlayerShareCard'

type Props = ShareCardProps & { isDark: boolean; playerName: string }

export default function RemotionPlayerEmbed(props: Props) {
  const playerRef = useRef<PlayerRef>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState(false)

  const captureFrame = async () => {
    if (!previewRef.current) return
    setCapturing(true)
    try {
      playerRef.current?.seekTo(75)
      await new Promise(r => setTimeout(r, 80))

      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      })
      const a = document.createElement('a')
      a.download = `${props.playerName.replace(/\s/g, '_')}_1080.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (e) {
      console.error(e)
    }
    setCapturing(false)
  }

  const inputProps: ShareCardProps = {
    name: props.name,
    teamName: props.teamName,
    avg: props.avg,
    bestSeries: props.bestSeries,
    over200: props.over200,
    rating: props.rating,
    tierLabel: props.tierLabel,
    tierAccent: props.tierAccent,
    tierGlow: props.tierGlow,
    tierBg: props.tierBg,
    tierRarity: props.tierRarity,
    avatarUrl: props.avatarUrl,
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div
        ref={previewRef}
        className="overflow-hidden rounded-xl border border-white/10"
      >
        <Player
          ref={playerRef}
          component={PlayerShareCard}
          inputProps={inputProps}
          durationInFrames={90}
          compositionWidth={1080}
          compositionHeight={1080}
          fps={30}
          className="block aspect-square w-full"
          controls
          loop
          playbackRate={1}
          initiallyShowControls={false}
          clickToPlay
        />
      </div>

      <button
        type="button"
        onClick={captureFrame}
        disabled={capturing}
        className={cn(
          'w-full cursor-pointer rounded-[10px] border border-white/15 bg-transparent px-3 py-[11px]',
          'text-[13px] font-semibold text-dark-muted',
          capturing && 'cursor-not-allowed opacity-70',
        )}
      >
        {capturing ? 'Exporterar...' : '⬇ Ladda ner bild (1080×1080)'}
      </button>

      <p className="text-center text-[10px] leading-snug text-white/25">
        Klicka på förhandsvisningen för att spela. MP4-export via Remotion CLI kommer snart.
      </p>
    </div>
  )
}
