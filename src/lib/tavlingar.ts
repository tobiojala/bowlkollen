// Tävlingar (tournaments) — temporary static registry.
// TODO: move into a Supabase `events` table so schema/tavlingar render the same rows.

export type Tavling = {
  id: string; name: string; subtitle: string
  dateFrom: string | null   // ISO "2026-05-15" or null for fuzzy
  dateTo: string | null     // ISO "2026-05-17" or null
  dateLabel: string         // human-readable display
  venue: string; status: 'pagaende' | 'kommande' | 'avslutad'
  href: string; buttonLabel: string
  officialHref?: string
  extraButtons?: { label: string; href: string }[]
}

// dateFrom/dateTo: specific dates appear inline in the calendar.
// dateFrom: null → fuzzy date, lives in "Kommande tävlingar" section.
export const TAVLINGAR: Tavling[] = [
  {
    id: 'sm-slutspel-2026', name: 'SM-slutspel 2026',
    subtitle: 'Semifinaler och final i Elitserien Herrar och Damer',
    dateFrom: '2026-05-15', dateTo: '2026-05-17',
    dateLabel: '15–17 maj 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'pagaende', href: '/schema', buttonLabel: 'Se matcher',
  },
  {
    id: 'gp-final-2026', name: 'Challenger Grand Prix — Final',
    subtitle: 'Tourfinal i Stockholm — 6 deltävlingar bakom sig',
    dateFrom: '2026-05-16', dateTo: '2026-05-17',
    dateLabel: '16–17 maj 2026', venue: 'Sollentuna',
    status: 'pagaende', href: 'https://gp.stbf.se',
    officialHref: 'https://gp.stbf.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://gp.stbf.se/allresults.php' },
      { label: 'Barometer', href: 'https://gp.stbf.se/standings.php' },
    ],
  },
  {
    id: 'sllm-2026', name: 'Storm Lucky Larsen Masters 2026',
    subtitle: 'Internationell PBA Tour-tävling — Sveriges största öppna turnering',
    dateFrom: '2026-08-22', dateTo: '2026-08-30',
    dateLabel: '22–30 aug 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'kommande', href: '/sllm', officialHref: 'https://www.luckylarsen.se',
    buttonLabel: 'Mer info',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://sbe.bowlres.se/sllm26' },
      { label: 'Livestream', href: 'https://www.youtube.com/@stormluckylarsenmasters' },
    ],
  },
  // ── Fuzzy-dated (dateFrom: null) — appear in Kommande section ─────────────
  {
    id: 'syt-2026', name: 'PBA jr. Swedish Youth Tour 2026',
    subtitle: 'Ungdomstour — U16, U21 killar och tjejer',
    dateFrom: null, dateTo: null, dateLabel: '2025/2026',
    venue: 'Olympia, Nässjö, Gullmarsplan',
    status: 'pagaende', href: 'https://syt.bowlres.se',
    officialHref: 'https://syt.bowlres.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://syt.bowlres.se/allresults.php' },
      { label: 'Anmäl dig', href: 'https://syt.bowlres.se/register.php' },
    ],
  },
  {
    id: 'battle-of-smaland-2026', name: 'The Battle of Småland 2026',
    subtitle: 'Sveriges största sommartävling — prissumma 53 000 kr',
    dateFrom: null, dateTo: null, dateLabel: 'Sommar 2026',
    venue: 'RC Bowl, Jönköping',
    status: 'kommande', href: 'https://rc-bowl.bowlres.se',
    officialHref: 'https://rc-bowl.bowlres.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://rc-bowl.bowlres.se/register.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@RcBowllive' },
    ],
  },
  {
    id: 'aikl-2026', name: 'MOTIV AIK Ladies 2026',
    subtitle: 'Öppen damtävling i Stockholm',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikl.aikbowling.se',
    officialHref: 'https://aikl.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikj-2026', name: 'MOTIV AIK Junior 2026',
    subtitle: 'Öppen juniortävling i Stockholm',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikj.aikbowling.se',
    officialHref: 'https://aikj.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'qak-2026', name: 'Queens and Kings 2026',
    subtitle: 'Öppen tävling',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Sverige',
    status: 'kommande', href: 'https://qak.bowlres.se',
    officialHref: 'https://qak.bowlres.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikmix-2026', name: 'AIK-mixen 2026',
    subtitle: 'Öppen mixedtävling i Stockholm',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikmix.aikbowling.se',
    officialHref: 'https://aikmix.aikbowling.se', buttonLabel: 'Officiell sida',
  },
]

// Expand date ranges into date → Tavling[] map (built once at module load)
function buildTavMap(): Map<string, Tavling[]> {
  const map = new Map<string, Tavling[]>()
  TAVLINGAR.filter(t => t.dateFrom).forEach(t => {
    const end = new Date((t.dateTo ?? t.dateFrom!) + 'T12:00:00')
    const cur = new Date(t.dateFrom! + 'T12:00:00')
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
      cur.setDate(cur.getDate() + 1)
    }
  })
  return map
}

export const TAV_MAP   = buildTavMap()
export const FUZZY_TAV = TAVLINGAR.filter(t => !t.dateFrom && t.status !== 'avslutad')
