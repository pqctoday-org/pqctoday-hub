// SPDX-License-Identifier: AGPL-3.0-only
import { generateCsv } from '@/utils/csvExport'

export interface BookmarkExportSelection {
  libraryBookmarks: string[]
  migrateProducts: string[]
  myLearnModules: string[]
  myTimelineCountries: string[]
  myThreats: string[]
  myPlaygroundTools: string[]
}

/** Keep identities separate from the reader-facing catalogue names. */
export function bookmarkExportData(
  selection: BookmarkExportSelection,
  productName: (id: string) => string,
  exportedAt = new Date().toISOString()
) {
  return {
    formatVersion: 2,
    ...selection,
    migrateProductLabels: Object.fromEntries(
      selection.migrateProducts.map((id) => [id, productName(id)])
    ),
    exportedAt,
  }
}

export function bookmarkExportCsv(
  selection: BookmarkExportSelection,
  productName: (id: string) => string
): string {
  const rows = [
    ...selection.libraryBookmarks.map((id) => ({ type: 'library', id, label: '' })),
    ...selection.migrateProducts.map((id) => ({ type: 'migrate', id, label: productName(id) })),
    ...selection.myLearnModules.map((id) => ({ type: 'learn', id, label: '' })),
    ...selection.myTimelineCountries.map((id) => ({ type: 'timeline', id, label: '' })),
    ...selection.myThreats.map((id) => ({ type: 'threats', id, label: '' })),
    ...selection.myPlaygroundTools.map((id) => ({ type: 'playground', id, label: '' })),
  ]
  return generateCsv(rows, [
    { header: 'type', accessor: (row) => row.type },
    { header: 'id', accessor: (row) => row.id },
    { header: 'label', accessor: (row) => row.label },
  ])
}
