import type { Metadata } from 'next'
import PublicHeader from '@/components/PublicHeader'
import { COLOR, SPACE, RADIUS } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Annonsera · Bowlkollen',
  description: 'Nå spelare, lag och klubbar i hela Sverige — annonsera i Bowlkollens flöde.',
}

// The house-promo's destination: an honest pitch to bowling businesses (centres,
// pro shops, brands, competitions) about advertising in the feed. Contact email
// below is a placeholder — swap for the real inbox/alias.
const CONTACT = 'annons@bowlkollen.se'

const AUDIENCE = [
  { h: 'Hallar', b: 'Fyll banorna. Nå spelare som redan letar match, träning och tävling.' },
  { h: 'Proshops', b: 'Klot, borrning, utrustning — visa upp er för spelare som utvecklar sitt spel.' },
  { h: 'Varumärken', b: 'Möt en engagerad bowlingpublik i hela landet, från elit till division.' },
  { h: 'Tävlingar', b: 'Sprid er inbjudan direkt i flödet, framför rätt spelare i rätt region.' },
]

export default function AnnonseraPage() {
  return (
    <>
      <PublicHeader />
      <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px' }}>

          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: COLOR.gold, textTransform: 'uppercase' }}>
            Annonsplats
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '12px 0 16px' }}>
            Nå Sveriges bowlare
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: COLOR.ink2, maxWidth: '60ch', margin: 0 }}>
            Bowlkollen samlar spelare, lag och klubbar kring seriespel, statistik och tävlingar.
            Er annons sitter mitt i flödet — där bowlingintresset redan finns — inte i en banner
            vid sidan om.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: SPACE[3], marginTop: SPACE[8] }}>
            {AUDIENCE.map(({ h, b }) => (
              <div key={h} style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: COLOR.ink }}>{h}</div>
                <div style={{ fontSize: 15, lineHeight: 1.5, color: COLOR.ink2, marginTop: SPACE[2] }}>{b}</div>
              </div>
            ))}
          </div>

          <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[6], marginTop: SPACE[8],
            display: 'flex', flexDirection: 'column', gap: SPACE[3], alignItems: 'flex-start' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Vill ni synas här?</div>
            <p style={{ fontSize: 16, lineHeight: 1.55, color: COLOR.ink2, margin: 0, maxWidth: '58ch' }}>
              Hör av er så tar vi fram ett upplägg som passar er — format, räckvidd och pris.
            </p>
            <a href={`mailto:${CONTACT}?subject=Annonsering%20p%C3%A5%20Bowlkollen`}
              style={{ marginTop: SPACE[2], padding: '13px 22px', background: COLOR.gold, color: '#151005',
                borderRadius: RADIUS.md, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Kontakta oss →
            </a>
            <div style={{ fontSize: 14, color: COLOR.ink3 }}>{CONTACT}</div>
          </div>

        </div>
      </main>
    </>
  )
}
