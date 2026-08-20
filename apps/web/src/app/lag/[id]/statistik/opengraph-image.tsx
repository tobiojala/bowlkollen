import { ImageResponse } from 'next/og'
import { getTeamStatsServer } from '@/lib/team-stats-server'
import { renderTeamStatsCard, CARD_SIZE } from '@/lib/team-stats-card'

// Link-preview card — shown when the public stats URL is posted to socials / chat.
// The same card is downloadable/shareable as a file at statistik/card.
export const size = CARD_SIZE
export const contentType = 'image/png'
export const alt = 'Lagstatistik · Bowlkollen'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getTeamStatsServer(Number(id))
  if (!data) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#0b0d10', color: 'rgba(244,245,247,0.56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
        Bowlkollen · Lagstatistik
      </div>,
      CARD_SIZE,
    )
  }
  return renderTeamStatsCard(data.name, data.stats)
}
