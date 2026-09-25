// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useCallback } from 'react'
import type { ComplianceMeta, ComplianceRecord } from './types'
import {
  fetchComplianceMeta,
  fetchStaticComplianceData,
  publicationSignature,
} from './complianceDataLoader'
import localforage from 'localforage'

// Configure localforage
localforage.config({
  name: 'PQCTimelineApp',
  storeName: 'compliance_cache',
})

export const AUTHORITATIVE_SOURCES = {
  FIPS: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search/all',
  ACVP: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search',
  CC: 'https://www.commoncriteriaportal.org/',
  BSI: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Zertifizierung-und-Anerkennung/Zertifizierung-von-Produkten/Zertifizierung-nach-CC/zertifizierung-nach-cc_node.html',
  ANSSI:
    'https://cyber.gouv.fr/produits-certifies?sort_bef_combine=field_date_de_certification_value_DESC&type_1%5Bproduit_certifie_cc%5D=produit_certifie_cc',
  ENISA: 'https://certification.enisa.europa.eu/certificates_en',
}

// ── Browser cache (localforage), versioned per publication ─────────────────
// Every key carries the publication signature (the sidecar's publicationId, or
// a length/first-id/last-id/newest-date signature of the fetched JSON when the
// sidecar is absent). A new compliance-data.json publication therefore gets
// fresh keys and can never be masked by a copy cached against an older one;
// keys from other publications are pruned on first use.
const CACHE_PREFIX = 'compliance_cache_v3'

interface CacheKeys {
  NIST: string
  ACVP: string
  TIMESTAMP: string
}

const cacheKeysFor = (signature: string): CacheKeys => ({
  NIST: `${CACHE_PREFIX}:nist:${signature}`,
  ACVP: `${CACHE_PREFIX}:acvp:${signature}`,
  TIMESTAMP: `${CACHE_PREFIX}:ts:${signature}`,
})

const LEGACY_CACHE_KEYS = [
  'compliance_data_ts_v6',
  'compliance_data_nist_v2',
  'compliance_data_acvp_v2',
  'compliance_data_cc_v2',
]

/** Drops cached entries that belong to any other publication (and pre-v3 keys). */
const pruneStaleCacheKeys = async (keys: CacheKeys): Promise<void> => {
  try {
    const keep = new Set(Object.values(keys))
    const all = await localforage.keys()
    await Promise.all(
      all
        .filter(
          (k) => LEGACY_CACHE_KEYS.includes(k) || (k.startsWith(`${CACHE_PREFIX}:`) && !keep.has(k))
        )
        .map((k) => localforage.removeItem(k))
    )
  } catch {
    // Storage unavailable (private mode, tests) — nothing to prune.
  }
}

/**
 * Certification records always come from the published snapshot
 * (public/data/compliance-data.json). That snapshot is produced by the private
 * pipeline, which reads the official sources directly — NIST CMVP certificate
 * pages, the NIST CAVP search, the Common Criteria portal, ANSSI and ENISA —
 * and records where every value came from.
 *
 * The in-browser scraping that used to run here (dev only, behind the Refresh
 * button) was removed on 2026-09-25. It keyword-scanned NIST/CAVP HTML and
 * hardcoded things it could not actually know — status 'Active', type
 * 'FIPS 140-3' — then overwrote published rows by id. Those are exactly the
 * values the data rules forbid, so there was nothing worth keeping: this
 * function now only reads the snapshot, in dev and in production alike.
 *
 * The publication-keyed cache bookkeeping stays: loading the snapshot still
 * prunes cached entries left over from an earlier publication.
 */
export const fetchComplianceData = async (): Promise<ComplianceRecord[]> => {
  try {
    const records = await fetchStaticComplianceData()

    const meta = await fetchComplianceMeta()
    const cacheKeys = cacheKeysFor(publicationSignature(meta, records))
    await pruneStaleCacheKeys(cacheKeys)

    return records
  } catch {
    return []
  }
}

/**
 * The newest per-record `date` (ISO YYYY-MM-DD) actually present in the data —
 * the date of the most recent certificate, NOT when the snapshot was
 * retrieved. Label it "Newest record date", never "as of": the snapshot's
 * retrieval dates come from the sidecar (compliance-data.meta.json, see
 * `snapshotRetrievalEntries` in recordSemantics.ts).
 */
export const computeRecordsSnapshotDate = (records: ComplianceRecord[]): Date | null => {
  let latest: number | null = null
  for (const record of records) {
    if (!record.date) continue
    const t = new Date(record.date).getTime()
    if (Number.isNaN(t)) continue
    if (latest === null || t > latest) latest = t
  }
  return latest === null ? null : new Date(latest)
}

export const useComplianceRefresh = () => {
  const [data, setData] = useState<ComplianceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  // Sidecar for the loaded publication (retrieval dates, scope); null until
  // published or when it fails to load — callers fall back to record dates.
  const [meta, setMeta] = useState<ComplianceMeta | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [records, sidecar] = await Promise.all([fetchComplianceData(), fetchComplianceMeta()])
      setData(records)
      setMeta(sidecar)
      setLastUpdated(computeRecordsSnapshotDate(records))
    } catch (err) {
      console.error('Failed to fetch compliance data:', err)
      setError('Failed to refresh data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, lastUpdated, meta, refresh }
}
