import { SlutspelScoped, SLUTSPEL_SEASON_ID } from './_components/SlutspelScoped'

// The full SM-slutspel view, scoped by ?gender & ?season (no toggles) — reached
// from the SM-slutspel button on the Elitserien division page.
export default async function SmSlutspelPage({ searchParams }: { searchParams: Promise<{ gender?: string; season?: string }> }) {
  const sp = await searchParams
  const gender = sp?.gender === 'damer' ? 'damer' : 'herrar'
  const season = sp?.season ? Number(sp.season) : SLUTSPEL_SEASON_ID
  return <SlutspelScoped gender={gender} season={season} />
}
