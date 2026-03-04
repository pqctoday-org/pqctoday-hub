// SPDX-License-Identifier: GPL-3.0-only
export interface LibraryEnrichment {
  mainTopic: string
  pqcAlgorithms: string[]
  quantumThreats: string[]
  migrationTimeline: string[] | null
  regionsAndBodies: { regions: string[]; bodies: string[] } | null
  leadersContributions: string[]
  pqcProducts: string[]
  protocols: string[]
  infrastructureLayers: string[]
  standardizationBodies: string[]
  complianceFrameworks: string[]
}

export type EnrichmentLookup = Record<string, LibraryEnrichment>

/** Split a comma-separated value into trimmed, non-empty items. "None detected" → [] */
function splitList(val: string | undefined): string[] {
  if (!val || val === 'None detected') return []
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Parse migration timeline info into an array of milestone phrases.
 * Format 1: "Milestones: phrase1 | phrase2 | phrase3"  (legacy extractor)
 * Format 2: "year: description; year: description"     (Haiku extractor, semicolon-separated)
 * Legacy:   "Years mentioned: 2024, 2026; Keywords: …"
 */
function parseTimeline(val: string | undefined): string[] | null {
  if (!val || val.startsWith('None detected')) return null
  // Format 1: pipe-separated milestone phrases with "Milestones:" prefix
  const milestonesMatch = val.match(/^Milestones:\s*(.+)$/)
  if (milestonesMatch) {
    const items = milestonesMatch[1]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    return items.length > 0 ? items : null
  }
  // Legacy: "Years mentioned: X, Y; Keywords: Z"
  const yearsMatch = val.match(/Years mentioned:\s*([^;]+)/)
  if (yearsMatch) {
    const years = splitList(yearsMatch[1])
    const keywordsMatch = val.match(/Keywords:\s*(.+)$/)
    const keywords = keywordsMatch ? splitList(keywordsMatch[1]) : []
    const items = [...years.map((y) => `Year: ${y}`), ...keywords]
    return items.length > 0 ? items : null
  }
  // Haiku extraction format: freeform semicolon-separated milestone phrases
  const items = val
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length > 0 ? items : null
}

/**
 * Parse "Regions: USA, EU; Bodies: NIST, CISA"
 * into { regions: ['USA','EU'], bodies: ['NIST','CISA'] }
 */
function parseRegionsBodies(val: string | undefined): LibraryEnrichment['regionsAndBodies'] {
  if (!val || val === 'None detected') return null
  const regionsMatch = val.match(/Regions:\s*([^;]+?)(?:,?\s*Bodies:|$)/)
  const bodiesMatch = val.match(/Bodies:\s*(.+)$/)
  const regions = regionsMatch ? splitList(regionsMatch[1]) : []
  const bodies = bodiesMatch ? splitList(bodiesMatch[1]) : []
  if (regions.length === 0 && bodies.length === 0) return null
  return { regions, bodies }
}

/** Parse the enrichment markdown into a lookup keyed by referenceId */
export function parseEnrichmentMarkdown(raw: string): EnrichmentLookup {
  const lookup: EnrichmentLookup = {}

  // Split by ## headings — each is one document (same approach as generate-rag-corpus.ts)
  const sections = raw.split(/\n(?=## )/).filter((s) => s.trimStart().startsWith('## '))

  for (const section of sections) {
    const lines = section.split('\n')
    const refId = lines[0].replace(/^##\s*/, '').trim()
    if (!refId || refId === '---') continue

    // Parse bullet fields: - **Field**: value
    const fields: Record<string, string> = {}
    for (const line of lines.slice(1)) {
      const m = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.+)$/)
      if (m) fields[m[1].trim()] = m[2].trim()
    }

    const mainTopic = fields['Main Topic']
    if (mainTopic === 'See document for details.') {
      // Skip entries with no real content extracted
    }

    lookup[refId] = {
      mainTopic: mainTopic && mainTopic !== 'None detected' ? mainTopic : '',
      pqcAlgorithms: splitList(fields['PQC Algorithms Covered']),
      quantumThreats: splitList(fields['Quantum Threats Addressed']),
      migrationTimeline: parseTimeline(fields['Migration Timeline Info']),
      regionsAndBodies: parseRegionsBodies(fields['Applicable Regions / Bodies']),
      leadersContributions: splitList(fields['Leaders Contributions Mentioned']),
      pqcProducts: splitList(fields['PQC Products Mentioned']),
      protocols: splitList(fields['Protocols Covered']),
      infrastructureLayers: splitList(fields['Infrastructure Layers']),
      standardizationBodies: splitList(fields['Standardization Bodies']),
      complianceFrameworks: splitList(fields['Compliance Frameworks Referenced']),
    }
  }

  return lookup
}

/** True if the enrichment has any substantive dimension data beyond metadata */
export function hasSubstantiveEnrichment(e: LibraryEnrichment): boolean {
  return !!(
    e.mainTopic ||
    e.pqcAlgorithms.length ||
    e.quantumThreats.length ||
    e.migrationTimeline ||
    e.regionsAndBodies ||
    e.leadersContributions.length ||
    e.pqcProducts.length ||
    e.protocols.length ||
    e.infrastructureLayers.length ||
    e.standardizationBodies.length ||
    e.complianceFrameworks.length
  )
}

// ---------------------------------------------------------------------------
// Auto-discover the latest enrichment markdown via import.meta.glob
// ---------------------------------------------------------------------------

function loadEnrichments(): EnrichmentLookup {
  const modules = import.meta.glob('./doc-enrichments/library_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  const paths = Object.keys(modules)
  if (paths.length === 0) return {}

  // Sort oldest → newest so later files overwrite earlier ones for duplicate IDs
  const withDates = paths.map((p) => {
    const match = p.match(/(\d{2})(\d{2})(\d{4})(_r(\d+))?\.md$/)
    if (!match) return { path: p, date: 0, rev: 0 }
    const [, mm, dd, yyyy, , rev] = match
    return { path: p, date: parseInt(yyyy + mm + dd), rev: rev ? parseInt(rev) : 0 }
  })
  withDates.sort((a, b) => a.date - b.date || a.rev - b.rev)

  // Merge all files — later dates take precedence for duplicate IDs
  const merged: EnrichmentLookup = {}
  for (const { path } of withDates) {
    const raw = modules[path]
    if (!raw) continue
    Object.assign(merged, parseEnrichmentMarkdown(raw))
  }
  return merged
}

export const libraryEnrichments: EnrichmentLookup = loadEnrichments()
