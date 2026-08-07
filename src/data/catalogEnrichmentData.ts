// SPDX-License-Identifier: GPL-3.0-only
import { mergeEnrichmentFiles, type EnrichmentLookup } from './libraryEnrichmentData'

// 2026-08-07 archive-sweep audit: merge-all source with 7 archived files this
// glob can't see. Deliberately NOT widened — the audit found zero net key loss
// (every archived key is re-covered by a newer live file), while eagerly
// loading the archive tier would still add ~10 MB for no benefit. Left as is.
function loadCatalogEnrichments(): EnrichmentLookup {
  const modules = import.meta.glob('./doc-enrichments/catalog_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>
  return mergeEnrichmentFiles(modules)
}

export const catalogEnrichments: EnrichmentLookup = loadCatalogEnrichments()
