export interface Leader {
  name: string
  country: string
  title: string
  organizations: string[]
  type: 'Public' | 'Private'
  bio: string
  imageUrl?: string
  websiteUrl?: string
  linkedinUrl?: string
  keyContribution?: {
    title: string
    type: string
  }
}

// Helper to find the latest leaders CSV file
function getLatestLeadersContent(): string | null {
  // Use import.meta.glob to find all leaders CSV files
  const modules = import.meta.glob('./leaders_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  // Extract filenames and parse dates
  const files = Object.keys(modules)
    .map((path) => {
      // Path format: ./leaders_MMDDYYYY.csv
      const match = path.match(/leaders_(\d{2})(\d{2})(\d{4})\.csv$/)
      if (match) {
        const [, month, day, year] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return { path, date, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No dated leaders CSV files found.')
    return null
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest leaders data from: ${files[0].path}`)
  return files[0].content
}

const csvContent = getLatestLeadersContent()
export const leadersData: Leader[] = csvContent ? parseLeadersCSV(csvContent) : []

function parseLeadersCSV(csvContent: string): Leader[] {
  const lines = csvContent.trim().split('\n')
  // Headers: Name,Country,Title,Organizations,Type,Bio,ImageUrl,WebsiteUrl,LinkedinUrl,KeyContributionTitle,KeyContributionType

  const parseLine = (line: string): string[] => {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
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

  return lines.slice(1).map((line) => {
    const values = parseLine(line)

    return {
      name: values[0],
      country: values[1],
      title: values[2],
      organizations: values[3].split(';').map((o) => o.trim()),
      type: values[4] as 'Public' | 'Private',
      bio: values[5].replace(/^"|"$/g, ''), // Remove quotes if present
      imageUrl: values[6],
      websiteUrl: values[7],
      linkedinUrl: values[8],
      keyContribution: values[9]
        ? {
            title: values[9],
            type: values[10],
          }
        : undefined,
    }
  })
}
