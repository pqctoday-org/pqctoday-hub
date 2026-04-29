// SPDX-License-Identifier: GPL-3.0-only
import type { CveRecord, CveSnapshot } from '@/types/CveTypes'
import { cpeByProduct } from './cpeXrefData'

/** Lazy fetch of `public/data/cve-snapshot.json`. Single static asset; module-level
 *  cache keeps it to one network call per session. */
let cachedSnapshot: CveSnapshot | null = null
let inflight: Promise<CveSnapshot> | null = null

export async function loadCveSnapshot(): Promise<CveSnapshot> {
  if (cachedSnapshot) return cachedSnapshot
  if (inflight) return inflight
  inflight = (async () => {
    // Resolve relative to the deployed base path (matches how compliance JSON is fetched).
    const base = import.meta.env.BASE_URL ?? '/'
    const url = `${base.replace(/\/$/, '')}/data/cve-snapshot.json`
    const resp = await fetch(url)
    if (!resp.ok) {
      throw new Error(`cve-snapshot.json fetch failed: ${resp.status}`)
    }
    const json = (await resp.json()) as CveSnapshot
    cachedSnapshot = json
    inflight = null
    return json
  })()
  return inflight
}

/** Returns CVEs for a software product, joining via the existing CPE xref.
 *  Returns `[]` if the snapshot has no entry for the product's CPE. */
export async function getCvesForProduct(softwareName: string): Promise<CveRecord[]> {
  const snapshot = await loadCveSnapshot()
  const xref = cpeByProduct.get(softwareName)
  if (!xref || !xref.cpeUri || xref.status === 'not_found') return []
  return snapshot.byCpe[xref.cpeUri] ?? []
}

/** True if the product has a usable CPE mapping (matched or partial).
 *  Lets the UI distinguish "no CVEs" from "no CPE coverage yet". */
export function hasCpeCoverage(softwareName: string): boolean {
  const xref = cpeByProduct.get(softwareName)
  return Boolean(xref && xref.cpeUri && xref.status !== 'not_found')
}

/** Test seam — overrides the cached snapshot. Production callers must not use this. */
export function __setCachedSnapshotForTests(snapshot: CveSnapshot | null): void {
  cachedSnapshot = snapshot
  inflight = null
}
