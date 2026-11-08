// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Dependency-free loaders for the published certification snapshot:
 *   - public/data/compliance-data.json       (the records)
 *   - public/data/compliance-data.meta.json  (the sidecar: publicationId,
 *     per-partition retrieval dates, scope)
 *
 * Kept separate from services.ts so light consumers (the CBOM builder's
 * NIST-record badge) do not pull localforage / papaparse into their chunk.
 *
 * Both are fetched with `cache: 'no-cache'` so the browser revalidates with the
 * server instead of reusing an arbitrarily old HTTP-cached copy. The sidecar is
 * optional: until it is published (or if it fails to load) callers get null
 * and fall back to record-derived dates.
 */
import type { ComplianceMeta, ComplianceRecord } from './types'

const dataUrl = (file: string) => `${import.meta.env.BASE_URL ?? '/'}data/${file}`

export const COMPLIANCE_DATA_URL = dataUrl('compliance-data.json')
export const COMPLIANCE_META_URL = dataUrl('compliance-data.meta.json')

export async function fetchStaticComplianceData(): Promise<ComplianceRecord[]> {
  // An unavailable/malformed snapshot is not an empty successful publication.
  // Let callers show their existing unavailable/retry state.
  const response = await fetch(COMPLIANCE_DATA_URL, { cache: 'no-cache' })
  if (!response.ok) throw new Error('Failed to load published certification snapshot')
  const json: unknown = await response.json()
  if (!Array.isArray(json))
    throw new Error('Published certification snapshot has an invalid format')
  // The dataset is FIPS 140-3 only (user decision 2026-09-24). An older
  // publication still carrying FIPS 140-2 rows must not have them shown or
  // counted anywhere, so they are dropped at the single load point.
  return (json as ComplianceRecord[]).filter(
    (r) => (r as { type?: string } | null)?.type !== 'FIPS 140-2'
  )
}

let metaInflight: Promise<ComplianceMeta | null> | null = null

/** Loads the sidecar once per page load; null when absent or malformed. */
export function fetchComplianceMeta(): Promise<ComplianceMeta | null> {
  if (!metaInflight) {
    metaInflight = (async () => {
      try {
        const response = await fetch(COMPLIANCE_META_URL, { cache: 'no-cache' })
        if (!response.ok) return null
        const json: unknown = await response.json()
        if (!json || typeof json !== 'object' || Array.isArray(json)) return null
        return json as ComplianceMeta
      } catch {
        return null
      }
    })()
  }
  return metaInflight
}

/** Test hook: forget the memoised sidecar. */
export function resetComplianceMetaCache(): void {
  metaInflight = null
}

/**
 * Identity of one publication, used to version browser caches so a new
 * publication is never masked by a stale cached copy. Prefers the sidecar's
 * publicationId (sha256 of compliance-data.json); otherwise a cheap
 * signature of the fetched data (length + first/last id + newest date).
 */
export function publicationSignature(
  meta: ComplianceMeta | null | undefined,
  records: readonly ComplianceRecord[]
): string {
  if (meta?.publicationId) return `pub:${meta.publicationId}`
  if (records.length === 0) return 'empty'
  let newest = ''
  for (const r of records) if (r.date && r.date > newest) newest = r.date
  return `sig:${records.length}:${records[0]?.id ?? ''}:${records[records.length - 1]?.id ?? ''}:${newest}`
}
