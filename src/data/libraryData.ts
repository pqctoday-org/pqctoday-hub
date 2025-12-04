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
  children?: LibraryItem[]
  category?: string
}

// Helper to find the latest library CSV file
function getLatestLibraryFile(): { content: string; filename: string; date: Date } | null {
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
    return null
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest library data from: ${files[0].path}`)
  const filename = files[0].path.split('/').pop() || files[0].path
  return { content: files[0].content, filename, date: files[0].date }
}

const latestFile = getLatestLibraryFile()
export const libraryData: LibraryItem[] = latestFile ? parseLibraryCSV(latestFile.content) : []
export const libraryMetadata = latestFile
  ? { filename: latestFile.filename, lastUpdate: latestFile.date }
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
      children: [],
    }

    // Categorization Logic
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
