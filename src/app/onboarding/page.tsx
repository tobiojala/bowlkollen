import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { verifyInviteCookie } from '@/lib/invite-cookie'
import OnboardingClient from './_components/OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If they arrived via a team-scoped invite link, skip the generic team
  // picker and go straight to claiming — the vouch already happened.
  const cookieStore  = await cookies()
  const inviteCode   = verifyInviteCookie(cookieStore.get('bk_invite')?.value ?? '')
  let inviteTeam: { id: number; name: string } | null = null

  if (inviteCode) {
    const { data } = await supabase.rpc('get_invite_scope', { p_code: inviteCode })
    const scope = data?.[0]
    if (scope && (scope.code_type === 'team_claim' || scope.code_type === 'new_team_bootstrap') && scope.scope_bits_team_id && scope.team_name) {
      inviteTeam = { id: scope.scope_bits_team_id, name: scope.team_name }
    }
  }

  return <OnboardingClient inviteTeam={inviteTeam} inviteCode={inviteTeam ? inviteCode : null} />
}
