import KlotClient from './_components/KlotClient'

// Klotdatabas — the ball catalog (bowwwl.com feed), browse + add to arsenal. Catalog
// is public read; adding requires a session. Client-rendered like the other Mina spel
// tools (session-gated, not an SEO page).
export default function KlotPage() {
  return <KlotClient />
}
