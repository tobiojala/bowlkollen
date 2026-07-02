'use client'

import { useColors } from '@/components/ThemeProvider'

const YEAR = new Date().getFullYear()

export default function LegalPage() {
  const { C, isDark } = useColors()

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.accent, letterSpacing: 1.5, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )

  const P = ({ children }: { children: React.ReactNode }) => (
    <p style={{ margin: '0 0 10px' }}>{children}</p>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 6 }}>
            Bowlkollen™
          </div>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Juridisk information &amp; upphovsrätt
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12,
            background: isDark ? 'rgba(245,194,0,0.07)' : 'rgba(245,194,0,0.08)',
            border: '1px solid rgba(245,194,0,0.2)', fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
            © {YEAR} Tobias Ek-Ojala. Alla rättigheter förbehålls.
          </div>
        </div>

        <Section title="UPPHOVSRÄTT">
          <P>
            Bowlkollen — inklusive all källkod, gränssnittdesign, layouter, animationer, logotyper
            och övriga kreativa verk — är upphovsskyddat material som tillhör{' '}
            <strong style={{ color: C.text }}>Tobias Ek-Ojala</strong>, © {YEAR}.
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
          <ul style={{ margin: '0 0 10px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            Namnet <strong style={{ color: C.text }}>Bowlkollen™</strong> och
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

        <Section title="PERSONUPPGIFTER & COOKIES">
          <P>
            Personuppgiftsansvarig är <strong style={{ color: C.text }}>Tobias Ek-Ojala</strong>,
            kontaktbar enligt avsnittet KONTAKT nedan.
          </P>
          <P>
            <strong style={{ color: C.text }}>Konto.</strong> Vid inloggning (via Google eller
            engångslänk till din e-post) sparar Supabase din e-postadress och, vid inloggning
            med Google, ditt namn och din profilbild. Detta används för att applikationen ska
            fungera — visa vem du är inloggad som, komma ihåg din session. Vilka lag och
            spelare du följer kopplas till ditt konto.
          </P>
          <P>
            <strong style={{ color: C.text }}>Spelarkoppling.</strong> Om du kopplar ditt konto
            till en spelarprofil kan du frivilligt ange ditt licensnummer för att verifiera
            kopplingen direkt. Numret jämförs mot bowlingregistret men sparas aldrig — vare sig
            kopplingen lyckas eller inte. Vad som sparas är enbart att kopplingen gjorts och
            dess status (väntande eller verifierad).
          </P>
          <P>
            <strong style={{ color: C.text }}>Cookies innan inloggning.</strong> En anonym,
            slumpgenererad enhets-identifierare (cookien <code>bk_anon_id</code>) kommer ihåg
            vilken spelar- eller lagsida du senast besökt, enbart för att kunna föreslå vem du
            vill följa direkt efter att du skapat konto. Den är inte kopplad till namn, e-post
            eller annan personuppgift, sparas i högst 30 dagar och raderas automatiskt så snart
            den använts vid kontoskapande.
          </P>
          <P>
            <strong style={{ color: C.text }}>Inbjudningslänkar.</strong> Under en period med
            begränsad åtkomst används en cookie (<code>bk_invite</code>) för att komma ihåg att
            du kommit in via en giltig inbjudningslänk. Om du skapar konto via en sådan länk
            sparas vilken inbjudningskod du använde, kopplad till ditt konto, för att vi ska
            kunna se vilka inbjudningar som lett till nya konton.
          </P>
          <P>
            <strong style={{ color: C.text }}>Nyhetsbrev.</strong> Anmäler du dig till
            nyhetsbrevet på landningssidan sparas din e-postadress hos oss och hos Mailchimp,
            vår leverantör för utskick. Detta är skilt från ett vanligt konto.
          </P>
          <P>
            <strong style={{ color: C.text }}>Felrapportering.</strong> Om vi har aktiverat
            automatisk felrapportering (Sentry) loggas tekniska felmeddelanden för att vi ska
            kunna åtgärda buggar. Vid ett fel kan en kort skärminspelning av det som hände i
            appen just då sparas, enbart i felsökningssyfte.
          </P>
          <P>
            <strong style={{ color: C.text }}>Speldata.</strong> Matchresultat, serier och
            licensnummer för svenska bowlare kommer från Svenska Bowlingförbundets officiella
            register (BITS) — Bowlkollen samlar inte in denna information självt, se avsnittet
            DATA OCH ANSVARSFRISKRIVNING. Licensnumret visas aldrig i appen och används enbart
            internt, bland annat för att avgöra om en spelarprofil tillhör en minderårig — i så
            fall är profilen synlig men kan inte följas förrän den verifierats av spelaren
            själv (vid myndighetsålder), vårdnadshavare eller lagledare.
          </P>
        </Section>

        <Section title="DINA RÄTTIGHETER">
          <P>
            Enligt EU:s dataskyddsförordning (GDPR) har du rätt att få veta vilka
            personuppgifter vi har om dig, få felaktiga uppgifter rättade, begära att dina
            uppgifter raderas, och invända mot eller begränsa vår behandling av dem.
          </P>
          <P>
            Det finns för närvarande ingen funktion i appen för att radera kontot själv —
            kontakta oss så raderar vi ditt konto och tillhörande data. Vi besvarar alla
            sådana förfrågningar utan onödigt dröjsmål.
          </P>
          <P>
            Detta avsnitt beskriver vår nuvarande praxis och kan komma att uppdateras i takt
            med att appen utvecklas.
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
          <a href="mailto:tobias.bergmark@gmail.com"
            style={{ color: C.accent, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
            tobias.bergmark@gmail.com
          </a>
        </Section>

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 24, marginTop: 8 }}>
          <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
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
