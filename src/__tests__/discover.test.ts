import { describe, it, expect } from 'vitest'
import { buildPlayerNameFilter, escapeLike, divisionMatches } from '@/lib/discover'

describe('buildPlayerNameFilter', () => {
  it('matches either column for a single term', () => {
    expect(buildPlayerNameFilter('malin')).toBe(
      'first_name.ilike.%malin%,sur_name.ilike.%malin%'
    )
  })

  it('matches full names in either order', () => {
    expect(buildPlayerNameFilter('malin andersson')).toBe(
      'and(first_name.ilike.%malin%,sur_name.ilike.%andersson%),' +
      'and(first_name.ilike.%andersson%,sur_name.ilike.%malin%)'
    )
  })

  it('joins three or more terms into the surname side', () => {
    expect(buildPlayerNameFilter('anna maria svensson')).toContain(
      'and(first_name.ilike.%anna%,sur_name.ilike.%maria svensson%)'
    )
  })

  it('collapses extra whitespace', () => {
    expect(buildPlayerNameFilter('  malin   andersson  ')).toBe(
      buildPlayerNameFilter('malin andersson')
    )
  })

  it('returns empty string for blank input', () => {
    expect(buildPlayerNameFilter('   ')).toBe('')
  })
})

describe('escapeLike', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeLike('50%_a')).toBe('50\\%\\_a')
  })

  it('strips PostgREST reserved delimiters', () => {
    expect(escapeLike('a,b(c).')).toBe('a b c')
  })
})

describe('divisionMatches', () => {
  it('matches case-insensitively on substrings', () => {
    expect(divisionMatches('Elitserien Herrar', 'elit')).toBe(true)
    expect(divisionMatches('Division 1 Södra Götaland', 'götaland')).toBe(true)
  })

  it('rejects blank queries and non-matches', () => {
    expect(divisionMatches('Elitserien Herrar', '  ')).toBe(false)
    expect(divisionMatches('Elitserien Herrar', 'allsvenskan')).toBe(false)
  })
})
