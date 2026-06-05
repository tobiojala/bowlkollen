/** Hall detail page helpers. */

import type { CSSProperties } from 'react'

export const HALL_SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

export function hallHeroGradient(dark: boolean): string {
  return dark
    ? 'linear-gradient(160deg, rgba(245,194,0,0.10) 0%, #0B1528 60%)'
    : 'linear-gradient(160deg, rgba(245,194,0,0.07) 0%, #f5f2ec 60%)'
}

export function hallHeroBgStyle(dark: boolean): CSSProperties {
  return { background: hallHeroGradient(dark) }
}

export type HallDetail = {
  id: number
  name: string
  city: string | null
  street_address: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  region: string | null
  lanes: number | null
  machine_type: string | null
  lane_type: string | null
  oil_machine: string | null
  online_scoring: boolean
  online_scoring_url: string | null
  online_booking: boolean
  online_booking_url: string | null
  accepts_gift_cards: boolean
  inspection_status: string | null
  inspection_date: string | null
}

export function hallAddress(hall: HallDetail): string {
  const cityPart =
    hall.postal_code && hall.city ? `${hall.postal_code} ${hall.city}` : hall.city
  return [hall.street_address, cityPart].filter(Boolean).join(', ')
}
