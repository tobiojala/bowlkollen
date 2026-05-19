import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// Blocklist of reserved routes
const BLOCKED_SLUGS = new Set([
  'schema', 'league', 'teams', 'players', 'tavlingar', 'sllm',
  'login', 'admin', 'matches', 'reset-password', 'api', 'live',
  'hem', 'about', 'settings', 'profile', 'register', 'signup',
  'pricing', 'help', 'support', 'contact', 'terms', 'privacy',
  'blog', 'news', 'search', 'explore', 'feed', 'home', 'app',
  'auth', 'oauth', 'callback', 'verify', 'confirm', 'invite',
  'join', 'upgrade', 'billing', 'subscribe', 'cancel', 'success',
  'error', '404', '500', 'maintenance', 'status', 'health',
  'robots', 'sitemap', 'favicon', 'manifest', 'sw', 'service-worker',
  'static', 'assets', 'images', 'fonts', 'icons', 'css', 'js',
  'bowlkollen', 'sbf', 'bits', 'swebowl', 'lanetalk', 'bowlres',
])

type Props = { params: Promise<{ slug: string }> }

export default async function SlugPage({ params }: Props) {
  const { slug } = await params

  // Check blocklist
  if (BLOCKED_SLUGS.has(slug.toLowerCase())) {
    notFound()
  }

  // Look up team by slug
  const supabase = createClient()
  const { data: team } = await supabase
    .from('teams')
    .select('id, slug')
    .eq('slug', slug)
    .single()

  if (!team) {
    notFound()
  }

  // Redirect to the team page
  redirect('/teams/' + team.id)
}
