export interface AlgorithmDetail {
  family: string
  name: string
  securityLevel: number | null
  aesEquivalent: string
  publicKeySize: number
  privateKeySize: number
  signatureCiphertextSize: number | null
  sharedSecretSize: number | null
  keyGenCycles: string
  signEncapsCycles: string
  verifyDecapsCycles: string
  stackRAM: number
  optimizationTarget: string
  fipsStandard: string
  useCaseNotes: string
  type: 'KEM' | 'Signature' | 'Classical KEM' | 'Classical Sig'
}

// Import CSV data dynamically
const csvModule = import.meta.glob('./pqc_complete_algorithm_reference_*.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmDetail[] | null = null
export let loadedFileMetadata: { filename: string; date: Date | null } | null = null

// Helper to extract date from filename (format: MMDDYYYY)
export function getDateFromFilename(path: string): Date | null {
  const match = path.match(/_(\d{8})\.csv$/)
  if (!match) return null

  const dateStr = match[1]
  const month = parseInt(dateStr.substring(0, 2)) - 1 // JS months are 0-indexed
  const day = parseInt(dateStr.substring(2, 4))
  const year = parseInt(dateStr.substring(4, 8))

  const date = new Date(year, month, day)
  // Validate date (e.g. avoid invalid dates like 13/32/2025)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }

  return date
}

export async function loadPQCAlgorithmsData(): Promise<AlgorithmDetail[]> {
  if (cachedData) return cachedData

  const paths = Object.keys(csvModule)
  if (paths.length === 0) {
    throw new Error('No PQC Algorithms CSV files found')
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
  console.log(`Loading PQC algorithms from: ${csvPath}`)

  const date = getDateFromFilename(csvPath)
  loadedFileMetadata = {
    filename: csvPath.split('/').pop() || csvPath,
    date: date,
  }

  // eslint-disable-next-line security/detect-object-injection
  const loadCsv = csvModule[csvPath] as () => Promise<string>
  const csvContent = await loadCsv()

  const lines = csvContent.split('\n').filter((line) => line.trim() !== '')
  const data: AlgorithmDetail[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const line = lines[i]
    const values = parseCSVLine(line)

    if (values.length >= 14) {
      data.push({
        family: values[0],
        name: values[1],
        securityLevel: values[2] === 'N/A' ? null : parseInt(values[2]),
        aesEquivalent: values[3],
        publicKeySize: parseInt(values[4]),
        privateKeySize: parseInt(values[5]),
        signatureCiphertextSize: values[6] === 'N/A' ? null : parseInt(values[6]),
        sharedSecretSize: values[7] === 'N/A' ? null : parseInt(values[7]),
        keyGenCycles: values[8],
        signEncapsCycles: values[9],
        verifyDecapsCycles: values[10],
        stackRAM: parseInt(values[11].replace(/[~,]/g, '')),
        optimizationTarget: values[12],
        fipsStandard: values[13],
        useCaseNotes: values[14] || '',
        type: values[0] as 'KEM' | 'Signature' | 'Classical KEM' | 'Classical Sig',
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

// Helper functions for categorization
export function isPQC(algo: AlgorithmDetail): boolean {
  return algo.family === 'KEM' || algo.family === 'Signature'
}

export function isClassical(algo: AlgorithmDetail): boolean {
  return algo.family === 'Classical KEM' || algo.family === 'Classical Sig'
}

export function getPerformanceCategory(cycles: string): 'Fast' | 'Moderate' | 'Slow' {
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 'Moderate'

  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  if (!match) return 'Moderate'

  const multiplier = parseFloat(match[1])

  if (multiplier <= 1) return 'Fast'
  if (multiplier <= 10) return 'Moderate'
  return 'Slow'
}

export function getSecurityLevelColor(level: number | null): string {
  if (level === null) return 'bg-muted/50 text-muted-foreground border-border'
  if (level === 1) return 'bg-primary/10 text-primary border-primary/30'
  if (level === 2) return 'bg-accent/10 text-accent border-accent/30'
  if (level === 3) return 'bg-success/10 text-success border-success/30'
  if (level === 4) return 'bg-warning/10 text-warning border-warning/30'
  return 'bg-destructive/10 text-destructive border-destructive/30' // Level 5
}

export function getPerformanceColor(category: 'Fast' | 'Moderate' | 'Slow'): string {
  if (category === 'Fast') return 'bg-success/10 text-success border-success/30'
  if (category === 'Moderate') return 'bg-warning/10 text-warning border-warning/30'
  return 'bg-destructive/10 text-destructive border-destructive/30'
}
