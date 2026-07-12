'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useColors } from '@/components/ThemeProvider'

type SyncResult = { ok: boolean; synced: number; skipped: number; errors: string[] }
type Log = { ts: string; action: string; result: SyncResult }

async function callSync(action: string, extra: Record<string, unknown> = {}): Promise<SyncResult> {
  const res = await fetch('/api/admin/bits-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }),
  })
  return res.json() as Promise<SyncResult>
}

export default function BitsAdminPage() {
  const { C } = useColors()
  const [loading, setLoading] = useState<string | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [season, setSeason] = useState(2026)
  const [matchId, setMatchId] = useState('')

  const inp = {
    background: C.surface, border: '1px solid ' + C.border, borderRadius: 8,
    padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', width: '100%',
  } as React.CSSProperties

  const btn = (active: boolean) => ({
    background: active ? C.accent : C.surface,
    color: active ? '#1a1400' : C.text,
    border: '1px solid ' + C.border,
    borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700,
    cursor: active ? 'not-allowed' : 'pointer', opacity: active ? 0.7 : 1,
  } as React.CSSProperties)

  async function run(action: string, label: string, extra: Record<string, unknown> = {}) {
    if (loading) return
    setLoading(action)
    try {
      const result = await callSync(action, { seasonId: season, ...extra })
      setLogs(prev => [{ ts: new Date().toLocaleTimeString('sv-SE'), action: label, result }, ...prev])
    } finally {
      setLoading(null)
    }
  }

  // Repeats the same batched action until the server reports nothing left to
  // do (skipped > 0) or an error occurs — for actions too large for one call
  // (e.g. per-license API lookups) so the user doesn't have to keep clicking.
  const MAX_ROUNDS = 50
  async function runUntilDone(action: string, label: string, extra: Record<string, unknown> = {}) {
    if (loading) return
    setLoading(action)
    try {
      for (let round = 1; round <= MAX_ROUNDS; round++) {
        const result = await callSync(action, { seasonId: season, ...extra })
        setLogs(prev => [{ ts: new Date().toLocaleTimeString('sv-SE'), action: `${label} (omgång ${round})`, result }, ...prev])
        // skipped > 0 alone isn't "done" — a batch can skip a few stragglers
        // (e.g. matches missing match_scheme_id) while still synking plenty.
        // Only stop once a round does literally nothing.
        if (!result.ok || (result.skipped > 0 && result.synced === 0)) break
      }
    } finally {
      setLoading(null)
    }
  }

  const lbl = { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 6, display: 'block' } as React.CSSProperties

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Link href="/admin" style={{ color: C.textMuted, fontSize: 13, textDecoration: 'none' }}>← Admin</Link>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            Bowl<span style={{ color: '#f5c200' }}>kollen</span>
            <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 10 }}>BITS Sync</span>
          </div>
        </div>

        {/* Season selector */}
        <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <label style={lbl}>SÄSONG</label>
          <select style={inp} value={season} onChange={e => setSeason(Number(e.target.value))}>
            {[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Sync actions */}
        <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 16 }}>STEG 1 — KÖR I ORDNING</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Hämtar alla divisioner för säsongen (~115 st)
              </div>
              <button style={btn(loading === 'divisions')} onClick={() => run('divisions', `Divisioner ${season}`)}>
                {loading === 'divisions' ? 'Syncar...' : `1. Synca divisioner (${season})`}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Hämtar alla bowlingklubbar i Sverige
              </div>
              <button style={btn(loading === 'clubs')} onClick={() => run('clubs', `Klubbar ${season}`)}>
                {loading === 'clubs' ? 'Syncar...' : '2. Synca klubbar'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Hämtar lag för alla aktiva klubbar — kan ta 2–3 min
              </div>
              <button style={btn(loading === 'teams')} onClick={() => run('teams', `Lag ${season}`)}>
                {loading === 'teams' ? 'Syncar (vänta)...' : '3. Synca lag (alla klubbar)'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Hämtar alla matcher för alla divisioner — kan ta 5–10 min
              </div>
              <button style={btn(loading === 'matches_season')} onClick={() => run('matches_season', `Matcher ${season}`)}>
                {loading === 'matches_season' ? 'Syncar (vänta)...' : `4. Synca matcher för ${season}`}
              </button>
            </div>
          </div>
        </div>

        {/* Exact results — primary path */}
        <div style={{ background: C.card, border: '1px solid ' + C.accent, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 4 }}>STEG 2 — EXAKTA RESULTAT (rekommenderat)</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
            Hämtar varje spelares riktiga namn + licensnummer direkt från BITS&apos; egen källa (matchResult/GetMatchResults) — samma data som visas i deras &quot;högsta serie&quot;-tabell. Ingen gissning, ingen tvetydighet. Ersätter steg 3a–3e för alla nya matcher. Kör tills klart (kan ta en stund för alla gamla matcher).
          </div>
          <button style={btn(loading === 'exact_results_pending')} onClick={() => runUntilDone('exact_results_pending', 'Exakta resultat', { limit: 200 })}>
            {loading === 'exact_results_pending' ? 'Hämtar (kör tills klart)...' : 'Hämta exakta resultat (kör tills klart)'}
          </button>
        </div>

        {/* Scores — legacy fallback */}
        <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 4 }}>SPELARRESULTAT (legacy, reservplan)</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
            Äldre väg via abbreviated namn + steg 3a–3e nedan. Använd bara om steg 2 ovan inte fungerar för en match (saknad matchSchemeId).
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Hämtar resultat för avslutade matcher utan spelardata (max 50 åt gången)
              </div>
              <button style={btn(loading === 'scores_pending')} onClick={() => run('scores_pending', 'Spelarresultat (50 matcher)')}>
                {loading === 'scores_pending' ? 'Syncar...' : 'Hämta spelarresultat (nästa 50)'}
              </button>
            </div>

            <div>
              <label style={lbl}>ENSKILD MATCH-ID (BITS)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, flex: 1 }}
                  type="number"
                  placeholder="t.ex. 3263221"
                  value={matchId}
                  onChange={e => setMatchId(e.target.value)}
                />
                <button
                  style={{ ...btn(loading === 'scores_match'), whiteSpace: 'nowrap' }}
                  onClick={() => {
                    if (!matchId) return
                    run('scores_match', `Resultat match ${matchId}`, { matchId: Number(matchId) })
                  }}
                >
                  {loading === 'scores_match' ? '...' : 'Hämta'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Players */}
        <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 4 }}>STEG 3 — SPELARREGISTER</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
            Kör dessa en gång (och sedan igen vid säsongsstart). Steg 3b kopplar förkortade namn i resultat till riktiga spelar-ID — kör alltid efter 3a.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Hämtar ~55 000 licensierade spelare från SvBF. Tar 2–4 min. Inga licensnummer visas i appen.
              </div>
              <button style={btn(loading === 'players')} onClick={() => run('players', 'Spelarregister (alla)')}>
                {loading === 'players' ? 'Syncar (~55k spelare)...' : '3a. Synca spelarregister'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Matchar förkortade namn i matchresultat mot spelarregistret. Löser entydiga namn automatiskt.
              </div>
              <button style={btn(loading === 'resolve_players')} onClick={() => run('resolve_players', 'Lös spelar-ID')}>
                {loading === 'resolve_players' ? 'Löser...' : '3b. Lös spelar-ID i resultat'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                För namn som fortfarande är förkortade (t.ex. &quot;L. Andersson&quot; matchar 150+ spelare nationellt): smalnar av kandidaterna med spelarens klubb, härledd från vilket lag de spelade för i matchen. Kör efter 3b.
              </div>
              <button style={btn(loading === 'resolve_players_by_club')} onClick={() => run('resolve_players_by_club', 'Lös spelar-ID via klubb')}>
                {loading === 'resolve_players_by_club' ? 'Löser...' : '3c. Lös kvarvarande namn via klubb'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Vissa spelare har dubbel klubblicens (kontrakt/lån, t.ex. spelar för ett damlag på ett annat klubbnamn än sin hemmaklubb) — då matchar 3c inte. Hämtar avtalsdata per spelare och fortsätter automatiskt i omgångar tills allt är klart (kan ta några minuter, en enda klick räcker).
              </div>
              <button style={btn(loading === 'player_agreements')} onClick={() => runUntilDone('player_agreements', 'Avtalsdata')}>
                {loading === 'player_agreements' ? 'Hämtar (kör automatiskt tills klart)...' : '3d. Hämta avtalsdata (kör tills klart)'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
                Matchar olösta namn mot spelarens kontraktsklubb (från 3d). Kör efter varje omgång av 3d.
              </div>
              <button style={btn(loading === 'resolve_players_by_agreement')} onClick={() => run('resolve_players_by_agreement', 'Lös spelar-ID via avtal')}>
                {loading === 'resolve_players_by_agreement' ? 'Löser...' : '3e. Lös kvarvarande namn via avtalsklubb'}
              </button>
            </div>
          </div>
        </div>

        {/* Bug fix */}
        <div style={{ background: C.card, border: '1px solid #e05555', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e05555', letterSpacing: 1, marginBottom: 4 }}>ENGÅNGSFIX — HEMMA/BORTA</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
            Rättar en bugg där spelare kunde hamna i fel lag i resultaten (fel kolumn i BITS-svaret användes för hemma/borta-uppdelning). Kör en gång — säker att köra flera gånger.
          </div>
          <button style={btn(loading === 'fix_home_team')} onClick={() => run('fix_home_team', 'Fixa hemma/borta')}>
            {loading === 'fix_home_team' ? 'Fixar...' : 'Fixa hemma/borta-tilldelning'}
          </button>
        </div>

        {/* Log */}
        {logs.length > 0 && (
          <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 12 }}>LOGG</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ background: C.surface, borderRadius: 8, padding: '10px 14px', border: '1px solid ' + (log.result.ok ? C.border : '#e05555') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: log.result.ok ? C.text : '#e05555' }}>
                      {log.result.ok ? '✓' : '✗'} {log.action}
                    </span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{log.ts}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    {log.result.synced} synkade · {log.result.skipped} hoppade över
                    {log.result.errors.length > 0 && (
                      <div style={{ color: '#e05555', marginTop: 4 }}>
                        {log.result.errors.slice(0, 3).map((e, j) => (
                          <div key={j} style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{e}</div>
                        ))}
                        {log.result.errors.length > 3 && (
                          <div style={{ fontSize: 11 }}>+{log.result.errors.length - 3} fler fel</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
