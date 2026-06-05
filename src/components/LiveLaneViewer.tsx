'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  streamUrl: string
  matchName?: string
}

type ScoringData = {
  alleyID: string
  lanes: number
  session: string
  screenfolders: string[]
}

function buildImageUrl(alleyID: string, folder: string, lane: number, bust: number) {
  return `https://scoring.se/${alleyID}/${folder}/${lane}_small.jpg?nocache=${bust}`
}

function getMobileUrl(url: string) {
  const alleyMatch = url.match(/alley=(\d+)/)
  if (alleyMatch) {
    return `https://scoring.se/mobile/scoring.asp?alley=${alleyMatch[1]}`
  }
  return url
}

export default function LiveLaneViewer({ streamUrl }: Props) {
  const [data, setData] = useState<ScoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bust, setBust] = useState(Math.floor(Math.random() * 99999))
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeLanes, setActiveLanes] = useState<number | null>(null)

  useEffect(() => {
    const mobileUrl = getMobileUrl(streamUrl)
    fetch('/api/scoring?url=' + encodeURIComponent(mobileUrl))
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(e => {
        setError(String(e))
        setLoading(false)
      })
  }, [streamUrl])

  useEffect(() => {
    if (!data) return
    const interval = setInterval(() => {
      setBust(Math.floor(Math.random() * 99999))
      setLastUpdate(new Date())
    }, 3000)
    return () => clearInterval(interval)
  }, [data])

  if (loading) {
    return (
      <div className="p-6 text-center text-[13px] text-dark-muted">Ansluter till live scoring...</div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <div className="mb-3 text-[13px] text-dark-muted">Kunde inte ansluta till scoring.se</div>
        <a
          href={streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-bold text-gold no-underline"
        >
          Oppna i scoring.se istallet &#8599;
        </a>
      </div>
    )
  }

  const totalLanes = data.lanes
  const displayLanes = activeLanes || totalLanes

  const laneOptions = [4, 8, totalLanes].filter(
    (v, i, a) => a.indexOf(v) === i && v <= totalLanes,
  )

  const isLaneActive = (n: number) =>
    activeLanes === n || (activeLanes === null && n === totalLanes)

  return (
    <div>
      <div className="flex items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <span className="bk-scoring-pulse inline-block h-2 w-2 rounded-full bg-[#e05555]" />
          <span className="text-[13px] font-bold bk-text-primary">Live Scoring</span>
          {lastUpdate && (
            <span className="text-[10px] text-dark-muted">
              Uppdaterad{' '}
              {lastUpdate.toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-dark-muted">Visa banor:</span>
          {laneOptions.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setActiveLanes(n === totalLanes && activeLanes === null ? null : n)}
              className={cn(
                'cursor-pointer rounded-md border px-2 py-0.5 text-[11px] font-bold',
                '[-webkit-tap-highlight-color:transparent]',
                isLaneActive(n)
                  ? 'border-gold/30 bg-gold text-[#1a1400]'
                  : 'border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
              )}
            >
              {n}
            </button>
          ))}
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-[11px] font-bold text-gold no-underline"
          >
            Fullskarm &#8599;
          </a>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: displayLanes }, (_, i) => i + 1).map(lane => {
            const folder = data.screenfolders[lane]
            if (!folder) return null
            const imgUrl = buildImageUrl(data.alleyID, folder, lane, bust)
            return (
              <div
                key={lane}
                className="relative overflow-hidden rounded-lg border border-light-border bg-black dark:border-dark-border"
              >
                <div className="absolute top-1 left-1 z-[1] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Bana {lane}
                </div>
                <img
                  src={imgUrl}
                  alt={'Bana ' + lane}
                  className="block w-full"
                  onError={e => {
                    e.currentTarget.classList.add('opacity-30')
                  }}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-2.5 text-center text-[10px] text-dark-muted">
          Bilder fran scoring.se &middot; Uppdateras var 3:e sekund &middot; {totalLanes} banor totalt
        </div>
      </div>
    </div>
  )
}
