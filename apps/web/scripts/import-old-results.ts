import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const workbook = XLSX.readFile('./Elitserien Herrar-matcher.xlsx')
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows: any[] = XLSX.utils.sheet_to_json(sheet)

async function getOrCreateSeason() {
  const { data: existing } = await supabase
    .from('seasons')
    .select('*')
    .eq('year', 2025)
    .single()

  if (existing) return existing

  const { data } = await supabase
    .from('seasons')
    .insert({
      name: '2025/2026',
      year: 2025,
      is_active: false,
    })
    .select()
    .single()

  return data
}

async function getOrCreateLeague(seasonId: string) {
  const { data: existing } = await supabase
    .from('leagues')
    .select('*')
    .eq('name', 'Elitserien Herrar')
    .single()

  if (existing) return existing

  const { data } = await supabase
    .from('leagues')
    .insert({
      name: 'Elitserien Herrar',
      level: 'Elite',
      season_id: seasonId,
    })
    .select()
    .single()

  return data
}

async function getOrCreateTeam(name: string) {
  const cleanName = name.trim()

  const { data: existing } = await supabase
    .from('teams')
    .select('*')
    .eq('name', cleanName)
    .single()

  if (existing) return existing

  const { data } = await supabase
    .from('teams')
    .insert({
      name: cleanName,
      club: cleanName,
      external_name: cleanName,
    })
    .select()
    .single()

  return data
}

async function addLeagueTeam(leagueId: string, teamId: string) {
  const { data: existing } = await supabase
    .from('league_teams')
    .select('*')
    .eq('league_id', leagueId)
    .eq('team_id', teamId)
    .single()

  if (existing) return

  await supabase.from('league_teams').insert({
    league_id: leagueId,
    team_id: teamId,
  })
}

async function run() {
  const season = await getOrCreateSeason()
  const league = await getOrCreateLeague(season.id)

  let currentRound = ''

  for (const row of rows) {
    if (row.Match?.includes('Omgång')) {
      currentRound = row.Match
      continue
    }

    if (!row.Match || !row.Match.includes(' - ')) continue

    const [homeName, awayName] = row.Match.split(' - ')

    const homeTeam = await getOrCreateTeam(homeName)
    const awayTeam = await getOrCreateTeam(awayName)

    await addLeagueTeam(league.id, homeTeam.id)
    await addLeagueTeam(league.id, awayTeam.id)

    let homeScore = null
    let awayScore = null

    if (row.Resultat && row.Resultat.includes('-')) {
      const parts = row.Resultat.split('-')

      homeScore = Number(parts[0].trim())
      awayScore = Number(parts[1].trim())
    }

    const existingMatch = await supabase
      .from('matches')
      .select('id')
      .eq('external_match_id', String(row.MatchId))
      .single()

    if (existingMatch.data) {
      console.log('Skipping:', row.Match)
      continue
    }

    const matchDate = new Date(row.Tid)

    await supabase.from('matches').insert({
      league_id: league.id,
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      date: matchDate.toISOString(),
      status: 'finished',
      location: row.Hall || null,
      external_match_id: String(row.MatchId),
      home_score: homeScore,
      away_score: awayScore,
      round: currentRound,
      oil_pattern: row.OljeProfil || null,
    })

    console.log('Imported:', row.Match)
  }

  console.log('DONE!')
}

run()