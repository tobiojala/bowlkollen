export function norm(arr: number[]) {
  const mn = Math.min(...arr), mx = Math.max(...arr)
  if (mx === mn) return arr.map(() => 50)
  return arr.map(v => ((v - mn) / (mx - mn)) * 100)
}

export function stdDev(arr: number[]) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.round(Math.sqrt(arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / arr.length))
}

export function calcStreaks(games: number[], t: number) {
  let best = 0, run = 0
  for (const g of games) { g >= t ? (run++, best = Math.max(best, run)) : (run = 0) }
  let cur = 0
  for (let i = games.length - 1; i >= 0; i--) { if (games[i] >= t) cur++; else break }
  return { current: cur, best }
}

export function calcGameAverages(matches: { games: number[] }[]): number[] {
  const n = matches[0].games.length
  return Array.from({ length: n }, (_, i) => {
    const vals = matches.map(m => m.games[i])
    return Math.round(vals.reduce((a, b) => a + b) / vals.length)
  })
}

export function rhythmLabel(avgs: number[]): { label: string; detail: string } {
  const first  = avgs[0], last = avgs[avgs.length - 1]
  const max    = Math.max(...avgs), min = Math.min(...avgs)
  const diff   = last - first
  const spread = max - min
  const peakIdx = avgs.indexOf(max)

  if (diff >= 12)      return { label: 'Stark avslutare',  detail: `+${diff}p från spel 1 till ${avgs.length}` }
  if (diff <= -12)     return { label: 'Snabbstartare',    detail: `tappar ${Math.abs(diff)}p mot slutet` }
  if (spread <= 8)     return { label: 'Järnkonsekvent',   detail: `bara ${spread}p skillnad spel 1–${avgs.length}` }
  if (peakIdx === 1)   return { label: 'Snabbt inne',      detail: `peakar i spel 2, håller sedan nivån` }
  return               { label: 'Varierad rytm',           detail: `spridning ${spread}p spel 1–${avgs.length}` }
}

export function narrativeParagraph(s: {
  firstName: string; seasonAvg: number; lastSeasonAvg: number
  formDiff: number; hitRate: number; streakAboveAvg: number
  consistency: string; rhythmLabel: string; bestSeries: number
  games200Plus: number; totalGames: number
}): string[] {
  const diff  = s.seasonAvg - s.lastSeasonAvg
  const sentences: string[] = []

  // Sentence 1 — season overview vs last year
  if (diff >= 8)
    sentences.push(`${s.firstName} har haft sin bästa säsong hittills — ett snitt på ${s.seasonAvg} är ${diff}p bättre än förra säsongens ${s.lastSeasonAvg}.`)
  else if (diff >= 3)
    sentences.push(`${s.firstName} fortsätter att förbättra sig med ett snitt på ${s.seasonAvg}, upp ${diff}p från förra säsongens ${s.lastSeasonAvg}.`)
  else if (diff >= -3)
    sentences.push(`${s.firstName} levererar en stabil säsong med ett snitt på ${s.seasonAvg} — i linje med förra säsongens ${s.lastSeasonAvg}.`)
  else
    sentences.push(`${s.firstName} snittar ${s.seasonAvg} denna säsong, något under förra årets ${s.lastSeasonAvg}, men med tydlig uppgång de senaste matcherna.`)

  // Sentence 2 — current form (streak info lives in the dedicated streak banner, not here)
  if (s.formDiff >= 20)
    sentences.push(`Formen pekar tydligt uppåt — snittet de senaste matcherna ligger ${s.formDiff}p över säsongssnittet.`)
  else if (s.formDiff >= 10)
    sentences.push(`Kurvan pekar uppåt med ett formsnitt ${s.formDiff}p över säsongssnittet — god timing inför slutspurten.`)
  else if (s.formDiff <= -15)
    sentences.push(`Formen är inte på topp just nu, men grunden är stark med ${s.hitRate}% träffrate på 200-strecket.`)
  else
    sentences.push(`Med ${s.hitRate}% träffrate och ${s.games200Plus} av ${s.totalGames} spel över 200 är grundstabiliteten hög.`)

  // Sentence 3 — rhythm + character
  sentences.push(`Som ${s.rhythmLabel.toLowerCase()} tar hon regelbundet ett kliv mot slutet — ${s.consistency.toLowerCase()} prestationer gör henne svår att räkna bort.`)

  // Sentence 4 — season highlight
  sentences.push(`Säsongens höjdpunkt är en serie på ${s.bestSeries} — ett bevis på att toppresultaten finns när det verkligen gäller.`)

  return sentences
}

export function characterSentence({
  hitRate, formDiff, streakAboveAvg, streakAbove200, consistency, seasonAvg, bestSeries,
}: {
  hitRate: number; formDiff: number; streakAboveAvg: number; streakAbove200: number
  consistency: string; seasonAvg: number; bestSeries: number
}): string {
  // Lead trait — what kind of bowler
  let lead: string
  if (hitRate >= 68)       lead = 'Dominant 200+-spjutspets'
  else if (hitRate >= 52)  lead = 'Pålitlig 200+-spjutspets'
  else if (hitRate >= 38)  lead = 'Allround bowlare'
  else                     lead = 'Offensiv risktagare'

  // Modifier — style/consistency only; streak lives in the dedicated banner
  let mod: string
  if (formDiff >= 20)        mod = `i tydligt uppgång (+${formDiff} i form)`
  else if (formDiff <= -15)  mod = `som söker formen — bästa serie ${bestSeries} visar kapaciteten`
  else if (hitRate >= 60)    mod = `med ${consistency.toLowerCase()} spel och ${hitRate}% träffrate`
  else                       mod = `med ${consistency.toLowerCase()} prestationer kring ${seasonAvg}`

  return `${lead} ${mod}.`
}

export function smooth(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`
    const pv = pts[i - 1], cpx = ((pv.x + p.x) / 2).toFixed(1)
    return `C ${cpx},${pv.y.toFixed(1)} ${cpx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')
}
