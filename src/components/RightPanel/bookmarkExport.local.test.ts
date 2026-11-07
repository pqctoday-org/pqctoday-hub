// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import {
  bookmarkExportCsv,
  bookmarkExportData,
  type BookmarkExportSelection,
} from './bookmarkExport'
const selection: BookmarkExportSelection = {
  libraryBookmarks: ['lib,quoted'],
  migrateProducts: ['stable-a', 'stable-b', 'unknown-id'],
  myLearnModules: ['module'],
  myTimelineCountries: ['Sample\nCountry'],
  myThreats: ['threat'],
  myPlaygroundTools: ['tool'],
}
const name = (id: string) =>
  id === 'stable-a' ? 'Provider, "One"\nEdition' : id === 'stable-b' ? '=Formula-looking label' : id

describe('Bookmark export preserves identities and rows', () => {
  it('round-trips CSV fields containing commas, quotes and newlines using the shared formula guard', () => {
    const csv = bookmarkExportCsv(selection, name)
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })
    expect(parsed.errors).toEqual([])
    expect(parsed.data).toHaveLength(8)
    expect(parsed.data.filter((row) => row.type === 'migrate').map((row) => row.id)).toEqual(
      selection.migrateProducts
    )
    expect(parsed.data.find((row) => row.id === 'stable-a')?.label).toBe('Provider, "One"\nEdition')
    expect(parsed.data.find((row) => row.id === 'stable-b')?.label).toBe("'=Formula-looking label")
    expect(parsed.data.find((row) => row.type === 'timeline')?.id).toBe('Sample\nCountry')
  })
  it('keeps JSON product IDs and labels separately, including unresolved IDs', () => {
    const data = JSON.parse(JSON.stringify(bookmarkExportData(selection, name, 'sample time')))
    expect(data.migrateProducts).toEqual(selection.migrateProducts)
    expect(data.migrateProductLabels['stable-a']).toBe(name('stable-a'))
    expect(data.migrateProductLabels['unknown-id']).toBe('unknown-id')
    expect(data.libraryBookmarks).toEqual(selection.libraryBookmarks)
    expect(data.exportedAt).toBe('sample time')
  })
})
