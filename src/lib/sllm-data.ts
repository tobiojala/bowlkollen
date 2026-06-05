/** SLLM event page — config, demo data, parsers. */

export type Squad = { label: string; href: string }

export type SllmPlayer = {
  name: string
  country: string
  club: string
  squads: Squad[]
}

export type SllmEventStatus = 'upcoming' | 'live' | 'finished'

export type SllmEventAction = {
  label: string
  href: string
  style: 'primary' | 'secondary' | 'live'
}

export const SLLM_EVENT = {
  name: 'Storm Lucky Larsen Masters 2026',
  dates: '22–30 aug 2026',
  venue: 'Lucky Bowl, Helsingborg',
  status: 'upcoming' as SllmEventStatus,
  banner:
    'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
  actions: [
    {
      label: 'Anmäl dig →',
      href: 'https://sbe.bowlres.se/sllm26',
      style: 'primary',
    },
    {
      label: 'Officiell sida',
      href: 'https://www.luckylarsen.se',
      style: 'secondary',
    },
    {
      label: '▶ Livestream',
      href: 'https://www.youtube.com/@stormluckylarsenmasters',
      style: 'live',
    },
  ] as SllmEventAction[],
}

export const SLLM_STATUS_LABEL: Record<SllmEventStatus, string> = {
  upcoming: 'KOMMANDE TÄVLING',
  live: 'TÄVLING PÅGÅR',
  finished: 'AVSLUTAD',
}

export const SLLM_DEMO_PLAYERS: SllmPlayer[] = [
  { name: 'Pontus Andersson', country: 'SWE', club: 'IK Hakarpspojkarna', squads: [] },
  { name: 'Jesper Svensson', country: 'SWE', club: 'Linköpings BK', squads: [] },
  { name: 'Martin Larsen', country: 'SWE', club: 'Helsingborgs BS', squads: [] },
  { name: 'Dom Barrett', country: 'ENG', club: 'Storm Bowling', squads: [] },
  { name: 'Anthony Simonsen', country: 'USA', club: 'PBA Tour', squads: [] },
  { name: 'EJ Tackett', country: 'USA', club: 'PBA Tour', squads: [] },
  { name: 'Sara Björk Jónsdóttir', country: 'ISL', club: 'Bowling Iceland', squads: [] },
  { name: 'Danielle McEwan', country: 'USA', club: 'PWBA Tour', squads: [] },
  { name: 'Ildemaro Ruiz', country: 'VEN', club: 'Storm Bowling', squads: [] },
  { name: 'Niclas Carlsson', country: 'SWE', club: 'Mariestads BK', squads: [] },
]

export function parseSllmPlayers(html: string): SllmPlayer[] {
  const players: SllmPlayer[] = []
  const rows = html.split('<div class="row">')
  for (const row of rows) {
    const nameMatch = row.match(/<strong>(.+?)<\/strong>/)
    const countryMatch = row.match(/<span class="country-span">([A-Z]{2,3})<\/span>/)
    const clubMatch = row.match(/<\/span><br\/>\s*(.+?)\s*<\/div>/)
    if (!nameMatch || !countryMatch) continue
    const name = nameMatch[1].trim()
    const country = countryMatch[1].trim()
    const club = clubMatch
      ? clubMatch[1]
          .replace(/&[a-z]+;/g, c => {
            const map: Record<string, string> = {
              '&auml;': 'ä',
              '&ouml;': 'ö',
              '&aring;': 'å',
              '&uuml;': 'ü',
              '&Auml;': 'Ä',
              '&Ouml;': 'Ö',
              '&Aring;': 'Å',
              '&nbsp;': ' ',
            }
            return map[c] || c
          })
          .trim()
      : ''
    const squads: Squad[] = []
    for (const m of [...row.matchAll(/<a href='(show[^']+)'>([^<]+)<\/a>/g)]) {
      squads.push({ href: 'https://sllm.bowlres.se/' + m[1], label: m[2].trim() })
    }
    players.push({ name, country, club, squads })
  }
  return players
}

export function sllmPlayerColors(name: string, dark: boolean) {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    bg: `hsl(${hue},40%,${dark ? '14%' : '93%'})`,
    text: `hsl(${hue},50%,${dark ? '65%' : '40%'})`,
    border: `hsl(${hue},45%,${dark ? '28%' : '72%'})`,
  }
}

export function sllmPlayerInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
