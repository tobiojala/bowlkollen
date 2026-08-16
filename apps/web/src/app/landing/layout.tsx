import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Bowlkollen – Live bowling för svenska ligor',
  description: 'Bowlkollen är appen för svensk bowlingsport. Följ live-resultat, djup spelarstatistik och alla divisioner – från Elitserien till distriktet – samlat på ett ställe.',
  keywords: ['bowling', 'svensk bowling', 'bowlingresultat', 'bowlingstatistik', 'elitserien bowling', 'bowlkollen', 'live bowling'],
  authors: [{ name: 'Bowlkollen' }],
  openGraph: {
    title: 'Bowlkollen – Live bowling för svenska ligor',
    description: 'Följ live-resultat, spelarstatistik och alla divisioner i svensk bowling. Anmäl dig för tidig tillgång.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Bowlkollen',
    locale: 'sv_SE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bowlkollen – Live bowling för svenska ligor',
    description: 'Följ live-resultat, spelarstatistik och alla divisioner i svensk bowling.',
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Bowlkollen',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'iOS, Android, Web',
  description: 'App för svensk bowlingsport med live-resultat, spelarstatistik och ligatabeller för alla divisioner.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK' },
  audience: { '@type': 'Audience', audienceType: 'Bowlare och bowlingintresserade i Sverige' },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
