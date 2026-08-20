import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// Bowling halls / venues (World 5). Standalone `bowling_centers` table, shared
// with web /hallar. Public read.
export type Hall = {
  id: number;
  name: string;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  region: string | null;
  lanes: number | null;
  machine_type: string | null;
  lane_type: string | null;
  online_scoring: boolean;
  online_scoring_url: string | null;
  online_booking: boolean;
  online_booking_url: string | null;
  accepts_gift_cards: boolean;
};

export function useHalls() {
  return useQuery({
    queryKey: ['halls'],
    staleTime: 60 * 60 * 1000, // slow-moving reference data
    queryFn: async (): Promise<Hall[]> => {
      const { data, error } = await supabase
        .from('bowling_centers')
        .select('id, name, city, street_address, postal_code, phone, email, website, region, lanes, machine_type, lane_type, online_scoring, online_scoring_url, online_booking, online_booking_url, accepts_gift_cards')
        .order('name');
      if (error) throw error;
      return (data as Hall[]) ?? [];
    },
  });
}

export function hallAddress(h: Hall): string {
  return [h.street_address, h.postal_code && h.city ? `${h.postal_code} ${h.city}` : h.city].filter(Boolean).join(', ');
}
