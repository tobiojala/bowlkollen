import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Props = { params: Promise<{ slug: string }> }

export default async function InternRedirect({ params }: Props) {
  const { slug } = await params
  const supabase = createClient()
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('club_slug', slug)
    .single()

  if (!team) notFound()
  redirect('/team/' + team.id + '/intern')
}
