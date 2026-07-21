'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'

// Module-level singleton — one client per browser tab, stable across re-renders.
// No useState needed, so this component adds zero dynamic state to the root tree.
let browserClient: ReturnType<typeof makeQueryClient> | undefined

function getClient() {
  if (typeof window === 'undefined') return makeQueryClient()
  if (!browserClient) browserClient = makeQueryClient()
  return browserClient
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>
}
