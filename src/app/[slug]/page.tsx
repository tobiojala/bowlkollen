import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const BLOCKED = new Set([
  'schema','league','teams','players','tavlingar','sllm','login','admin',
  'matches','reset-password','api','live','hem','about','settings','profile',
  'register','signup','pricing','help','support','contact','terms','privacy',
  'blog','news','search','explore','feed','home','app','auth','oauth',
  'callback','verify','confirm','invite','join','upgrade','billing',
  'subscribe','cancel','success','error','maintenance','status','health',
  'robots','sitemap','favicon','manifest','sw','static','assets',
  'bowlkollen','sbf','bits','swebowl','lanetalk','bowlres',
  'auth','debug','confirm','callback',
  'auth','debug','confirm','callback',
])

type Props = { params: Promise<{ slug: string }> }

export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  if (BLOCKED.has(slug.toLowerCase())) notFound()

  const supabase = createClient()

  // Find teams with this club_slug
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, club_slug, team_path')
    .eq('club_slug', slug)

  if (!teams || teams.length === 0) notFound()

  // Single team — redirect directly to team page
  if (teams.length === 1) {
    redirect('/teams/' + teams[0].id)
  }

  // Multiple teams — redirect to club overview
  redirect('/club/' + slug)
}
