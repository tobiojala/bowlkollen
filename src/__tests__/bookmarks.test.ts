import { test, expect, beforeEach } from 'vitest'
import { getBookmarks, isBookmarked, toggleBookmark } from '@/lib/bookmarks'

const store: Record<string, string> = {}

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
  },
  writable: true,
  configurable: true,
})

const M = {
  id: 'abc', date: '2026-08-15T19:00:00', division: 'Elitserien Herrar',
  round: 14, home: 'Örebro BK', away: 'Malmö BK', venue: 'Lucky Bowl',
}

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]) })

test('getBookmarks returns empty array by default', () => {
  expect(getBookmarks()).toEqual([])
  expect(isBookmarked('abc')).toBe(false)
})

test('toggleBookmark adds a match and returns true', () => {
  expect(toggleBookmark(M)).toBe(true)
  expect(isBookmarked('abc')).toBe(true)
  expect(getBookmarks()).toHaveLength(1)
})

test('toggleBookmark called twice removes the match', () => {
  toggleBookmark(M)
  expect(toggleBookmark(M)).toBe(false)
  expect(isBookmarked('abc')).toBe(false)
  expect(getBookmarks()).toHaveLength(0)
})

test('multiple bookmarks are independent', () => {
  const M2 = { ...M, id: 'xyz', home: 'Team A', away: 'Team B' }
  toggleBookmark(M)
  toggleBookmark(M2)
  expect(getBookmarks()).toHaveLength(2)
  toggleBookmark(M)
  expect(getBookmarks()).toHaveLength(1)
  expect(isBookmarked('xyz')).toBe(true)
})
