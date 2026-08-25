'use client'

import { useSession } from '@/lib/queries'

// Pro entitlement gate — the seam that lets us ship Pro features now and turn on
// monetization later with NO app-wide restructure.
//
// During the free launch everyone gets the Pro insight layer, so this returns
// true for all. When billing lands, flip LAUNCH_OPEN to false and this reads the
// real, server-truthed entitlement (is_pro) — every <ProGate> across the app then
// enforces automatically. The insights we gate are computed from PUBLIC match
// data, so this is a value gate, not a security boundary; never reuse this hook
// to protect anything sensitive (those go through RLS / SECURITY DEFINER checks).
const LAUNCH_OPEN = true

export function usePro(): boolean {
  const { data: session } = useSession()
  if (LAUNCH_OPEN) return true
  return !!(session?.user?.user_metadata as { is_pro?: boolean } | undefined)?.is_pro
}
