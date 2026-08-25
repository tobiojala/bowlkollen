'use client'

import { usePro } from '@/lib/pro'

// Wrap any Pro-only insight. Pro users (today: everyone, see usePro) get the real
// thing; free users get the `teaser` — a scaled-down/locked preview, never a blank
// — which is the reason to upgrade AND the best conversion surface. Adopt it as
// each Pro feature is built so the free/Pro line is set from day one.
export function ProGate({ children, teaser = null }: { children: React.ReactNode; teaser?: React.ReactNode }) {
  return usePro() ? <>{children}</> : <>{teaser}</>
}
