// SPDX-License-Identifier: GPL-3.0-only
import type { IndustryComplianceConfig } from './industryAssessConfig'

// ── Types ────────────────────────────────────────────────────────────────

export type BodyType =
  | 'standardization_body'
  | 'technical_standard'
  | 'certification_body'
  | 'compliance_framework'

export interface ComplianceFramework {
  id: string
  label: string
  description: string
  industries: string[]
  countries: string[]
  requiresPQC: boolean
  deadline: string
  notes: string
  enforcementBody: string
  libraryRefs: string[]
  timelineRefs: string[]
  bodyType: BodyType
  website?: string
}

// ── CSV loading (versioned filename pattern) ────────────────────────────

function getLatestComplianceFile(): { content: string; filename: string; date: Date } | null {
  const modules = import.meta.glob('./compliance_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  const files = Object.keys(modules)
    .map((path) => {
      const match = path.match(/compliance_(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$/)
      if (match) {
        const [, month, day, year, , rev] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const revision = rev ? parseInt(rev, 10) : 0
        // eslint-disable-next-line security/detect-object-injection
        return { path, date, revision, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; revision: number; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No dated compliance CSV files found.')
    return null
  }

  files.sort((a, b) => {
    const timeDiff = b.date.getTime() - a.date.getTime()
    if (timeDiff !== 0) return timeDiff
    return b.revision - a.revision
  })

  return {
    content: files[0].content,
    filename: files[0].path.split('/').pop() || files[0].path,
    date: files[0].date,
  }
}

// ── Quote-aware CSV parser ──────────────────────────────────────────────

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseSemicolonList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseComplianceCSV(csvContent: string): ComplianceFramework[] {
  try {
    const lines = csvContent.trim().split('\n')
    const dataLines = lines.slice(1) // skip header

    return dataLines
      .map((line): ComplianceFramework | null => {
        if (!line.trim()) return null
        const fields = parseLine(line)
        const [
          id,
          label,
          description,
          industriesRaw,
          countriesRaw,
          requiresPqcRaw,
          deadline,
          notes,
          enforcementBody,
          libraryRefsRaw,
          timelineRefsRaw,
          bodyTypeRaw,
          website,
        ] = fields

        if (!id || !label) return null

        const validBodyTypes: BodyType[] = [
          'standardization_body',
          'technical_standard',
          'certification_body',
          'compliance_framework',
        ]
        const bodyType: BodyType = validBodyTypes.includes(bodyTypeRaw as BodyType)
          ? (bodyTypeRaw as BodyType)
          : 'compliance_framework'

        return {
          id,
          label,
          description: description || '',
          industries: parseSemicolonList(industriesRaw),
          countries: parseSemicolonList(countriesRaw),
          requiresPQC: requiresPqcRaw?.toLowerCase() === 'yes',
          deadline: deadline || 'Ongoing',
          notes: notes || '',
          enforcementBody: enforcementBody || '',
          libraryRefs: parseSemicolonList(libraryRefsRaw),
          timelineRefs: parseSemicolonList(timelineRefsRaw),
          bodyType,
          website: website?.trim() || undefined,
        }
      })
      .filter((row): row is ComplianceFramework => row !== null)
  } catch (error) {
    console.error('Failed to parse compliance CSV:', error)
    return []
  }
}

// ── Load and parse ──────────────────────────────────────────────────────

let frameworks: ComplianceFramework[] = []
let parsedMetadata: { filename: string; lastUpdate: Date } | null = null

try {
  const file = getLatestComplianceFile()
  if (file) {
    frameworks = parseComplianceCSV(file.content)
    parsedMetadata = { filename: file.filename, lastUpdate: file.date }
  }
} catch (error) {
  console.error('Failed to load compliance data:', error)
}

/** All compliance frameworks from the latest compliance CSV. */
export const complianceFrameworks: ComplianceFramework[] = frameworks

/** CSV file metadata (filename and date). */
export const complianceMetadata = parsedMetadata

// ── Backward-compatible exports ─────────────────────────────────────────

/**
 * Maps compliance frameworks to IndustryComplianceConfig shape
 * for backward compatibility with the assessment wizard (Step 5).
 */
export const complianceAsIndustryConfigs: IndustryComplianceConfig[] = frameworks.map((fw) => ({
  category: 'compliance' as const,
  id: fw.id,
  label: fw.label,
  description: fw.description,
  industries: fw.industries,
  countries: fw.countries,
  complianceDeadline: fw.deadline,
  complianceNotes: fw.notes,
}))

/**
 * Maps compliance frameworks to the COMPLIANCE_DB shape
 * for backward compatibility with assessment scoring.
 */
export const complianceDB: Record<
  string,
  { requiresPQC: boolean; deadline: string; notes: string }
> = Object.fromEntries(
  frameworks.map((fw) => [
    fw.label,
    { requiresPQC: fw.requiresPQC, deadline: fw.deadline, notes: fw.notes },
  ])
)
