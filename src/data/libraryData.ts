export interface LibraryItem {
  referenceId: string
  documentTitle: string
  downloadUrl: string
  initialPublicationDate: string
  lastUpdateDate: string
  documentStatus: string
  shortDescription: string
  documentType: string
  applicableIndustries: string[]
  authorsOrOrganization: string
  dependencies: string
  regionScope: string
  algorithmFamily: string
  securityLevels: string
  protocolOrToolImpact: string
  toolchainSupport: string
  migrationUrgency: string
  manualCategory?: string
  children?: LibraryItem[]
  category?: string
  status?: 'New' | 'Updated'
}

import { MOCK_LIBRARY_CSV_CONTENT } from './mockTimelineData'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'

// Helper to find the latest library CSV files (Current and Previous)
function getLatestLibraryFiles(): {
  current: { content: string; filename: string; date: Date } | null
  previous: { content: string; filename: string; date: Date } | null
} {
  // Check for mock data environment variable
  if (import.meta.env.VITE_MOCK_DATA === 'true') {
    console.log('Using mock library data for testing')
    return {
      current: {
        content: MOCK_LIBRARY_CSV_CONTENT,
        filename: 'MOCK_LIBRARY_DATA',
        date: new Date(),
      },
      previous: null,
    }
  }

  // Use import.meta.glob to find all library CSV files
  const modules = import.meta.glob('./library_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  // Extract filenames and parse dates
  const files = Object.keys(modules)
    .map((path) => {
      // Path format: ./library_MMDDYYYY.csv or ./library_MMDDYYYY_suffix.csv
      // eslint-disable-next-line security/detect-unsafe-regex
      const match = path.match(/library_(\d{2})(\d{2})(\d{4})(?:_[^.]*)?\.csv$/)
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
    console.warn('No dated library CSV files found.')
    return { current: null, previous: null }
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest library data from: ${files[0].path}`)
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

const { current, previous } = getLatestLibraryFiles()

// Parse current and previous data
const currentItems = current ? parseLibraryCSV(current.content) : []
const previousItems = previous ? parseLibraryCSV(previous.content) : []

// Compute status map if previous data exists
const statusMap = previous
  ? compareDatasets(currentItems, previousItems, 'referenceId')
  : new Map<string, ItemStatus>()

// Inject status into current items and export
export const libraryData: LibraryItem[] = currentItems.map((item) => ({
  ...item,
  status: statusMap.get(item.referenceId),
}))

export const libraryMetadata = current
  ? { filename: current.filename, lastUpdate: current.date }
  : null

function parseLibraryCSV(csvContent: string): LibraryItem[] {
  const lines = csvContent.trim().split('\n')

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

  // Parse all items first
  const items: LibraryItem[] = lines.slice(1).map((line) => {
    const values = parseLine(line)

    const item: LibraryItem = {
      referenceId: values[0],
      documentTitle: values[1],
      downloadUrl: values[2],
      initialPublicationDate: values[3],
      lastUpdateDate: values[4],
      documentStatus: values[5],
      shortDescription: values[6].replace(/^"|"$/g, ''),
      documentType: values[7],
      applicableIndustries: values[8].split(';').map((s) => s.trim()),
      authorsOrOrganization: values[9],
      dependencies: values[10],
      regionScope: values[11],
      algorithmFamily: values[12],
      securityLevels: values[13].replace(/^"|"$/g, ''),
      protocolOrToolImpact: values[14].replace(/^"|"$/g, ''),
      toolchainSupport: values[15],
      migrationUrgency: values[16],
      manualCategory: values[18] || undefined,
      children: [],
    }

    // Categorization Logic
    if (item.manualCategory) {
      item.category = item.manualCategory
    } else {
      const title = item.documentTitle.toLowerCase()
      const type = item.documentType.toLowerCase()

      if (type.includes('pki') || type.includes('certificate') || title.includes('x.509')) {
        item.category = 'PKI Certificate Management'
      } else if (
        type === 'protocol' ||
        title.includes('tls') ||
        title.includes('ssh') ||
        title.includes('ikev2') ||
        title.includes('cms')
      ) {
        item.category = 'Protocols'
      } else if (
        (title.includes('key-encapsulation') || title.includes('kem')) &&
        type === 'algorithm'
      ) {
        item.category = 'KEM'
      } else if (
        (title.includes('signature') || title.includes('dsa') || title.includes('sign')) &&
        type === 'algorithm'
      ) {
        item.category = 'Digital Signature'
      } else {
        item.category = 'General Recommendations'
      }
    }

    return item
  })

  // Build Tree Structure
  const itemMap = new Map<string, LibraryItem>()
  items.forEach((item) => itemMap.set(item.referenceId, item))

  items.forEach((item) => {
    // Parse dependencies
    const deps = item.dependencies
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d)

    deps.forEach((depId) => {
      const parent = itemMap.get(depId)
      if (parent) {
        parent.children = parent.children || []
        if (!parent.children.includes(item)) {
          parent.children.push(item)
        }
      }
    })
  })

  // Return ALL items, not just roots, so we can group them by category
  return items
}
