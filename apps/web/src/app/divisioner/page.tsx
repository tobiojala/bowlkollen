import { redirect } from 'next/navigation'

// The division browse index now lives on /schema (search + all divisions).
// Division detail stays at /divisioner/[id].
export default function DivisionerPage() {
  redirect('/schema')
}
