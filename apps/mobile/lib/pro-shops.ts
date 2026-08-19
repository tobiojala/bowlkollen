import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// Pro shops (klotshopar) — World 5 reference. Standalone `pro_shops` table, shared
// with web's /klotshopar. Public read.
export type ProShop = {
  id: number;
  name: string;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  ibpsia_certified: boolean;
  accepts_gift_cards: boolean;
};

export function useProShops() {
  return useQuery({
    queryKey: ['pro-shops'],
    staleTime: 60 * 60 * 1000, // slow-moving reference data
    queryFn: async (): Promise<ProShop[]> => {
      const { data, error } = await supabase.from('pro_shops').select('*').order('name');
      if (error) throw error;
      return (data as ProShop[]) ?? [];
    },
  });
}

export function shopAddress(s: ProShop): string {
  return [s.street_address, s.postal_code && s.city ? `${s.postal_code} ${s.city}` : s.city].filter(Boolean).join(', ');
}
