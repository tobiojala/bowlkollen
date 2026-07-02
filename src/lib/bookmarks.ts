const KEY = 'bk_matches'

export type BookmarkedMatch = {
  id: string
  date: string        // full ISO datetime
  division: string
  round: number | null
  home: string        // team name
  away: string
  venue: string
}

export function getBookmarks(): BookmarkedMatch[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
  catch { return [] }
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some(b => b.id === id)
}

/** Returns true if the match was added, false if it was removed. */
export function toggleBookmark(m: BookmarkedMatch): boolean {
  const bks = getBookmarks()
  const idx = bks.findIndex(b => b.id === m.id)
  if (idx >= 0) {
    bks.splice(idx, 1)
    localStorage.setItem(KEY, JSON.stringify(bks))
    return false
  }
  bks.push(m)
  localStorage.setItem(KEY, JSON.stringify(bks))
  return true
}
