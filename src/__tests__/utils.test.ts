import { describe, it, expect } from 'vitest'
import {
  shortName, teamInitials, shortDiv, countdown, divTierColor, dateLabel, primaryDivision,
} from '@/lib/utils'

describe('primaryDivision', () => {
  it('picks the most-frequent division (league over playoff)', () => {
    const matches = [
      ...Array(18).fill({ division: 'Elitserien Herrar' }),
      ...Array(4).fill({ division: 'SM-slutspel Herrar' }),
    ]
    expect(primaryDivision(matches)).toBe('Elitserien Herrar')
  })

  it('ignores null divisions', () => {
    expect(primaryDivision([{ division: null }, { division: 'Division 1 Norra' }, { division: null }]))
      .toBe('Division 1 Norra')
  })

  it('returns null when there are no divisions', () => {
    expect(primaryDivision([])).toBeNull()
    expect(primaryDivision([{ division: null }])).toBeNull()
  })
})

describe('shortName', () => {
  it('strips team-suffix tokens', () => {
    expect(shortName('Stockholms BK A')).toBe('Stockholms BK')
    expect(shortName('Falköping DA')).toBe('Falköping')
    expect(shortName('Örebro F')).toBe('Örebro')
  })
  it('leaves plain names untouched and is null-safe', () => {
    expect(shortName('Team Bowl')).toBe('Team Bowl')
    expect(shortName('')).toBe('')
    // @ts-expect-error — guards against undefined at runtime
    expect(shortName(undefined)).toBe('')
  })
})

describe('teamInitials', () => {
  it('takes up to three uppercased initials of the short name', () => {
    expect(teamInitials('Stockholms BK')).toBe('SB')
    expect(teamInitials('Karlstad Bowling Klubb')).toBe('KBK')
    expect(teamInitials('Team Alfa Beta Gamma')).toBe('TAB')
  })
})

describe('shortDiv', () => {
  it('abbreviates division names', () => {
    expect(shortDiv('Elitserien Herrar')).toBe('Elit. H')
    expect(shortDiv('Allsvenskan Damer')).toBe('Allsv. D')
    expect(shortDiv('Div 1 Norra Götaland Herrar')).toBe('D1 N.Götal. H')
  })
})

describe('divTierColor', () => {
  it('maps each tier to its categorical colour', () => {
    expect(divTierColor('Elitserien Herrar')).toBe('#f5c200')
    expect(divTierColor('Allsvenskan Herrar')).toBe('#5a82b4')
    expect(divTierColor('Div 1 Norra')).toBe('#38a088')
    expect(divTierColor('Division 2 Syd')).toBe('#9b6dbd')
  })
  it('falls back for null', () => {
    expect(divTierColor(null)).toBe('rgba(160,175,200,0.55)')
  })
})

describe('countdown', () => {
  it('returns null once the date has passed', () => {
    expect(countdown(new Date(0).toISOString(), 1000)).toBeNull()
  })
  it('formats days+hours when more than a day out', () => {
    const target = new Date(50 * 3_600_000).toISOString() // 2d 2h after epoch
    expect(countdown(target, 0)).toBe('2d 2h')
  })
  it('formats hours+minutes within a day', () => {
    const target = new Date((5 * 3600 + 30 * 60) * 1000).toISOString()
    expect(countdown(target, 0)).toBe('5h 30m')
  })
  it('formats mm:ss within the hour', () => {
    const target = new Date((3 * 60 + 7) * 1000).toISOString()
    expect(countdown(target, 0)).toBe('03:07')
  })
})

describe('dateLabel', () => {
  it('labels today and yesterday', () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    expect(dateLabel(today)).toBe('IDAG')
    expect(dateLabel(yesterday)).toBe('IGÅR')
  })
})
