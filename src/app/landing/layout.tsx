import SubscribeForm from './SubscribeForm'

const FEATURES = [
  { icon: '📡', title: 'Live-resultat', desc: 'Följ matcher i realtid, pin för pin.' },
  { icon: '📊', title: 'Statistik & ranking', desc: 'Djup spelarstatistik och ligatabeller.' },
  { icon: '🎳', title: 'Alla divisioner', desc: 'Elit till distrikt – hela svenska bowlingen på ett ställe.' },
  { icon: '🔔', title: 'Notiser', desc: 'Få push-notiser när ditt lag spelar.' },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0c1220 0%, #10161e 50%, #0e1a2a 100%)', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
        <header style={{ paddingTop: 56, textAlign: 'center' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(245,194,0,0.1)', border: '2px solid rgba(245,194,0,0.25)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎳</div>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: 0 }}>Bowlkollen</h1>
          <div style={{ display: 'inline-block', marginTop: 12, padding: '4px 12px', background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.3)', borderRadius: 20, fontSize: 11, fontWeight: 800, color: '#f5c200', letterSpacing: 1.5 }}>KOMMER SNART</div>
          <p style={{ marginTop: 20, fontSize: 18, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Den nya appen för svensk bowlingsport.{' '}
            <span style={{ color: '#fff', fontWeight: 600 }}>Live-resultat, statistik och allt om din förening</span>{' '}
            – samlat på ett ställe.
          </p>
        </header>
        <section style={{ marginTop: 40, marginBottom: 56 }}>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Var först att veta när vi lanserar</p>
          <SubscribeForm />
        </section>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 48 }} />
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', marginBottom: 28, textTransform: 'uppercase' as const }}>Vad du får med Bowlkollen</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 18px' }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
        <section style={{ marginBottom: 56, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 20 }}>Följ oss på sociala medier</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' as const }}>
            {[['Instagram','https://instagram.com/bowlkollen'],['TikTok','https://tiktok.com/@bowlkollen'],['Facebook','https://facebook.com/bowlkollen']].map(([name, href]) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>{name}</a>
            ))}
          </div>
        </section>
        <footer style={{ paddingBottom: 48, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ margin: 0 }}>© 2026 Bowlkollen · <a href="/legal" style={{ color: 'inherit', textDecoration: 'none' }}>Integritetspolicy</a></p>
        </footer>
      </div>
    </div>
  )
}