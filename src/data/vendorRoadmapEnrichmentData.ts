// SPDX-License-Identifier: GPL-3.0-only
import type { VendorRoadmapEnrichment } from '../types/MigrateTypes'

// 2026-08-07 archive-sweep audit: merge-all source with 3 archived files this
// glob can't see. Deliberately NOT widened — the audit found zero net key loss
// (every archived key is re-covered by a newer live file). Left as is.
const modules = import.meta.glob('./doc-enrichments/vendor_roadmap_enrichments_*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function splitSemicolon(val: string | undefined): string[] {
  if (!val || val === 'None detected') return []
  return val
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseQuotes(val: string | undefined): string[] {
  if (!val || val === 'None detected') return []
  return val
    .split(/(?<=")\s*;\s*(?=")/)
    .map((s) => s.replace(/^[""]|[""]$/g, '').trim())
    .filter(Boolean)
}

function parseEnrichmentFile(raw: string): Map<string, VendorRoadmapEnrichment> {
  const result = new Map<string, VendorRoadmapEnrichment>()
  const sections = raw.split(/\n(?=## VND-)/).filter((s) => s.includes('**Vendor ID**'))

  for (const section of sections) {
    const field = (pattern: RegExp): string | undefined => {
      const m = section.match(pattern)
      return m ? m[1].trim() : undefined
    }

    const F = {
      vendorId: /\*\*Vendor ID\*\*:\s*(.+)$/m,
      scope: /\*\*Roadmap Scope\*\*:\s*(.+)$/m,
      algorithms: /\*\*PQC Algorithms Announced\*\*:\s*(.+)$/m,
      dates: /\*\*Target Migration Dates\*\*:\s*(.+)$/m,
      products: /\*\*Products \/ Services Covered\*\*:\s*(.+)$/m,
      compliance: /\*\*Compliance Frameworks\*\*:\s*(.+)$/m,
      hybrid: /\*\*Hybrid Mode Support\*\*:\s*(.+)$/m,
      gaStatus: /\*\*Current GA Status\*\*:\s*(.+)$/m,
      customerAction: /\*\*Customer Action Required\*\*:\s*(.+)$/m,
      quotes: /\*\*Key Commitments & Quotes\*\*:\s*(.+)$/m,
      quality: /\*\*Extraction Quality\*\*:\s*(.+)$/m,
    } as const

    const vendorId = field(F.vendorId)
    if (!vendorId) continue

    const quality = field(F.quality) ?? ''
    if (quality !== 'HIGH' && quality !== 'MEDIUM' && quality !== 'LOW') continue

    result.set(vendorId, {
      vendorId,
      roadmapScope: field(F.scope) ?? '',
      pqcAlgorithms: splitSemicolon(field(F.algorithms)),
      targetMigrationDates: field(F.dates) ?? '',
      productsCovered: field(F.products) ?? '',
      complianceFrameworks: splitSemicolon(field(F.compliance)),
      hybridModeSupport: field(F.hybrid) ?? '',
      currentGaStatus: field(F.gaStatus) ?? '',
      customerActionRequired: field(F.customerAction) ?? '',
      keyQuotes: parseQuotes(field(F.quotes)),
      extractionQuality: quality as VendorRoadmapEnrichment['extractionQuality'],
    })
  }

  return result
}

// FIXED 2026-07-16 (migrate-process remediation Phase 5, U9): this used to
// merge in Object.values(modules) order — import.meta.glob keys sort
// lexicographically by path, which is wrong for MMDDYYYY_rN filenames across
// a year/month boundary ("01152027" < "12312026" as strings, backwards
// chronologically). A later-dated file could silently lose to an
// earlier-dated one. Same bug class already fixed across the priv Python
// tooling 2026-07-11; this TS loader was missed then.
export function parseFileDate(path: string): { date: number; rev: number } {
  const m = path.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.md$/)
  if (!m) return { date: 0, rev: 0 }
  const [, mm, dd, yyyy, rev] = m
  return { date: Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)), rev: Number(rev ?? 0) }
}

function buildEnrichmentMap(): Map<string, VendorRoadmapEnrichment> {
  const merged = new Map<string, VendorRoadmapEnrichment>()
  const orderedPaths = Object.keys(modules).sort((a, b) => {
    const da = parseFileDate(a)
    const db = parseFileDate(b)
    return da.date - db.date || da.rev - db.rev
  })
  for (const path of orderedPaths) {
    for (const [id, enrichment] of parseEnrichmentFile(modules[path])) {
      merged.set(id, enrichment)
    }
  }
  return merged
}

/** Lookup map: vendor_id → VendorRoadmapEnrichment */
export const enrichmentByVendorId: Map<string, VendorRoadmapEnrichment> = buildEnrichmentMap()
