// SPDX-License-Identifier: GPL-3.0-only
/**
 * Loads live CMVP / ACVP / Common Criteria scrape output from
 * `public/data/compliance-data.json` (produced by `scripts/scrape-compliance.ts`)
 * and exposes a fuzzy lookup keyed on vendor + product name. Used by the CBOM
 * builder to overlay illustrative cert numbers with live ones when a match is
 * found, so executives can see fresh CMVP status without leaving the page.
 *
 * Data source ships at `/data/compliance-data.json` (relative to the deployed
 * site root) and is refreshed daily by the GitHub Actions workflow
 * `update-compliance.yml`.
 */
import { useEffect, useState } from 'react'

interface ComplianceRecord {
  id: string
  source: string
  type: string
  status: string
  pqcCoverage?: string
  productName: string
  vendor: string
  date?: string
  link?: string
}

export interface LiveCmvpMatch {
  certId: string
  source: string
  status: string
  pqcCoverage?: string
  link?: string
  date?: string
  matchedProductName: string
  matchedVendor: string
}

export interface LiveCmvpLookup {
  loading: boolean
  /** Returns the best live match for the given vendor + product, or null. */
  match: (vendor: string, product: string) => LiveCmvpMatch | null
  /** Total number of records loaded; surfaces "live data unavailable" UI when 0. */
  size: number
}

let _cache: ComplianceRecord[] | null = null
let _inflight: Promise<ComplianceRecord[]> | null = null

async function loadComplianceData(): Promise<ComplianceRecord[]> {
  if (_cache) return _cache
  if (_inflight) return _inflight
  _inflight = (async () => {
    try {
      const res = await fetch('/data/compliance-data.json', { cache: 'force-cache' })
      if (!res.ok) return []
      const data = (await res.json()) as ComplianceRecord[]
      _cache = Array.isArray(data) ? data : []
      return _cache
    } catch {
      return []
    } finally {
      _inflight = null
    }
  })()
  return _inflight
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Tokens that frequently appear in product names but provide no matching
 *  signal (versions, common adjectives). Stripped before token-overlap check. */
const NOISE = new Set([
  'fips',
  'module',
  'cryptographic',
  'crypto',
  'system',
  'firmware',
  'software',
  'with',
  'and',
  'the',
  'for',
  'version',
  'rev',
])

const tokenize = (s: string): Set<string> =>
  new Set(
    norm(s)
      .split(' ')
      .filter((t) => t.length > 1 && !NOISE.has(t))
  )

/** Score = intersection size of vendor + product tokens. Returns the best
 *  record above a minimum overlap threshold. */
function bestMatch(
  records: ComplianceRecord[],
  vendor: string,
  product: string
): LiveCmvpMatch | null {
  const want = tokenize(`${vendor} ${product}`)
  if (want.size === 0) return null
  let best: { record: ComplianceRecord; score: number } | null = null
  for (const r of records) {
    if (r.status !== 'Active') continue
    const have = tokenize(`${r.vendor} ${r.productName}`)
    let score = 0
    for (const t of want) if (have.has(t)) score++
    if (score >= 2 && (!best || score > best.score)) {
      best = { record: r, score }
    }
  }
  if (!best) return null
  return {
    certId: best.record.id,
    source: best.record.source,
    status: best.record.status,
    pqcCoverage: best.record.pqcCoverage,
    link: best.record.link,
    date: best.record.date,
    matchedProductName: best.record.productName,
    matchedVendor: best.record.vendor,
  }
}

export function useLiveCmvpStatus(): LiveCmvpLookup {
  // Single state slice (records + loaded flag) so the effect only triggers
  // one render after fetch completes — avoids the cascading-render lint.
  const [state, setState] = useState<{ records: ComplianceRecord[]; loaded: boolean }>(() =>
    _cache !== null ? { records: _cache, loaded: true } : { records: [], loaded: false }
  )

  useEffect(() => {
    if (state.loaded) return
    let cancelled = false
    loadComplianceData().then((data) => {
      if (cancelled) return
      setState({ records: data, loaded: true })
    })
    return () => {
      cancelled = true
    }
  }, [state.loaded])

  return {
    loading: !state.loaded,
    size: state.records.length,
    match: (vendor: string, product: string) => bestMatch(state.records, vendor, product),
  }
}
