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
  status?: 'New' | 'Updated'
}

import { compareDatasets, type ItemStatus } from '../utils/dataComparison'

// Helper to find the latest two leaders CSV files
function getLatestLeadersFiles(): {
  current: { content: string; filename: string; date: Date } | null
  previous: { content: string; filename: string; date: Date } | null
} {
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
    return { current: null, previous: null }
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest leaders data from: ${files[0].path}`)
  if (files.length > 1) {
    console.log(`Comparison data loaded from: ${files[1].path}`)
  }

  return {
    current: {
      content: files[0].content,
      filename: files[0].path.split('/').pop() || files[0].path,
      date: files[0].date,
    },
    previous:
      files.length > 1
        ? {
            content: files[1].content,
            filename: files[1].path.split('/').pop() || files[1].path,
            date: files[1].date,
          }
        : null,
  }
}

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

const { current, previous } = getLatestLeadersFiles()

const currentItems = current ? parseLeadersCSV(current.content) : []
const previousItems = previous ? parseLeadersCSV(previous.content) : []

// Compute status map if previous data exists
const statusMap = previous
  ? compareDatasets(currentItems, previousItems, 'name')
  : new Map<string, ItemStatus>()

// Inject status into current items and export
export const leadersData: Leader[] = currentItems.map((item) => ({
  ...item,
  status: statusMap.get(item.name),
}))

export const leadersMetadata = current
  ? { filename: current.filename, lastUpdate: current.date }
  : null
