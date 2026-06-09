import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Bowlkollen – Kommer snart',
  description: 'Den nya appen för svensk bowlingsport. Live-resultat, statistik och allt om din förening – samlat på ett ställe.',
  openGraph: {
    title: 'Bowlkollen – Kommer snart',
    description: 'Den nya appen för svensk bowlingsport. Anmäl dig för tidig tillgång.',
    type: 'website',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children
}
