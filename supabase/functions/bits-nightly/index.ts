// Supabase Edge Function — runs on a schedule (configure in Supabase dashboard).
// Recommended schedule: "0 3 * * *" (03:00 UTC daily).
//
// Required env vars (set in Supabase dashboard → Edge Functions → Secrets):
//   SITE_URL    — e.g. https://bowlkollen.se
//   CRON_SECRET — same value as CRON_SECRET in your Next.js env

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async () => {
  const siteUrl    = Deno.env.get('SITE_URL') ?? ''
  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''

  if (!siteUrl || !cronSecret) {
    return new Response(JSON.stringify({ error: 'missing SITE_URL or CRON_SECRET env vars' }), { status: 500 })
  }

  const res = await fetch(`${siteUrl}/api/cron/bits-sync`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${cronSecret}`,
    },
  })

  const body = await res.text()
  return new Response(body, {
    status:  res.status,
    headers: { 'Content-Type': 'application/json' },
  })
})
