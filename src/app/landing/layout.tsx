import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Bowlkollen – Kommer snart',
  description: 'Bowlkollen – den nya appen för svensk bowlingsport. Registrera din e-post för att få nyheter och uppdateringar.',
  openGraph: {
    title: 'Bowlkollen – Kommer snart',
    description: 'Live-resultat, statistik och allt om svensk bowling. Anmäl dig för att få nyheter först.',
    type: 'website',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children
}
