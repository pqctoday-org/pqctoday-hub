import type { RAGChunk } from '@/types/ChatTypes'

/**
 * Domain terms that are always considered grounded — common PQC/crypto vocabulary
 * that doesn't need to appear in RAG chunks to be valid.
 */
const ALWAYS_GROUNDED = new Set([
  'nist',
  'pqc',
  'rsa',
  'aes',
  'ecc',
  'ecdsa',
  'eddsa',
  'sha',
  'tls',
  'ietf',
  'quantum',
  'classical',
  'post-quantum',
  'cryptography',
  'encryption',
  'decryption',
  'signature',
  'hash',
  'certificate',
  'x.509',
  'pkcs',
  'kem',
  'dsa',
  'dh',
  'diffie-hellman',
  'lattice',
  'code-based',
  'hash-based',
  'isogeny',
  'multivariate',
  'shor',
  'grover',
  'qubits',
  'anssi',
  'bsi',
  'cccs',
  'enisa',
  'etsi',
  'iso',
  'fips',
  'cnsa',
  'openssl',
  'bouncycastle',
  'liboqs',
])

/** Patterns that match entity-like references in LLM output */
const ENTITY_PATTERNS = [
  // FIPS / RFC / SP numbers: "FIPS 203", "RFC 9629", "SP 800-208"
  /\b(FIPS|RFC|SP|NIST SP)\s?\d[\d-]+\b/g,
  // PQC algorithm families: "ML-KEM-768", "ML-DSA-44", "SLH-DSA-SHA2-128s", "FN-DSA"
  /\b(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|BIKE|HQC|FrodoKEM|Classic McEliece|CRYSTALS-Kyber|CRYSTALS-Dilithium|SPHINCS\+|Falcon|XMSS|LMS|HSS)[\w-]*/gi,
  // Capitalized multi-word names (likely product/org/person names): "Bouncy Castle", "Dr. Lily Chen"
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g,
]

/**
 * Checks whether an LLM response is well-grounded in the provided RAG chunks.
 * Returns ungrounded entity names and a warning flag.
 */
export function checkGrounding(
  responseText: string,
  chunks: RAGChunk[]
): { ungroundedEntities: string[]; hasWarning: boolean } {
  // Build grounded terms set from chunk titles + metadata
  const groundedTerms = new Set<string>()

  for (const c of chunks) {
    if (c.title) groundedTerms.add(c.title.toLowerCase())

    // Add metadata values that represent entity names
    if (c.metadata) {
      for (const key of [
        'referenceId',
        'acronym',
        'softwareName',
        'threatId',
        'country',
        'fipsStandard',
        'algorithmFamily',
      ]) {
        const val = c.metadata[key]
        if (val) groundedTerms.add(val.toLowerCase())
      }
    }

    // Also add content keywords (first 200 chars of each chunk for efficiency)
    const snippet = c.content.slice(0, 200).toLowerCase()
    // Extract FIPS/RFC/SP references from chunk content
    const contentRefs = snippet.match(/\b(fips|rfc|sp)\s?\d[\d-]+\b/gi)
    if (contentRefs) {
      for (const ref of contentRefs) groundedTerms.add(ref.toLowerCase())
    }
  }

  // Extract entity-like names from LLM response
  const extractedEntities = new Set<string>()
  for (const pattern of ENTITY_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(responseText)) !== null) {
      extractedEntities.add(match[0])
    }
  }

  // Check each extracted entity against grounded terms
  const ungroundedEntities: string[] = []

  for (const entity of extractedEntities) {
    const lower = entity.toLowerCase()

    // Skip if in always-grounded allowlist
    if (ALWAYS_GROUNDED.has(lower)) continue

    // Skip single common words
    if (lower.length < 3) continue

    // Check exact match
    if (groundedTerms.has(lower)) continue

    // Check partial match — "ML-KEM" should match "ML-KEM-768" in grounded set
    let partialMatch = false
    for (const term of groundedTerms) {
      if (term.includes(lower) || lower.includes(term)) {
        partialMatch = true
        break
      }
    }
    if (partialMatch) continue

    ungroundedEntities.push(entity)
  }

  // Only warn if there are 3+ ungrounded entities — prevents false positives
  // from minor name variations or common phrases
  return {
    ungroundedEntities,
    hasWarning: ungroundedEntities.length >= 3,
  }
}
