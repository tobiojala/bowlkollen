// CSV generation. Opens directly in Excel / Numbers / Sheets, no dependency.
// The builder is pure; the download helper is browser-only.

type Cell = string | number | null | undefined

/** Quote a cell if it contains a comma, quote, or newline (RFC 4180). */
function csvCell(v: Cell): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map(r => r.map(csvCell).join(','))
  // Prepend a BOM so Excel reads UTF-8 (åäö) correctly.
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** Trigger a client-side file download from a text string. Browser only. */
export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Slugify a name into a safe filename stem. */
export function fileStem(name: string): string {
  return name
    .toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'export'
}
