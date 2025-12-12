export interface AlgorithmTransition {
  classical: string
  keySize?: string
  pqc: string
  function: 'Encryption/KEM' | 'Signature'
  deprecationDate: string
  standardizationDate: string
}

import { getDateFromFilename } from './pqcAlgorithmsData'

// Import CSV data dynamically
const csvModule = import.meta.glob('./algorithms_transitions_*.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmTransition[] | null = null
export let loadedTransitionMetadata: { filename: string; date: Date | null } | null = null

export async function loadAlgorithmsData(): Promise<AlgorithmTransition[]> {
  if (cachedData) return cachedData

  const paths = Object.keys(csvModule)
  if (paths.length === 0) {
    throw new Error('Algorithms CSV file not found')
  }

  // Sort paths by date in descending order (newest first)
  const sortedPaths = paths.sort((a, b) => {
    const dateA = getDateFromFilename(a)
    const dateB = getDateFromFilename(b)

    // If we can't parse a date, treat it as very old so valid dates come first
    if (!dateA) return 1
    if (!dateB) return -1

    return dateB.getTime() - dateA.getTime()
  })

  // Pick the most recent file
  const csvPath = sortedPaths[0]
  console.log(`Loading Transition algorithms from: ${csvPath}`)

  const date = getDateFromFilename(csvPath)
  loadedTransitionMetadata = {
    filename: csvPath.split('/').pop() || csvPath,
    date: date,
  }

  const loadCsv = csvModule[csvPath] as () => Promise<string>
  const csvContent = await loadCsv()

  const lines = csvContent.split('\n').filter((line) => line.trim() !== '')
  const data: AlgorithmTransition[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = parseCSVLine(line)

    if (values.length >= 6) {
      data.push({
        classical: values[0],
        keySize: values[1],
        pqc: values[2],
        function: values[3] as 'Encryption/KEM' | 'Signature',
        deprecationDate: values[4],
        standardizationDate: values[5],
      })
    }
  }

  cachedData = data
  return data
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
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

// For backward compatibility, export the data synchronously
// This will be populated after the first load
export const algorithmsData: AlgorithmTransition[] = []
