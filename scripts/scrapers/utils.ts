// Shared utilities and patterns
import fs from 'fs'
import path from 'path'

// Helper: Fetch Text with User Agent
export const fetchText = async (url: string) => {
  // Basic retry logic could be added here
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  // Handle 404/etc gracefully in caller or throw?
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  return res.text()
}

export const PQC_PATTERNS = [
  /ML-KEM\s*(\[.*?\])?/gi,
  /ML-DSA\s*(\[.*?\])?/gi,
  /SLH-DSA\s*(\[.*?\])?/gi,
  /LMS\s*(\[.*?\])?/gi,
  /XMSS\s*(\[.*?\])?/gi,
  /Falcon\s*(\[.*?\])?/gi,
  /SPHINCS\+\s*(\[.*?\])?/gi,
  /HSS\s*(\[.*?\])?/gi,
]

// Focused Classical Patterns (RSA/ECC with Key Lengths)
export const CLASSICAL_PATTERNS = [
  { name: 'RSA', regex: /RSA\D{0,10}(\d{3,4})/gi }, // Matches RSA 2048, RSA-2048, RSA Modulo 2048
  { name: 'RSA', regex: /RSA-PSS\D{0,10}(\d{3,4})/gi },
  { name: 'RSA', regex: /RSA-PKCS1\D{0,10}(\d{3,4})/gi },
  { name: 'ECDSA', regex: /ECDSA\D{0,20}(P-\d{3}|BrainpoolP\w+|secp\w+)/gi }, // Matches ECDSA P-256, etc.
  { name: 'ECDSA', regex: /(P-(?:256|384|521))/gi }, // Capture full P-256
  { name: 'ECDH', regex: /ECDH\D{0,10}(P-\d{3}|BrainpoolP\w+|secp\w+)/gi },
  { name: 'EdDSA', regex: /Ed(25519|448)/gi },
  { name: 'X25519', regex: /X(25519|448)/gi },
  // Fallback: Generic detection without key length
  { name: 'RSA', regex: /\bRSA\b/gi },
  { name: 'ECDSA', regex: /\bECDSA\b/gi },
  { name: 'ECDH', regex: /\bECDH\b/gi },
]

export const extractAlgorithms = (text: string, patterns: any[]): string => {
  const findings: Record<string, Set<string>> = {}

  // Standard PQC Regex Array (legacy support for PQC_PATTERNS which are just RegExp[])
  if (patterns[0] instanceof RegExp) {
    const matches = new Set<string>()
    patterns.forEach((regex: RegExp) => {
      const found = text.match(regex)
      if (found) found.forEach((m) => matches.add(m.trim()))
    })
    return Array.from(matches).join(', ')
  }

  // Detailed Classical Object Array
  patterns.forEach((p) => {
    let match
    // Reset lastIndex for global regex if needed, though matchAll/exec handles it
    // We use matchAll or exec loop
    const regex = new RegExp(p.regex) // Clone to be safe or use sticky

    const plainMatches = text.match(p.regex)
    if (plainMatches) {
      plainMatches.forEach((m) => {
        // Re-run exec to get capture group for this specific match string
        // This is a bit inefficient but safe for simple text
        const capture = p.regex.exec(m)
        // Reset regex state
        p.regex.lastIndex = 0

        const val = capture ? capture[1] : null
        if (!findings[p.name]) findings[p.name] = new Set()

        if (val) findings[p.name].add(val)
        else findings[p.name].add('Detected')
      })
    }
  })

  // Format Output: "RSA (2048, 3072), ECDSA (P-256)"
  const parts: string[] = []
  Object.entries(findings).forEach(([algo, details]) => {
    const detailArray = Array.from(details)
    // Filter out "Detected" if we have specific numbers
    const specific = detailArray.filter((d) => d !== 'Detected')

    if (specific.length > 0) {
      // Sort numbers if they are numbers
      specific.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''))
        const numB = parseInt(b.replace(/\D/g, ''))
        return numA && numB ? numA - numB : a.localeCompare(b)
      })
      parts.push(`${algo} (${specific.join(', ')})`)
    } else {
      parts.push(algo)
    }
  })

  return parts.join(', ')
}

// Helper: Standardize Date to ISO 8601 (YYYY-MM-DD)
export const standardizeDate = (dateStr: string): string => {
  if (!dateStr) return ''

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

  // US Format (MM/DD/YYYY)
  let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const [_, month, day, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // EU Format (DD/MM/YYYY) - Careful with ambiguity, but usually context dependent.
  // If > 12, it's day. If we assume US first above, this captures the rest.
  match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    // Fallback or explicit check?
    // Let's rely on standardizing based on source if possible, but for generic:
    // Attempt Date parse
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }
  }

  // Attempt direct Date parse for other formats
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }

  return dateStr // Return original if fail
}

// Helper: Normalize Algorithm Lists (clean commas, trim, unique)
export const normalizeAlgorithmList = (input: string | boolean | undefined): string | boolean => {
  if (typeof input === 'boolean') return input
  if (!input) return ''

  // Handle "No PQC" magic string or empty/dash
  if (input === 'No PQC Mechanisms Detected' || input === '-' || input.trim() === '') {
    return 'No PQC Mechanisms Detected' // Standardize to the magic string expected by UI
  }

  // Split, trim, filter empty, unique
  const parts = input
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((p) => p !== 'No PQC Mechanisms Detected' && p !== '-')

  if (parts.length === 0) return 'No PQC Mechanisms Detected'

  // Remove duplicates
  const unique = Array.from(new Set(parts))

  // Canonical Case Mapping
  const CANONICAL_MAP: Record<string, string> = {
    'ml-kem': 'ML-KEM',
    'ml-dsa': 'ML-DSA',
    'slh-dsa': 'SLH-DSA',
    lms: 'LMS',
    xmss: 'XMSS',
    hss: 'HSS',
    'sphincs+': 'SPHINCS+',
    falcon: 'Falcon',
    kyber: 'ML-KEM', // Normalize legacy names
    dilithium: 'ML-DSA',
    sphincs: 'SPHINCS+',
  }

  const normalized = unique.map((p) => {
    const lower = p.toLowerCase()
    return CANONICAL_MAP[lower] || p // Return canonical or original
  })

  // Re-deduplicate after normalization (e.g. SPHINCS+ and sphincs+ become same)
  const finalUnique = Array.from(new Set(normalized))

  return finalUnique.join(', ')
}
