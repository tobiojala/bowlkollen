import NyheterClient from './_components/NyheterClient'

// Team Anslagstavla (message board + polls). Team-private via RLS/RPC gating;
// NyheterClient redirects to /login when there's no session.
export default async function NyheterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NyheterClient teamId={Number(id)} />
}
