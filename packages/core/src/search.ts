// Player name search shared by web + native. A full "Förnamn Efternamn" query
// must match first_name AND sur_name across separate fields — matching the whole
// string against either field finds nothing (the long-standing full-name bug).
//
// Usage: AND one `.or(first_name.ilike.%w%,sur_name.ilike.%w%)` per token, so
// every word must appear in some name field (any order, middle names included):
//   for (const w of playerSearchTokens(q))
//     query = query.or(`first_name.ilike.%${w}%,sur_name.ilike.%${w}%`)
//
// Metacharacters are stripped so a token can't break the PostgREST .or() grammar.
export function playerSearchTokens(q: string): string[] {
  return q.split(/\s+/).map(w => w.replace(/[%,()*]/g, '')).filter(Boolean);
}
