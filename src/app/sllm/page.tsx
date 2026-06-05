'use client'

import { useState, useEffect } from 'react'
import { SLLMHero } from '@/components/sllm/SLLMHero'
import { SLLMActionStrip } from '@/components/sllm/SLLMActionStrip'
import { SLLMStatsRow } from '@/components/sllm/SLLMStatsRow'
import { SLLMPlayerList } from '@/components/sllm/SLLMPlayerList'
import { SLLM_DEMO_PLAYERS, type SllmPlayer } from '@/lib/sllm-data'

export default function SLLMPage() {
  const [players, setPlayers] = useState<SllmPlayer[]>([])
  const [apiReady, setApiReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // API access pending — bowlres.se partnership
    setLoading(false)
    setApiReady(false)
    // When API is ready, replace the above with:
    // fetch('/api/sllm').then(r => r.json()).then(data => {
    //   if (data.html) { setPlayers(parseSllmPlayers(data.html)); setApiReady(true) }
    //   setLoading(false)
    // })
  }, [])

  const display = apiReady ? players : SLLM_DEMO_PLAYERS
  const swedish = display.filter(p => p.country === 'SWE')
  const nations = new Set(display.map(p => p.country)).size

  return (
    <main className="min-h-screen bg-light-bg pb-6 font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <div className="mx-auto max-w-app">
        <SLLMHero />
        <SLLMActionStrip />
        <SLLMStatsRow
          loading={loading}
          total={display.length}
          swedish={swedish.length}
          nations={nations}
        />
        <SLLMPlayerList players={display} apiReady={apiReady} />
      </div>
    </main>
  )
}
