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
const csvModule = import.meta.glob('./pqc_complete_algorithm_reference.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmDetail[] | null = null

export async function loadPQCAlgorithmsData(): Promise<AlgorithmDetail[]> {
  if (cachedData) return cachedData

  const csvPath = Object.keys(csvModule)[0]
  if (!csvPath) {
    throw new Error('PQC Algorithms CSV file not found')
  }

  const loadCsv = csvModule[csvPath] as () => Promise<string>
  const csvContent = await loadCsv()

  const lines = csvContent.split('\n').filter((line) => line.trim() !== '')
  const data: AlgorithmDetail[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
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

  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  if (!match) return 'Moderate'

  const multiplier = parseFloat(match[1])

  if (multiplier <= 1) return 'Fast'
  if (multiplier <= 10) return 'Moderate'
  return 'Slow'
}

export function getSecurityLevelColor(level: number | null): string {
  if (level === null) return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  if (level === 1) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  if (level === 2) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  if (level === 3) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (level === 4) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30' // Level 5
}

export function getPerformanceColor(category: 'Fast' | 'Moderate' | 'Slow'): string {
  if (category === 'Fast') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (category === 'Moderate') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}
