export interface IndustryComplianceConfig {
  category: 'compliance'
  id: string
  label: string
  description: string
  industries: string[]
  countries: string[]
  complianceDeadline: string
  complianceNotes: string
}

export interface IndustryUseCaseConfig {
  category: 'use_case'
  id: string
  label: string
  description: string
  industries: string[]
  hndlRelevance: number
  migrationPriority: number
}

export interface IndustryRetentionConfig {
  category: 'retention'
  id: string
  label: string
  description: string
  industries: string[]
  retentionYears: number
}

export interface IndustrySensitivityConfig {
  category: 'sensitivity'
  id: string
  label: string
  description: string
  industries: string[]
  sensitivityScore: number
}

export type IndustryConfigRow =
  | IndustryComplianceConfig
  | IndustryUseCaseConfig
  | IndustryRetentionConfig
  | IndustrySensitivityConfig

// Helper to find the latest pqcassessment CSV file
function getLatestAssessFile(): { content: string; filename: string; date: Date } | null {
  const modules = import.meta.glob('./pqcassessment_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  const files = Object.keys(modules)
    .map((path) => {
      const match = path.match(/pqcassessment_(\d{2})(\d{2})(\d{4})\.csv$/)
      if (match) {
        const [, month, day, year] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        // eslint-disable-next-line security/detect-object-injection
        return { path, date, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No dated pqcassessment CSV files found.')
    return null
  }

  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  return {
    content: files[0].content,
    filename: files[0].path.split('/').pop() || files[0].path,
    date: files[0].date,
  }
}

// Quote-aware CSV line parser (same pattern as libraryData.ts / threatsData.ts)
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

function parseAssessCSV(csvContent: string): IndustryConfigRow[] {
  try {
    const lines = csvContent.trim().split('\n')
    // Skip header row
    const dataLines = lines.slice(1)

    return dataLines
      .map((line): IndustryConfigRow | null => {
        if (!line.trim()) return null
        const [
          category,
          id,
          label,
          description,
          industriesRaw,
          hndlRelevanceRaw,
          migrationPriorityRaw,
          retentionYearsRaw,
          complianceDeadline,
          complianceNotes,
          countriesRaw,
        ] = parseLine(line)

        const industries = industriesRaw
          ? industriesRaw
              .split(';')
              .map((s) => s.trim())
              .filter(Boolean)
          : []

        const countries = countriesRaw
          ? countriesRaw
              .split(';')
              .map((s) => s.trim())
              .filter(Boolean)
          : []

        if (category === 'compliance') {
          return {
            category: 'compliance',
            id: id || '',
            label: label || '',
            description: description || '',
            industries,
            countries,
            complianceDeadline: complianceDeadline || '',
            complianceNotes: complianceNotes || '',
          } satisfies IndustryComplianceConfig
        }

        if (category === 'use_case') {
          return {
            category: 'use_case',
            id: id || '',
            label: label || '',
            description: description || '',
            industries,
            hndlRelevance: hndlRelevanceRaw ? parseInt(hndlRelevanceRaw, 10) : 5,
            migrationPriority: migrationPriorityRaw ? parseInt(migrationPriorityRaw, 10) : 5,
          } satisfies IndustryUseCaseConfig
        }

        if (category === 'retention') {
          return {
            category: 'retention',
            id: id || '',
            label: label || '',
            description: description || '',
            industries,
            retentionYears: retentionYearsRaw ? parseInt(retentionYearsRaw, 10) : 0,
          } satisfies IndustryRetentionConfig
        }

        if (category === 'sensitivity') {
          return {
            category: 'sensitivity',
            id: id || '',
            label: label || '',
            description: description || '',
            industries,
            sensitivityScore: hndlRelevanceRaw ? parseInt(hndlRelevanceRaw, 10) : 5,
          } satisfies IndustrySensitivityConfig
        }

        return null
      })
      .filter((row): row is IndustryConfigRow => row !== null)
  } catch (error) {
    console.error('Failed to parse pqcassessment CSV:', error)
    return []
  }
}

// Load and parse
let allRows: IndustryConfigRow[] = []
let parsedMetadata: { filename: string; lastUpdate: Date } | null = null

try {
  const file = getLatestAssessFile()
  if (file) {
    allRows = parseAssessCSV(file.content)
    parsedMetadata = { filename: file.filename, lastUpdate: file.date }
  }
} catch (error) {
  console.error('Failed to load industry assess config:', error)
}

export const industryComplianceConfigs: IndustryComplianceConfig[] = allRows.filter(
  (r): r is IndustryComplianceConfig => r.category === 'compliance'
)

export const industryUseCaseConfigs: IndustryUseCaseConfig[] = allRows.filter(
  (r): r is IndustryUseCaseConfig => r.category === 'use_case'
)

export const industryRetentionConfigs: IndustryRetentionConfig[] = allRows.filter(
  (r): r is IndustryRetentionConfig => r.category === 'retention' && r.industries.length > 0
)

export const universalRetentionConfigs: IndustryRetentionConfig[] = allRows.filter(
  (r): r is IndustryRetentionConfig => r.category === 'retention' && r.industries.length === 0
)

export const industrySensitivityConfigs: IndustrySensitivityConfig[] = allRows.filter(
  (r): r is IndustrySensitivityConfig => r.category === 'sensitivity'
)

export const metadata: { filename: string; lastUpdate: Date } | null = parsedMetadata

/** Returns configs for a given industry from a typed config array. */
export function getIndustryConfigs<T extends { industries: string[] }>(
  configs: T[],
  industry: string
): T[] {
  if (!industry) return []
  return configs.filter((c) => c.industries.includes(industry))
}
