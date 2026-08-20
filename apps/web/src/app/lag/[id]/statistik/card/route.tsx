import { getTeamStatsServer } from '@/lib/team-stats-server'
import { renderTeamStatsCard } from '@/lib/team-stats-card'

// The sponsor share card as a real PNG file — fetched as a blob for
// navigator.share({ files }), or opened/saved directly. Same art as the OG
// link-preview, so a shared image and a shared link look identical.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getTeamStatsServer(Number(id))
  if (!data) return new Response('Not found', { status: 404 })
  return renderTeamStatsCard(data.name, data.stats, { 'Cache-Control': 'public, max-age=300' })
}
