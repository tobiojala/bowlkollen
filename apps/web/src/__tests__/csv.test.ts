import { describe, it, expect } from 'vitest'
import { toCsv, fileStem } from '@/lib/csv'

describe('toCsv', () => {
  it('prepends a UTF-8 BOM and uses CRLF rows', () => {
    const csv = toCsv(['A', 'B'], [[1, 2]])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('A,B\r\n1,2')
  })

  it('quotes cells containing commas, quotes or newlines', () => {
    const csv = toCsv(['X'], [['a,b'], ['he said "hi"'], ['line\nbreak']])
    expect(csv).toContain('"a,b"')
    expect(csv).toContain('"he said ""hi"""')
    expect(csv).toContain('"line\nbreak"')
  })

  it('renders null/undefined as empty cells', () => {
    const csv = toCsv(['A', 'B'], [[null, undefined]])
    expect(csv).toContain('\r\n,\r\n')
  })
})

describe('fileStem', () => {
  it('slugifies Swedish names into safe filenames', () => {
    expect(fileStem('Div 3 Västra Svealand 2')).toBe('div-3-vastra-svealand-2')
    expect(fileStem('Elitserien Herrar')).toBe('elitserien-herrar')
  })

  it('falls back to "export" when nothing usable remains', () => {
    expect(fileStem('—')).toBe('export')
  })
})
