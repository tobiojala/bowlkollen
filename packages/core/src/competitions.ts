export type Tavling = {
  id: string
  name: string
  subtitle: string
  date: string
  venue: string
  status: 'pagaende' | 'kommande' | 'avslutad'
  href: string
  buttonLabel: string
  officialHref?: string
  extraButtons?: { label: string; href: string }[]
  banner?: string
}

// SM-slutspel lives on the Elitserien division pages (it's the league's own
// climax), not here in Competitions.
export const TAVLINGAR: Tavling[] = [
  {
    id: 'gp-final-2026', name: 'Challenger Grand Prix — Final',
    subtitle: 'Tourfinal i Stockholm — 6 deltävlingar bakom sig',
    date: '16–17 maj 2026', venue: 'Sollentuna',
    status: 'pagaende', href: 'https://gp.stbf.se',
    officialHref: 'https://gp.stbf.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://gp.stbf.se/allresults.php' },
      { label: 'Barometer', href: 'https://gp.stbf.se/standings.php' },
    ],
  },
  {
    id: 'syt-2026', name: 'PBA jr. Swedish Youth Tour 2026',
    subtitle: 'Ungdomstour — U16, U21 killar och tjejer',
    date: '2025/2026', venue: 'Olympia, Nässjö, Gullmarsplan',
    status: 'pagaende', href: 'https://syt.bowlres.se',
    officialHref: 'https://syt.bowlres.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://syt.bowlres.se/allresults.php' },
      { label: 'Anmäl dig', href: 'https://syt.bowlres.se/register.php' },
    ],
  },
  {
    id: 'sllm-2026', name: 'Storm Lucky Larsen Masters 2026',
    subtitle: 'Internationell PBA Tour-tävling — Sveriges största öppna turnering',
    date: '22–30 aug 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'kommande', href: '/sllm',
    officialHref: 'https://www.luckylarsen.se',
    buttonLabel: 'Mer info',
    banner: 'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://sbe.bowlres.se/sllm26' },
      { label: 'Livestream', href: 'https://www.youtube.com/@stormluckylarsenmasters' },
    ],
  },
  {
    id: 'battle-of-smaland-2026', name: 'The Battle of Småland 2026',
    subtitle: 'Sveriges största sommartävling — prissumma 53 000 kr',
    date: 'Sommar 2026', venue: 'RC Bowl, Jönköping',
    status: 'kommande', href: 'https://rc-bowl.bowlres.se',
    officialHref: 'https://rc-bowl.bowlres.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://rc-bowl.bowlres.se/register.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@RcBowllive' },
    ],
  },
  {
    id: 'aikl-2026', name: 'MOTIV AIK Ladies 2026',
    subtitle: 'Öppen damtävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikl.aikbowling.se',
    officialHref: 'https://aikl.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikj-2026', name: 'MOTIV AIK Junior 2026',
    subtitle: 'Öppen juniortävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikj.aikbowling.se',
    officialHref: 'https://aikj.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'qak-2026', name: 'Queens and Kings 2026',
    subtitle: 'Öppen tävling',
    date: '2026', venue: 'Sverige',
    status: 'kommande', href: 'https://qak.bowlres.se',
    officialHref: 'https://qak.bowlres.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikmix-2026', name: 'AIK-mixen 2026',
    subtitle: 'Öppen mixedtävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikmix.aikbowling.se',
    officialHref: 'https://aikmix.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikt-2026', name: 'MOTIV AIK International Tournament 2026',
    subtitle: 'Internationell öppen tävling i Stockholm — no urethane rule',
    date: 'Jan 2026', venue: 'Bowlorama, Stockholm',
    status: 'avslutad', href: 'https://aikt.aikbowling.se',
    officialHref: 'https://aikt.aikbowling.se',
    buttonLabel: 'Officiell sida',
    extraButtons: [
      { label: 'Resultat', href: 'https://aikt.aikbowling.se/allresults.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@bowloramatv' },
    ],
  },
]

export function getLiveCompetitions(): Tavling[] {
  return TAVLINGAR.filter(t => t.status === 'pagaende')
}
