export interface AuthoritativeSource {
  sourceName: string
  sourceType: 'Government' | 'Academic' | 'Industry Workgroup'
  region: 'Americas' | 'EMEA' | 'APAC' | 'Global'
  primaryUrl: string
  description: string
  leadersCsv: boolean
  libraryCsv: boolean
  algorithmCsv: boolean
  threatsCsv: boolean
  timelineCsv: boolean
  lastVerifiedDate: string
}

export type ViewType = 'Timeline' | 'Library' | 'Threats' | 'Leaders' | 'Algorithms'

// Helper to parse date from filename (format: pqc_authoritative_sources_reference_MMDDYYYY.csv)
function getDateFromFilename(path: string): Date | null {
  const match = path.match(/pqc_authoritative_sources_reference_(\d{8})\.csv/)
  if (!match) return null

  const dateStr = match[1]
  const month = parseInt(dateStr.substring(0, 2), 10)
  const day = parseInt(dateStr.substring(2, 4), 10)
  const year = parseInt(dateStr.substring(4, 8), 10)

  return new Date(year, month - 1, day)
}

// Helper to find the latest authoritative sources file
function getLatestSourcesFile(): {
  content: string
  filename: string
  date: Date
} | null {
  const modules = import.meta.glob('./pqc_authoritative_sources_reference_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  const files = Object.keys(modules)
    .map((path) => {
      const date = getDateFromFilename(path)
      if (!date) return null

      return {
        path,
        content: modules[path] as string,
        date,
      }
    })
    .filter((f): f is { path: string; content: string; date: Date } => f !== null)

  if (files.length === 0) return null

  // Sort by date descending (newest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest authoritative sources from: ${files[0].path}`)

  return {
    content: files[0].content,
    filename: files[0].path.split('/').pop() || files[0].path,
    date: files[0].date,
  }
}

// Parse CSV content
function parseSourcesCSV(content: string): AuthoritativeSource[] {
  const lines = content.trim().split('\n')
  const sources: AuthoritativeSource[] = []

  // Helper to parse CSV line respecting quotes
  const parseLine = (line: string): string[] => {
    const result = []
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

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])

    if (values.length >= 11) {
      sources.push({
        sourceName: values[0],
        sourceType: values[1] as AuthoritativeSource['sourceType'],
        region: values[2] as AuthoritativeSource['region'],
        primaryUrl: values[3],
        description: values[4],
        leadersCsv: values[5] === 'Yes',
        libraryCsv: values[6] === 'Yes',
        algorithmCsv: values[7] === 'Yes',
        threatsCsv: values[8] === 'Yes',
        timelineCsv: values[9] === 'Yes',
        lastVerifiedDate: values[10],
      })
    }
  }

  return sources
}

// Load and parse the latest sources file
const latestFile = getLatestSourcesFile()
export const authoritativeSources: AuthoritativeSource[] = latestFile
  ? parseSourcesCSV(latestFile.content)
  : []

export const sourcesMetadata = latestFile
  ? { filename: latestFile.filename, lastUpdate: latestFile.date }
  : null

// Filter sources by view type
export function getSourcesForView(viewType: ViewType): AuthoritativeSource[] {
  const filterMap: Record<ViewType, keyof AuthoritativeSource> = {
    Timeline: 'timelineCsv',
    Library: 'libraryCsv',
    Threats: 'threatsCsv',
    Leaders: 'leadersCsv',
    Algorithms: 'algorithmCsv',
  }

  const filterKey = filterMap[viewType]

  return authoritativeSources.filter((source) => source[filterKey] === true)
}
