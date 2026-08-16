import PrepClient from './_components/PrepClient'

// Prep sheet (Prepare pillar): notes + hall recall for one fixture. Auth-scoped
// data via RLS; PrepClient redirects to /login when there's no session.
export default async function PrepPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  return <PrepClient matchId={Number(matchId)} />
}
