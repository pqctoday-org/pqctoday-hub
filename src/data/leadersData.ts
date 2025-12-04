export interface Leader {
  name: string
  country: string
  title: string
  organizations: string[]
  type: 'Public' | 'Private' | 'Academic'
  category: string
  bio: string
  imageUrl?: string
  websiteUrl?: string
  linkedinUrl?: string
  keyResourceUrl?: string
}

// Helper to find the latest leaders CSV file
function getLatestLeadersFile(): { content: string; filename: string; date: Date } | null {
  // Use import.meta.glob to find all leaders CSV files
  const modules = import.meta.glob('./leaders_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  // Extract filenames and parse dates
  const files = Object.keys(modules)
    .map((path) => {
      // Path format: ./leaders_MMDDYYYY.csv or ./leaders_MMDDYYYY_suffix.csv
      // eslint-disable-next-line security/detect-unsafe-regex
      const match = path.match(/leaders_(\d{2})(\d{2})(\d{4})(?:_[^.]*)?\.csv$/)
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
    console.warn('No dated leaders CSV files found.')
    return null
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest leaders data from: ${files[0].path}`)
  // Extract just the filename from the path
  const filename = files[0].path.split('/').pop() || files[0].path
  return { content: files[0].content, filename, date: files[0].date }
}

const latestFile = getLatestLeadersFile()
export const leadersData: Leader[] = latestFile ? parseLeadersCSV(latestFile.content) : []
export const leadersMetadata = latestFile
  ? { filename: latestFile.filename, lastUpdate: latestFile.date }
  : null

function parseLeadersCSV(csvContent: string): Leader[] {
  const lines = csvContent.trim().split('\n')
  // New Headers: Name,Country,Role,Organization,Type,Category,Contribution,ImageUrl,WebsiteUrl,LinkedinUrl,KeyResourceUrl

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

  return lines.slice(1).map((line) => {
    const values = parseLine(line)

    return {
      name: values[0],
      country: values[1],
      title: values[2], // Role
      organizations: values[3].split(';').map((o) => o.trim()),
      type: values[4] as 'Public' | 'Private' | 'Academic',
      category: values[5],
      bio: values[6].replace(/^"|"$/g, ''), // Contribution -> Bio
      imageUrl: values[7],
      websiteUrl: values[8],
      linkedinUrl: values[9],
      keyResourceUrl: values[10],
    }
  })
}
