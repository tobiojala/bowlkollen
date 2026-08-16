import AddBallClient from './_components/AddBallClient'

// Add a ball to the bag. Catalog type-ahead when seeded/partnered; always falls
// back to free entry, so the arsenal works with no catalog at all.
export default function AddBallPage() {
  return <AddBallClient />
}
