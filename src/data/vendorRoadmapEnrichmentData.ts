// SPDX-License-Identifier: GPL-3.0-only
import type { VendorRoadmapEnrichment } from '../types/MigrateTypes'

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

function buildEnrichmentMap(): Map<string, VendorRoadmapEnrichment> {
  const merged = new Map<string, VendorRoadmapEnrichment>()
  for (const raw of Object.values(modules)) {
    for (const [id, enrichment] of parseEnrichmentFile(raw)) {
      merged.set(id, enrichment)
    }
  }
  return merged
}

/** Lookup map: vendor_id → VendorRoadmapEnrichment */
export const enrichmentByVendorId: Map<string, VendorRoadmapEnrichment> = buildEnrichmentMap()
