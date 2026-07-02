import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import OnboardingClient from './_components/OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <OnboardingClient />
}
