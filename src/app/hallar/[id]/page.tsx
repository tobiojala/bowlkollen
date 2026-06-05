'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { HallPageSkeleton } from '@/components/hallar/HallPageSkeleton'
import { HallHero } from '@/components/hallar/HallHero'
import { HallInfoSection } from '@/components/hallar/HallInfoSection'
import { HallInfoRow } from '@/components/hallar/HallInfoRow'
import { hallAddress, type HallDetail } from '@/lib/hall-ui'

export default function HallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [hall, setHall] = useState<HallDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient()
      .from('bowling_centers')
      .select('*')
      .eq('id', parseInt(id))
      .single()
      .then(({ data }) => {
        setHall(data as HallDetail)
        setLoading(false)
      })
  }, [id])

  if (loading) return <HallPageSkeleton />

  if (!hall) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-sm text-dark-muted">Hallen hittades inte</p>
      </main>
    )
  }

  const address = hallAddress(hall)
  const mapsUrl = address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : null

  return (
    <main className="min-h-screen bg-light-bg pb-12 font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <HallHero hall={hall} onBack={() => router.back()} />

      <div className="flex flex-col gap-4 px-4 py-5">
        <HallInfoSection title="Kontakt" delay={0.18}>
          {address && <HallInfoRow label="Adress" value={address} href={mapsUrl ?? undefined} />}
          {hall.phone && <HallInfoRow label="Telefon" value={hall.phone} href={`tel:${hall.phone}`} />}
          {hall.email && <HallInfoRow label="E-post" value={hall.email} href={`mailto:${hall.email}`} />}
          {hall.website && <HallInfoRow label="Hemsida" value="Öppna" href={hall.website} />}
        </HallInfoSection>

        {(hall.machine_type || hall.lane_type || hall.oil_machine) && (
          <HallInfoSection title="Teknisk info" delay={0.24}>
            {hall.machine_type && <HallInfoRow label="Maskintyp" value={hall.machine_type} />}
            {hall.lane_type && <HallInfoRow label="Bantyp" value={hall.lane_type} />}
            {hall.oil_machine && <HallInfoRow label="Oljemaskinstyp" value={hall.oil_machine} />}
          </HallInfoSection>
        )}

        {(hall.inspection_status || hall.inspection_date) && (
          <HallInfoSection title="Besiktning" delay={0.3}>
            {hall.inspection_status && (
              <HallInfoRow label="Status" value={hall.inspection_status} />
            )}
            {hall.inspection_date && <HallInfoRow label="Datum" value={hall.inspection_date} />}
          </HallInfoSection>
        )}
      </div>
    </main>
  )
}
