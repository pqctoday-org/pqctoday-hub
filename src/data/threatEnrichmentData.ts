// SPDX-License-Identifier: GPL-3.0-only
import {
  type LibraryEnrichment,
  type EnrichmentLookup,
  mergeEnrichmentFiles,
} from './libraryEnrichmentData'

/**
 * Threat-specific enrichment fields (extracted only for threats collection).
 * Extends the base LibraryEnrichment with 4 additional threat dimensions.
 */
export interface ThreatEnrichment extends LibraryEnrichment {
  attackClassification: string[]
  exploitationTimeline: string[]
  financialImpact: string[]
  countermeasureEffectiveness: string[]
}

export type ThreatEnrichmentLookup = Record<string, ThreatEnrichment>

// ---------------------------------------------------------------------------
// Auto-discover threat enrichment markdown files via import.meta.glob
// ---------------------------------------------------------------------------

const threatModules = import.meta.glob('./doc-enrichments/threats_doc_enrichments_*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const baseLookup: EnrichmentLookup = mergeEnrichmentFiles(threatModules)

// Enhance each entry with threat-specific fields parsed from the same markdown
function parseThreatFields(raw: string): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  const sections = raw.split('\n## ').filter((s) => s.trim())

  for (const section of sections) {
    const lines = section.trim().split('\n')
    const label = lines[0]
      .trim()
      .replace(/^#+\s*/, '')
      .trim()
    if (!label || label === '---') continue

    const fields: Record<string, string> = {}
    for (const line of lines.slice(1)) {
      const m = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.+)$/)
      if (m) {
        fields[m[1].trim()] = m[2].trim()
      }
    }

    const splitSemicolon = (val: string | undefined): string[] => {
      if (!val || val === 'None detected') return []
      return val
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    // eslint-disable-next-line security/detect-object-injection
    result[label] = [] // placeholder — store parsed fields keyed by threat ID
    // Store raw fields for later extraction
    const threatFields = {
      attackClassification: splitSemicolon(fields['Attack Classification']),
      exploitationTimeline: splitSemicolon(fields['Exploitation Timeline Window']),
      financialImpact: splitSemicolon(fields['Financial Impact Quantification']),
      countermeasureEffectiveness: splitSemicolon(fields['Countermeasure Effectiveness']),
    }
    // Attach to a side-channel map
    // eslint-disable-next-line security/detect-object-injection
    threatFieldsMap[label] = threatFields
  }

  return result
}

const threatFieldsMap: Record<
  string,
  {
    attackClassification: string[]
    exploitationTimeline: string[]
    financialImpact: string[]
    countermeasureEffectiveness: string[]
  }
> = {}

// Parse all threat markdown files for threat-specific fields
for (const raw of Object.values(threatModules)) {
  parseThreatFields(raw as string)
}

// Build the final lookup by merging base enrichment + threat-specific fields
export const threatEnrichmentData: ThreatEnrichmentLookup = Object.fromEntries(
  Object.entries(baseLookup).map(([id, base]) => {
    // eslint-disable-next-line security/detect-object-injection
    const threatFields = threatFieldsMap[id] ?? {
      attackClassification: [],
      exploitationTimeline: [],
      financialImpact: [],
      countermeasureEffectiveness: [],
    }
    return [
      id,
      {
        ...base,
        ...threatFields,
      },
    ]
  })
)
