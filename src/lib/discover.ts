// Discover search helpers — pure functions, tested in src/__tests__/discover.test.ts

/** PostgREST `or()` filter for player-name search that survives full names.
 *
 * A single term matches either column; multiple terms ("malin andersson",
 * "andersson malin") must land with one term in first_name and another in
 * sur_name — in either order. Naive `first_name.ilike OR sur_name.ilike`
 * on the whole string matches nothing for full names, which is the single
 * most common search there is.
 */
export function buildPlayerNameFilter(q: string): string {
  const terms = q.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return ''
  const like = (t: string) => `%${escapeLike(t)}%`
  if (terms.length === 1) {
    return `first_name.ilike.${like(terms[0])},sur_name.ilike.${like(terms[0])}`
  }
  // Two or more terms: first vs rest, and rest vs first (either order).
  const [head, ...rest] = terms
  const tail = rest.join(' ')
  return [
    `and(first_name.ilike.${like(head)},sur_name.ilike.${like(tail)})`,
    `and(first_name.ilike.${like(tail)},sur_name.ilike.${like(head)})`,
  ].join(',')
}

/** Escape LIKE wildcards and PostgREST reserved chars in user input. */
export function escapeLike(term: string): string {
  return term.replace(/[%_,().]/g, ch => (ch === ',' || ch === '(' || ch === ')' || ch === '.' ? ' ' : `\\${ch}`)).trim()
}

/** Case-insensitive substring match for client-side division search. */
export function divisionMatches(divisionName: string, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (needle.length === 0) return false
  return divisionName.toLowerCase().includes(needle)
}
