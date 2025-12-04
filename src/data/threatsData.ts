export interface ThreatData {
  industry: string
  threatId: string
  description: string
  criticality: 'Critical' | 'High' | 'Medium' | 'Medium-High' | 'Low'
  cryptoAtRisk: string
  pqcReplacement: string
  source: string
}

// Helper to find the latest threats CSV file
function getLatestThreatsFile(): { content: string; filename: string; date: Date } | null {
  // Use import.meta.glob to find all threats CSV files
  const modules = import.meta.glob('./quantum_threats_hsm_industries_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  // Extract filenames and parse dates
  const files = Object.keys(modules)
    .map((path) => {
      // Path format: ./quantum_threats_hsm_industries_MMDDYYYY.csv
      const match = path.match(/quantum_threats_hsm_industries_(\d{2})(\d{2})(\d{4})\.csv$/)
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
    console.warn('No dated threats CSV files found.')
    return null
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest threats data from: ${files[0].path}`)
  const filename = files[0].path.split('/').pop() || files[0].path
  return { content: files[0].content, filename, date: files[0].date }
}

export function parseThreatsCSV(csvContent: string): ThreatData[] {
  try {
    const lines = csvContent.trim().split('\n')
    // Skip header
    const dataLines = lines.slice(1)

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

    return dataLines.map((line) => {
      const [industry, threatId, description, criticality, cryptoAtRisk, pqcReplacement, source] =
        parseLine(line)

      return {
        industry: industry?.replace(/^"|"$/g, '') || '',
        threatId: threatId?.replace(/^"|"$/g, '') || '',
        description: description?.replace(/^"|"$/g, '') || '',
        criticality: (criticality?.replace(/^"|"$/g, '') as ThreatData['criticality']) || 'Medium',
        cryptoAtRisk: cryptoAtRisk?.replace(/^"|"$/g, '') || '',
        pqcReplacement: pqcReplacement?.replace(/^"|"$/g, '') || '',
        source: source?.replace(/^"|"$/g, '') || '',
      }
    })
  } catch (error) {
    console.error('Failed to parse threats CSV:', error)
    return []
  }
}

// Parse the CSV content to get the threats data
let parsedData: ThreatData[] = []
let metadata: { filename: string; lastUpdate: Date } | null = null

try {
  const latestFile = getLatestThreatsFile()
  if (latestFile) {
    parsedData = parseThreatsCSV(latestFile.content)
    metadata = { filename: latestFile.filename, lastUpdate: latestFile.date }
  } else {
    parsedData = []
  }
} catch (error) {
  console.error('Failed to load threats data:', error)
  parsedData = []
}

export const threatsData: ThreatData[] = parsedData
export const threatsMetadata = metadata
