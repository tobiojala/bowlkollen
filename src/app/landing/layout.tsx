import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Bowlkollen – Kommer snart',
  description: 'Bowlkollen – den nya appen för svensk bowlingsport.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children
}
