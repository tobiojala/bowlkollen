import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// Pro entitlement gate (native twin of web's lib/pro.ts) — the seam that lets us
// ship Pro insights now and turn on monetization later with no restructure.
// During the free launch everyone gets the Pro layer; when billing lands, flip
// LAUNCH_OPEN and it reads the server-truthed entitlement (is_pro). The gated
// insights are computed from PUBLIC match data — a value gate, not a security
// boundary; never reuse it to protect anything sensitive.
const LAUNCH_OPEN = true;

export function usePro(): boolean {
  const { data: isPro } = useQuery({
    queryKey: ['is-pro'],
    enabled: !LAUNCH_OPEN,
    staleTime: Infinity,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return !!(session?.user?.user_metadata as { is_pro?: boolean } | undefined)?.is_pro;
    },
  });
  return LAUNCH_OPEN || !!isPro;
}
