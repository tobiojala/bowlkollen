import MedlemmarClient from './_components/MedlemmarClient'

// Team members + role back office. Team-private via RLS/RPC gating; the client
// redirects to /login without a session and shows a members-only notice otherwise.
export default async function MedlemmarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MedlemmarClient teamId={Number(id)} />
}
