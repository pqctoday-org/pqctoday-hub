// SPDX-License-Identifier: GPL-3.0-only
import { mergeEnrichmentFiles, type EnrichmentLookup } from './enrichmentParse'

export * from './enrichmentParse'

// 2026-08-07 archive-sweep audit: this is a merge-all source (same class as
// maturityGovernanceData.ts) with 73 files sitting across three archive tiers
// it can't see. Deliberately NOT widened, unlike timelineEnrichmentData.ts:
// the audit found the 7 keys unique to those archived files all reference
// reference_ids no longer in the library catalog (zero live impact), while
// eagerly loading them adds ~110 MB to this loader alone — enough on its own
// to OOM the test workers that import it. Zero-benefit, real-cost; left as is.
function loadEnrichments(): EnrichmentLookup {
  const modules = import.meta.glob('./doc-enrichments/library_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>
  return mergeEnrichmentFiles(modules)
}

export const libraryEnrichments: EnrichmentLookup = loadEnrichments()
