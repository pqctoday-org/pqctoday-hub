// SPDX-License-Identifier: GPL-3.0-only
/**
 * The generated timeline enrichment lookup (scripts/generate-timeline-enrichments.ts)
 * must be EXACTLY what the pre-27-Sep loader computed at runtime: every
 * timeline_doc_enrichments_*.md in the live directory and all three archive
 * tiers, read through Vite's glob in the same order, merged by
 * mergeEnrichmentFiles. Key for key, value for value. A new or edited sidecar
 * without a regeneration fails here.
 */
import { describe, expect, it } from 'vitest'
import { mergeEnrichmentFiles } from './enrichmentParse'
import { timelineEnrichments } from './timelineEnrichmentData'
import generated from './generated/timelineEnrichments.generated.json'

const modules = {
  ...import.meta.glob('./doc-enrichments/timeline_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('./archive/timeline_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('./doc-enrichments/archive/timeline_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('./doc-enrichments/archive_v1/timeline_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
} as Record<string, string>

describe('timelineEnrichments.generated.json', () => {
  const runtime = mergeEnrichmentFiles(modules)

  it('reads every generation across all four tiers', () => {
    expect(Object.keys(modules).length).toBeGreaterThanOrEqual(40)
    expect(Object.keys(runtime).length).toBeGreaterThan(300)
  })

  it('has exactly the keys the runtime merge produces', () => {
    expect(Object.keys(generated).sort()).toEqual(Object.keys(runtime).sort())
  })

  it('has exactly the values the runtime merge produces', () => {
    expect(generated).toEqual(runtime)
  })

  it('is what the app module exports', () => {
    expect(timelineEnrichments).toEqual(runtime)
  })

  it('keeps the six rows only the archive tiers carry', () => {
    for (const prefix of [
      'Brazil:ITI',
      'G7:G7 CEG',
      'Germany:BSI',
      'Hong Kong:HKMA',
      'Malaysia:NACSA',
      'Singapore:CSA/GovTech/IMDA',
    ]) {
      expect(
        Object.keys(generated).some((k) => k.startsWith(`${prefix} — `)),
        prefix
      ).toBe(true)
    }
  })
})
