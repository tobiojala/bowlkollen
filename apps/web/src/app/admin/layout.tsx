import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

// Server-side guard for every /admin/* route. The real gate is the is_admin()
// check inside the admin RPCs (see admin_model.sql) — this is the matching UX
// layer so non-admins never see the admin shell at all.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isAdmin, error } = await supabase.rpc('is_admin')
  if (error || !isAdmin) redirect('/')

  return <>{children}</>
}
