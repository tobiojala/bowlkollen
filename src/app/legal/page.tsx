'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { SectionHeader } from '@/components/ui'

const YEAR = new Date().getFullYear()

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <SectionHeader label={title} className="border-0 px-0 py-0 mb-2.5" />
      <div className="text-sm leading-relaxed text-dark-muted">{children}</div>
    </section>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 last:mb-0">{children}</p>
}

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app px-5 py-6 pb-12">

        <header className="mb-9">
          <h1 className="mb-1.5 text-[22px] font-black bk-text-primary">Bowlkollen™</h1>
          <p className="text-xs text-dark-muted">Juridisk information & upphovsrätt</p>
          <div className="mt-4 rounded-xl border border-gold/20 bg-gold/[0.07] px-4 py-3 text-xs leading-relaxed text-dark-muted">
            © {YEAR} Tobias Ek-Ojala. Alla rättigheter förbehålls.
          </div>
        </header>

        <Section title="UPPHOVSRÄTT">
          <P>
            Bowlkollen — inklusive all källkod, gränssnittdesign, layouter, animationer, logotyper
            och övriga kreativa verk — är upphovsskyddat material som tillhör{' '}
            <strong className="bk-text-primary">Tobias Ek-Ojala</strong>, © {YEAR}.
          </P>
          <P>
            Skyddet är automatiskt från och med skapandet och regleras av{' '}
            <em>lag (1960:729) om upphovsrätt till litterära och konstnärliga verk</em> samt
            EU:s direktiv 2009/24/EG om rättsligt skydd för datorprogram.
          </P>
          <P>
            Datorprogram utgör litterära verk i lagens mening (1 § URL) och åtnjuter fullt
            upphovsrättsligt skydd.
          </P>
        </Section>

        <Section title="INGA TILLSTÅND GES">
          <P>
            Ingenting i Bowlkollen — vare sig källkod, design, layout, interaktionsmönster,
            färgsättning, typografi eller innehåll — får utan skriftligt tillstånd från
            rättighetsinnehavaren:
          </P>
          <ul className="mb-2.5 flex list-disc flex-col gap-1 pl-5">
            {[
              'reproduceras eller kopieras, helt eller delvis',
              'distribueras eller spridas vidare',
              'modifieras eller bearbetas',
              'visas offentligt eller användas kommersiellt',
              'säljas, licensieras eller på annat sätt utnyttjas',
            ].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="GRÄNSSNITTETS DESIGN">
          <P>
            Applikationens visuella utformning — inklusive layout, färgpalett, typografi,
            animationsdesign och navigationsstruktur — utgör ett originellt konstnärligt verk
            och är skyddat som sådant.
          </P>
          <P>
            Att efterlikna eller reproducera designen, även utan att kopiera källkoden, kan
            utgöra upphovsrättsintrång.
          </P>
        </Section>

        <Section title="VARUMÄRKE">
          <P>
            Namnet <strong className="bk-text-primary">Bowlkollen™</strong> och
            tillhörande logotyp är Tobias Ek-Ojalas egendom.
            Användning av namnet i kommersiella, vilseledande eller konkurrenssnedvridande
            syften är inte tillåten.
          </P>
          <P>
            Varumärkesregistrering vid PRV (Patent- och registreringsverket) kan komma att
            sökas.
          </P>
        </Section>

        <Section title="DATA OCH ANSVARSFRISKRIVNING">
          <P>
            Matchresultat, serietabeller och tävlingsinformation tillhandahålls i informationssyfte
            och utan garanti för korrekthet, fullständighet eller aktualitet.
          </P>
          <P>
            Bowlkollen har inget officiellt samband med Svenska Bowlingförbundet (STBF) eller
            Svenska Bowlingsällskapet. Eventuell användning av förbundets data sker i enlighet
            med offentligt tillgänglig information.
          </P>
        </Section>

        <Section title="ÖPPEN KÄLLKOD — TREDJEPARTSBIBLIOTEK">
          <P>
            Bowlkollen använder öppen källkod-bibliotek, däribland Next.js, React, Framer Motion,
            Supabase och Lucide Icons. Dessa är licensierade under MIT- och Apache 2.0-licenser
            av respektive upphovsmän.
          </P>
          <P>
            Användningen av dessa bibliotek påverkar inte äganderätten till Bowlkollens egna
            källkod, design och övriga kreativa verk, vilka förblir Tobias Ek-Ojalas
            exklusiva egendom.
          </P>
        </Section>

        <Section title="TILLÄMPLIG LAG">
          <P>
            Dessa villkor lyder under svensk rätt. Eventuella tvister ska avgöras av svensk
            allmän domstol med Göteborgs tingsrätt som första instans, om inte annat följer
            av tvingande lagstiftning.
          </P>
        </Section>

        <Section title="KONTAKT">
          <P>
            Frågor om licensiering, tillstånd, datakällor eller andra rättsliga frågor —
            kontakta rättighetsinnehavaren:
          </P>
          <Link
            href="mailto:tobias.bergmark@gmail.com"
            className="text-sm font-bold text-gold no-underline"
          >
            tobias.bergmark@gmail.com
          </Link>
        </Section>

        <div className="mt-2 border-t border-light-border pt-6 dark:border-dark-border">
          <p className="m-0 text-[11px] leading-relaxed text-dark-muted">
            <em>
              English summary: Bowlkollen is proprietary software. All source code, UI design,
              layout, and associated assets are copyright © {YEAR} Tobias Ek-Ojala.
              No licence is granted to use, copy, modify, or distribute any part of this
              work without explicit written permission. Third-party open-source libraries
              used within the application retain their respective licences.
            </em>
          </p>
        </div>

      </div>
    </main>
  )
}
