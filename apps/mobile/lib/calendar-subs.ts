import * as Calendar from 'expo-calendar';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

// Managed calendar subscriptions. The app owns a dedicated "Bowlkollen" calendar and
// tags each event with its source (bk:team:ID / bk:division:ID) so the control panel
// can list, refresh, and END a subscription — something OS-level webcal subs don't
// allow from inside an app. "Subscribe" = add the season's matches; "uppdatera" =
// rebuild from the latest schedule. Subs are device-local (a calendar is per-device).

const CURRENT_SEASON = 2026;
const CAL_KEY = 'bk_calendar_id';
const SUBS_KEY = 'bk_calendar_subs';
const CAL_TITLE = 'Bowlkollen';

export type SubType = 'team' | 'division';
export type CalSub = { type: SubType; id: number; name: string };
type CalMatch = { date: string; home: string; away: string; hall: string | null };

const tag = (t: SubType, id: number) => `bk:${t}:${id}`;

async function loadSubs(): Promise<CalSub[]> {
  try {
    const raw = await SecureStore.getItemAsync(SUBS_KEY);
    return raw ? (JSON.parse(raw) as CalSub[]) : [];
  } catch {
    return [];
  }
}
async function saveSubs(subs: CalSub[]) {
  try {
    await SecureStore.setItemAsync(SUBS_KEY, JSON.stringify(subs));
  } catch {
    /* ignore */
  }
}

async function ensureCalendar(): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  const saved = await SecureStore.getItemAsync(CAL_KEY);
  if (saved) {
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (cals.some((c) => c.id === saved)) return saved;
  }
  const def = await Calendar.getDefaultCalendarAsync().catch(() => null);
  const id = await Calendar.createCalendarAsync({
    title: CAL_TITLE,
    name: CAL_TITLE,
    color: '#f5c200',
    entityType: Calendar.EntityTypes.EVENT,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    sourceId: Platform.OS === 'ios' ? def?.source?.id : undefined,
    source: Platform.OS === 'android' ? { isLocalAccount: true, name: CAL_TITLE, type: 'LOCAL' } : undefined,
    ownerAccount: 'Bowlkollen',
  });
  await SecureStore.setItemAsync(CAL_KEY, id);
  return id;
}

async function fetchMatches(sub: CalSub): Promise<CalMatch[]> {
  let q = supabase
    .from('bits_matches')
    .select('match_date, home_team_name, away_team_name, hall_name')
    .eq('season_id', CURRENT_SEASON)
    .order('match_date', { ascending: true });
  q = sub.type === 'team' ? q.or(`home_bits_team_id.eq.${sub.id},away_bits_team_id.eq.${sub.id}`) : q.eq('bits_division_id', sub.id);
  const { data } = await q;
  return (data ?? []).map((m) => ({
    date: m.match_date as string,
    home: m.home_team_name as string,
    away: m.away_team_name as string,
    hall: (m.hall_name as string | null) ?? null,
  }));
}

// Remove every event this sub previously created (found by its tag in the notes).
async function clearEvents(calId: string, sub: CalSub) {
  const start = new Date(2020, 0, 1);
  const end = new Date(2030, 0, 1);
  const events = await Calendar.getEventsAsync([calId], start, end);
  const mark = tag(sub.type, sub.id);
  await Promise.all(events.filter((e) => (e.notes ?? '').includes(mark)).map((e) => Calendar.deleteEventAsync(e.id)));
}

async function writeEvents(calId: string, sub: CalSub, matches: CalMatch[]) {
  const mark = tag(sub.type, sub.id);
  for (const m of matches) {
    const [y, mo, d] = m.date.split('-').map(Number);
    if (!y || !mo || !d) continue;
    const startDate = new Date(y, mo - 1, d);
    await Calendar.createEventAsync(calId, {
      title: `${m.home} – ${m.away}`,
      startDate,
      endDate: new Date(startDate.getTime() + 86_400_000),
      allDay: true,
      location: m.hall ?? undefined,
      notes: `Bowlkollen\n${mark}`,
    });
  }
}

// Public engine ---------------------------------------------------------------
export async function subscribe(sub: CalSub): Promise<{ ok: boolean; count?: number; reason?: 'permission' | 'error' }> {
  try {
    const calId = await ensureCalendar();
    if (!calId) return { ok: false, reason: 'permission' };
    await clearEvents(calId, sub); // idempotent
    const matches = await fetchMatches(sub);
    await writeEvents(calId, sub, matches);
    const subs = await loadSubs();
    if (!subs.some((s) => s.type === sub.type && s.id === sub.id)) subs.push(sub);
    await saveSubs(subs);
    return { ok: true, count: matches.length };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function unsubscribe(sub: CalSub): Promise<void> {
  const calId = (await SecureStore.getItemAsync(CAL_KEY)) ?? (await ensureCalendar());
  if (calId) await clearEvents(calId, sub).catch(() => {});
  const subs = (await loadSubs()).filter((s) => !(s.type === sub.type && s.id === sub.id));
  await saveSubs(subs);
}

export async function refreshAll(): Promise<void> {
  const calId = await ensureCalendar();
  if (!calId) return;
  for (const sub of await loadSubs()) {
    await clearEvents(calId, sub);
    await writeEvents(calId, sub, await fetchMatches(sub));
  }
}

// Hook for the control panel.
export function useCalendarSubs() {
  const [subs, setSubs] = useState<CalSub[]>([]);
  const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => setSubs(await loadSubs()), []);
  useEffect(() => {
    void reload();
  }, [reload]);

  const isSubscribed = (type: SubType, id: number) => subs.some((s) => s.type === type && s.id === id);
  const toggle = useCallback(
    async (sub: CalSub): Promise<{ ok: boolean; reason?: 'permission' | 'error'; count?: number }> => {
      setBusy(true);
      const on = subs.some((s) => s.type === sub.type && s.id === sub.id);
      let res: { ok: boolean; reason?: 'permission' | 'error'; count?: number } = { ok: true };
      if (on) await unsubscribe(sub);
      else res = await subscribe(sub);
      await reload();
      setBusy(false);
      return res;
    },
    [subs, reload],
  );
  const refresh = useCallback(async () => {
    setBusy(true);
    await refreshAll();
    setBusy(false);
  }, []);

  return { subs, busy, isSubscribed, toggle, refresh };
}
