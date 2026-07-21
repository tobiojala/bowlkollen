'use client'

import { useRef, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
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
      // Pause at a good frame (frame 75 — animation settled, shimmer done)
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
      a.download = props.playerName.replace(/\s/g, '_') + '_1080.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (e) {
      console.error(e)
    }
    setCapturing(false)
  }

  const inputProps: ShareCardProps = {
    name:       props.name,
    teamName:   props.teamName,
    avg:        props.avg,
    bestSeries: props.bestSeries,
    over200:    props.over200,
    rating:     props.rating,
    tierLabel:  props.tierLabel,
    tierAccent: props.tierAccent,
    tierGlow:   props.tierGlow,
    tierBg:     props.tierBg,
    tierRarity: props.tierRarity,
    avatarUrl:  props.avatarUrl,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Preview */}
      <div ref={previewRef} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
        <Player
          ref={playerRef}
          component={PlayerShareCard}
          inputProps={inputProps}
          durationInFrames={90}
          compositionWidth={1080}
          compositionHeight={1080}
          fps={30}
          style={{ width: '100%', aspectRatio: '1 / 1', display: 'block' }}
          controls
          loop
          playbackRate={1}
          initiallyShowControls={false}
          clickToPlay={true}
        />
      </div>

      {/* Capture button */}
      <button
        onClick={captureFrame}
        disabled={capturing}
        style={{
          width: '100%', padding: '11px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          color: '#8899aa', cursor: 'pointer', opacity: capturing ? 0.7 : 1,
        }}
      >
        {capturing ? 'Exporterar...' : '⬇ Ladda ner bild (1080×1080)'}
      </button>

      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5 }}>
        Klicka på förhandsvisningen för att spela. MP4-export via Remotion CLI kommer snart.
      </div>
    </div>
  )
}
