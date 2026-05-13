import { createClient } from '@/lib/supabase'

export default async function Home() {
  const supabase = createClient()

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .limit(1)

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .limit(6)

  const season = seasons?.[0]

  const bg = '#10161e'
  const surface = '#172030'
  const card = '#1c2840'
  const border = '#2a3858'
  const accent = '#f5c200'
  const textMuted = '#6b7a99'

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: surface, borderBottom: '1px solid ' + border, padding: '16px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              Bowl<span style={{ color: accent }}>kollen</span>
            </div>
            <div style={{ fontSize: 10, color: textMuted, letterSpacing: 2, marginTop: 2 }}>
              LIVE BOWLINGSAJT
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
  <a href="/players" style={{ fontSize: 12, color: textMuted, background: card, padding: '6px 14px', borderRadius: 8, border: '1px solid ' + border, textDecoration: 'none' }}>
    Spelare
  </a>
  <a href="/teams" style={{ fontSize: 12, color: textMuted, background: card, padding: '6px 14px', borderRadius: 8, border: '1px solid ' + border, textDecoration: 'none' }}>
    Lag
  </a>
  <a href="/admin" style={{ fontSize: 12, color: textMuted, background: card, padding: '6px 14px', borderRadius: 8, border: '1px solid ' + border, textDecoration: 'none' }}>
    Admin
  </a>
</div>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 2, marginBottom: 16 }}>
            LIVE NU
          </div>
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 24, textAlign: 'center', color: textMuted, fontSize: 13 }}>
            Inga live-matcher just nu
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 2 }}>LAG</div>
            <a href="/teams" style={{ fontSize: 12, color: accent, fontWeight: 600, textDecoration: 'none' }}>Se alla</a>
          </div>
          {teams && teams.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {teams.map(team => (
                <a key={team.id} href={'/teams/' + team.id} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 16, textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>{team.name}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{team.club}</div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 24, textAlign: 'center', color: textMuted, fontSize: 13 }}>
              Inga lag ännu — lägg till via Admin
            </div>
          )}
        </section>
      </div>
    </main>
  )
}