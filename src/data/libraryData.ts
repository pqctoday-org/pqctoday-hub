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
  categories: string[] // Multi-category support
  status?: 'New' | 'Updated'
}

import { MOCK_LIBRARY_CSV_CONTENT } from './mockTimelineData'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'

// C-001: Single source of truth for categories
export const LIBRARY_CATEGORIES = [
  'Digital Signature',
  'KEM',
  'PKI Certificate Management',
  'Protocols',
  'General Recommendations',
] as const

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number]

// C-002/C-003: Map CSV manual_category values to UI categories
const CATEGORY_ALIASES: Record<string, LibraryCategory> = {
  'General PQC Migration': 'General Recommendations',
  'Government Guidance': 'General Recommendations',
  'PQC Protocol Specification': 'Protocols',
  'PQC Certificate Standard': 'PKI Certificate Management',
}

// Helper to detect all applicable categories for an item
function detectCategories(title: string, type: string): LibraryCategory[] {
  const categories: LibraryCategory[] = []
  const lowerTitle = title.toLowerCase()
  const lowerType = type.toLowerCase()

  // PKI/Certificate detection
  if (
    lowerType.includes('pki') ||
    lowerType.includes('certificate') ||
    lowerTitle.includes('x.509') ||
    lowerTitle.includes('x509')
  ) {
    categories.push('PKI Certificate Management')
  }

  // Protocol detection
  if (
    lowerType === 'protocol' ||
    lowerTitle.includes('tls') ||
    lowerTitle.includes('ssh') ||
    lowerTitle.includes('ikev2') ||
    lowerTitle.includes('cms') ||
    lowerTitle.includes('ipsec')
  ) {
    categories.push('Protocols')
  }

  // KEM detection
  if (
    (lowerTitle.includes('key-encapsulation') ||
      lowerTitle.includes('kem') ||
      lowerTitle.includes('kyber')) &&
    (lowerType === 'algorithm' || lowerType.includes('pki'))
  ) {
    categories.push('KEM')
  }

  // Digital Signature detection
  if (
    (lowerTitle.includes('signature') ||
      lowerTitle.includes('dsa') ||
      lowerTitle.includes('sign') ||
      lowerTitle.includes('dilithium') ||
      lowerTitle.includes('sphincs')) &&
    (lowerType === 'algorithm' || lowerType.includes('pki'))
  ) {
    categories.push('Digital Signature')
  }

  // Fallback to General Recommendations if no specific category detected
  if (categories.length === 0) {
    categories.push('General Recommendations')
  }

  return categories
}

// R-002: Export error state for UI consumption
export let libraryError: string | null = null

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
    libraryError = 'No library data files found. Please check data directory.'
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
      categories: [], // Will be populated below
    }

    // Multi-category Logic: Combine manual_category WITH auto-detected categories
    const autoCategories = detectCategories(item.documentTitle, item.documentType)

    if (item.manualCategory) {
      // Manual category from CSV - map through aliases
      const mappedCategory = CATEGORY_ALIASES[item.manualCategory] ?? item.manualCategory
      // Check if it's a valid category
      if (LIBRARY_CATEGORIES.includes(mappedCategory as LibraryCategory)) {
        // Start with manual category, then add any auto-detected ones that aren't already included
        const allCategories = new Set<string>([mappedCategory])
        autoCategories.forEach((cat) => allCategories.add(cat))
        // Remove 'General Recommendations' if we have other specific categories
        if (allCategories.size > 1 && allCategories.has('General Recommendations')) {
          allCategories.delete('General Recommendations')
        }
        item.categories = Array.from(allCategories)
      } else {
        item.categories = autoCategories
      }
    } else {
      // Auto-detect multiple categories based on title and type
      item.categories = autoCategories
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
