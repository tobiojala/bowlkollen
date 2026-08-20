import { redirect } from 'next/navigation'

// Retired. The old slug-based club page ran on the deprecated legacy `teams`
// tables + the old theme. The canonical club page is now BITS-native at
// /clubs/[bitsId] (reached from teams/team pages). Send stragglers to the browse.
export default function LegacyClubSlugPage() {
  redirect('/teams')
}
