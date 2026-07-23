import * as Calendar from 'expo-calendar';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { TeamMatch } from '@/lib/team-data';

const safeName = (s: string) => (s || 'lag').replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40);
const day = (d: string) => d.slice(0, 10);
const csvCell = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`;
const result = (m: TeamMatch) =>
  m.is_finished && m.home_result != null ? `${m.home_result}–${m.away_result}` : '';

async function writeAndShare(name: string, content: string, mimeType: string) {
  const file = new File(Paths.cache, name);
  try {
    if (file.exists) file.delete();
  } catch {
    // ignore — will be (re)created below
  }
  file.create();
  file.write(content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, UTI: mimeType });
  }
}

export type CalendarResult =
  | { ok: true; added: number }
  | { ok: false; reason: 'permission' | 'error' };

// Add upcoming fixtures straight into the device's default calendar (iCloud /
// Google / iOS — whatever the phone syncs), all-day events. No file to manage.
export async function addToCalendar(matches: TeamMatch[]): Promise<CalendarResult> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'permission' };
    const cal = await Calendar.getDefaultCalendarAsync();
    let added = 0;
    for (const m of matches) {
      const start = new Date(`${day(m.match_date)}T00:00:00`);
      const end = new Date(start.getTime() + 24 * 3600 * 1000);
      await Calendar.createEventAsync(cal.id, {
        title: `${m.home_team_name} – ${m.away_team_name}`,
        startDate: start,
        endDate: end,
        allDay: true,
        location: m.hall_name ?? undefined,
        notes: 'Bowlkollen',
      });
      added++;
    }
    return { ok: true, added };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

// Season matches as CSV (opens in Excel/Numbers/Sheets).
export async function shareCSV(teamName: string, matches: TeamMatch[]) {
  const rows = [
    ['Datum', 'Hemma', 'Borta', 'Resultat', 'Hall'],
    ...matches.map((m) => [day(m.match_date), m.home_team_name, m.away_team_name, result(m), m.hall_name ?? '']),
  ];
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  await writeAndShare(`${safeName(teamName)}.csv`, csv, 'text/csv');
}

// Season matches as a printable PDF.
export async function sharePDF(teamName: string, matches: TeamMatch[]) {
  const rows = matches
    .map(
      (m) =>
        `<tr><td>${day(m.match_date)}</td><td>${m.home_team_name}</td><td>${m.away_team_name}</td><td style="text-align:center">${result(m) || '–'}</td><td>${m.hall_name ?? ''}</td></tr>`,
    )
    .join('');
  const html = `<html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Helvetica,sans-serif;padding:28px;color:#111}
    h1{font-size:20px;margin:0 0 4px} .sub{color:#666;margin:0 0 20px;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;border-bottom:2px solid #111;padding:6px 4px}
    td{border-bottom:1px solid #ddd;padding:6px 4px}
  </style></head><body>
    <h1>${teamName}</h1><p class="sub">Spelschema · Bowlkollen</p>
    <table><thead><tr><th>Datum</th><th>Hemma</th><th>Borta</th><th>Resultat</th><th>Hall</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
