// SPDX-License-Identifier: GPL-3.0-only
import { mergeEnrichmentFiles, type EnrichmentLookup } from './libraryEnrichmentData'

function loadCatalogEnrichments(): EnrichmentLookup {
  const modules = import.meta.glob('./doc-enrichments/catalog_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>
  return mergeEnrichmentFiles(modules)
}

export const catalogEnrichments: EnrichmentLookup = loadCatalogEnrichments()
