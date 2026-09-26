// SPDX-License-Identifier: GPL-3.0-only
/**
 * Looks up a certification record in the published snapshot
 * (`public/data/compliance-data.json`) by its EXACT certificate / validation
 * ID. Used by the CBOM builder to put a link to the official NIST / CC record
 * next to an illustrative cert number.
 *
 * There is deliberately no vendor / product-name matching: fuzzy name matching
 * linked products to certificates they do not hold (user decision, 24 Sep
 * 2026 — product-to-certificate links must not come from name matching). No
 * ID from the caller → no match.
 *
 * The snapshot is a periodic publication, not a live feed; the hook name is
 * historical.
 */
import { useEffect, useState } from 'react'
import { fetchStaticComplianceData } from '@/components/Compliance/complianceDataLoader'
import type { ComplianceRecord, ComplianceType } from '@/components/Compliance/types'
import { isCurrentStatus, recordTypeLabel } from '@/components/Compliance/recordSemantics'

export interface LiveCmvpMatch {
  certId: string
  type: string
  /** User-facing type label, e.g. 'FIPS 140-3', 'NIST CAVP'. */
  typeLabel: string
  source: string
  /** Status verbatim from the source (Active, Historical, Validated, Archived …). */
  status: string
  /** True only for Active / Validated. */
  isCurrent: boolean
  pqcCoverage?: string
  link?: string
  date?: string
  matchedProductName: string
  matchedVendor: string
}

export interface LiveCmvpLookup {
  loading: boolean
  /**
   * Returns the record whose id equals `certId` exactly (case-insensitive,
   * after stripping a leading '#' and any trailing annotation such as
   * '#4985 (FIPS provider)' → '4985'), or null. `type` restricts the match
   * to one record type so a CMVP number can never resolve to another scheme.
   */
  matchById: (certId: string | null | undefined, type?: ComplianceType) => LiveCmvpMatch | null
  /** Total number of records loaded; 0 means the snapshot is unavailable. */
  size: number
}

let _index: Map<string, ComplianceRecord[]> | null = null
let _size = 0
let _inflight: Promise<void> | null = null

async function loadIndex(): Promise<void> {
  if (_index) return
  if (_inflight) return _inflight
  _inflight = (async () => {
    try {
      const records = await fetchStaticComplianceData()
      const index = new Map<string, ComplianceRecord[]>()
      for (const r of records) {
        if (!r?.id) continue
        const key = String(r.id).trim().toUpperCase()
        const list = index.get(key)
        if (list) list.push(r)
        else index.set(key, [r])
      }
      _index = index
      _size = records.length
    } finally {
      _inflight = null
    }
  })()
  return _inflight
}

/** Test hook: forget the loaded snapshot. */
export function resetLiveCmvpCache(): void {
  _index = null
  _size = 0
  _inflight = null
}

/**
 * Normalises a caller-supplied certificate ID: '#4985 (FIPS provider)' →
 * '4985', 'A1234' → 'A1234'. Returns null when the string does not START with
 * an ID — this parses the caller's own ID, it never searches names.
 */
export function normalizeCertId(certId: string | null | undefined): string | null {
  if (!certId) return null
  const m = /^\s*#?\s*([A-Za-z0-9][A-Za-z0-9._-]*)/.exec(certId)
  return m ? m[1].toUpperCase() : null
}

export function lookupCertById(
  index: Map<string, ComplianceRecord[]> | null,
  certId: string | null | undefined,
  type?: ComplianceType
): LiveCmvpMatch | null {
  if (!index) return null
  const key = normalizeCertId(certId)
  if (!key) return null
  const candidates = (index.get(key) ?? []).filter((r) => !type || r.type === type)
  // Two different records sharing an id across types is ambiguous without a
  // type — refuse rather than guess.
  if (candidates.length !== 1) return null
  const r = candidates[0]
  return {
    certId: r.id,
    type: r.type,
    typeLabel: recordTypeLabel(r.type),
    source: r.source,
    status: String(r.status ?? ''),
    isCurrent: isCurrentStatus(r.status),
    pqcCoverage: typeof r.pqcCoverage === 'string' ? r.pqcCoverage : undefined,
    link: r.link || undefined,
    date: r.date,
    matchedProductName: r.productName,
    matchedVendor: r.vendor,
  }
}

export function useLiveCmvpStatus(): LiveCmvpLookup {
  const [state, setState] = useState<{ loaded: boolean }>(() => ({ loaded: _index !== null }))

  useEffect(() => {
    if (state.loaded) return
    let cancelled = false
    loadIndex()
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setState({ loaded: true })
      })
    return () => {
      cancelled = true
    }
  }, [state.loaded])

  return {
    loading: !state.loaded,
    size: _size,
    matchById: (certId, type) => lookupCertById(_index, certId, type),
  }
}
