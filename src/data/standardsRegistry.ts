// SPDX-License-Identifier: GPL-3.0-only
/**
 * Authoritative standards reference registry.
 *
 * Single source of truth for FIPS, RFC, NIST SP/IR, and other standards
 * referenced across learn modules. Each entry maps to a library CSV record.
 *
 * All learn modules should use `getStandard()` to reference standards instead
 * of hardcoding identifiers, titles, or deep links.
 *
 * Data sourced from: src/data/library_*.csv (reference_id, document_title, document_status)
 */
import { loadLatestCSV } from './csvUtils'

export interface StandardRef {
  /** Library reference ID (e.g., 'FIPS 203', 'RFC 9629') */
  id: string
  /** Full document title */
  title: string
  /** Document status (e.g., 'Published', 'Draft', 'Final') */
  status: string
  /** Document type (e.g., 'FIPS Standard', 'RFC', 'Technical Report') */
  type: string
  /** Deep link to the library page for this standard */
  deepLink: string
  /** Primary authoring organization */
  organization: string
}

interface RawLibraryRow {
  reference_id: string
  document_title: string
  document_status: string
  document_type: string
  authors_or_organization: string
}

// Load all library records at module-init time (synchronous eager glob)
const modules = import.meta.glob('./library_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data: libraryRecords } = loadLatestCSV<RawLibraryRow, StandardRef>(
  modules,
  /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    id: row.reference_id,
    title: row.document_title,
    status: row.document_status ?? '',
    type: row.document_type ?? '',
    organization: row.authors_or_organization ?? '',
    deepLink: `/library?ref=${encodeURIComponent(row.reference_id)}`,
  })
)

// Build lookup map
const STANDARDS_MAP = new Map<string, StandardRef>()
for (const rec of libraryRecords) {
  if (rec.id) STANDARDS_MAP.set(rec.id, rec)
}

/** Total number of standards in the registry */
export const standardsCount = STANDARDS_MAP.size

/**
 * Look up a standard by its library reference ID.
 * Throws if the standard is not found — this is intentional:
 * a build-time error is better than a silent broken reference.
 */
export function getStandard(id: string): StandardRef {
  const std = STANDARDS_MAP.get(id)
  if (!std) {
    throw new Error(
      `[standardsRegistry] Unknown standard: "${id}". ` +
        'Add it to the library CSV (reference_id column).'
    )
  }
  return std
}

/**
 * Safe lookup — returns undefined instead of throwing.
 * Use when the standard may legitimately not exist (e.g., conditional rendering).
 */
export function findStandard(id: string): StandardRef | undefined {
  return STANDARDS_MAP.get(id)
}

/** Check if a standard exists in the registry */
export function hasStandard(id: string): boolean {
  return STANDARDS_MAP.has(id)
}

/** Get all standards matching a document type (e.g., 'RFC', 'FIPS Standard') */
export function getStandardsByType(type: string): StandardRef[] {
  return libraryRecords.filter((s) => s.type.toLowerCase().includes(type.toLowerCase()))
}
