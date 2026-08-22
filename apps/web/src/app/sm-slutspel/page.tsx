import { redirect } from 'next/navigation'

// Retired as a standalone page. SM-slutspel now lives on the Elitserien division
// pages (per gender, driven by the season pill). Send stragglers to browse.
export default function SmSlutspelPage() {
  redirect('/schema')
}
