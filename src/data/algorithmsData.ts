export interface AlgorithmTransition {
  classical: string
  keySize?: string
  pqc: string
  function: 'Encryption/KEM' | 'Signature'
  deprecationDate: string
  standardizationDate: string
}

// Import CSV data dynamically
const csvModule = import.meta.glob('./algorithms_transitions_12052025.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmTransition[] | null = null

export async function loadAlgorithmsData(): Promise<AlgorithmTransition[]> {
  if (cachedData) return cachedData

  const csvPath = Object.keys(csvModule)[0]
  if (!csvPath) {
    throw new Error('Algorithms CSV file not found')
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
