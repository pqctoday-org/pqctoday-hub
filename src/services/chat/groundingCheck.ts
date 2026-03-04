// SPDX-License-Identifier: GPL-3.0-only
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
  'sensitivity',
  'classification',
  'asset inventory',
  'data retention',
  'gdpr',
  'hipaa',
  'dora',
  'nis2',
])

/** Patterns that match entity-like references in LLM output */
const ENTITY_PATTERNS = [
  // FIPS / RFC / SP numbers: "FIPS 203", "RFC 9629", "SP 800-208"
  /\b(FIPS|RFC|SP|NIST SP)\s?\d[\d-]+\b/g,
  // PQC algorithm families: "ML-KEM-768", "ML-DSA-44", "SLH-DSA-SHA2-128s", "FN-DSA"
  /\b(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|BIKE|HQC|FrodoKEM|Classic McEliece|CRYSTALS-Kyber|CRYSTALS-Dilithium|SPHINCS\+|Falcon|XMSS|LMS|HSS)[\w-]*/gi,
  // Capitalized multi-word names (likely product/org/person names): "Bouncy Castle", "Dr. Lily Chen"
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g,
  // Titled person names: "Dr. Alice Smith", "Prof. Bob Jones"
  /\b(?:Dr\.|Prof\.|Mr\.|Ms\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g,
  // Product versions: "OpenSSL 3.6.0", "liboqs v0.15.1", "Botan 3.4"
  /\b[A-Z][\w-]*\s+v?\d+\.\d+(?:\.\d+)?\b/g,
  // Specific deadline claims: "by 2030", "before 2028", "deadline 2035"
  /\b(?:by|before|until|deadline[:\s]+|mandated? (?:by|in))\s*\d{4}\b/gi,
]

/** Common phrases that look like entities but aren't — reduce false positives */
const FALSE_POSITIVE_PHRASES = new Set([
  'key exchange',
  'digital signature',
  'public key',
  'private key',
  'key management',
  'key encapsulation',
  'post quantum',
  'quantum safe',
  'quantum computing',
  'quantum threat',
  'quantum resistant',
  'side channel',
  'hash based',
  'code based',
  'learning modules',
  'deep link',
  'best practices',
  'risk score',
  'risk level',
  'common criteria',
  'security level',
  'key generation',
  'key pair',
  'key size',
  'key length',
  'migration timeline',
  'migration strategy',
  'migration program',
  'compliance framework',
  'infrastructure layer',
])

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
        'org',
        'vendor',
        'categoryName',
        'moduleName',
        'moduleId',
        'quizCategory',
        'leader',
      ]) {
        const val = c.metadata[key]
        if (val) groundedTerms.add(val.toLowerCase())
      }
    }

    // Scan first 500 chars of each chunk for entity references
    const snippet = c.content.slice(0, 500).toLowerCase()
    // Extract FIPS/RFC/SP references from chunk content
    const contentRefs = snippet.match(/\b(fips|rfc|sp)\s?\d[\d-]+\b/gi)
    if (contentRefs) {
      for (const ref of contentRefs) groundedTerms.add(ref.toLowerCase())
    }
    // Extract product/org names from content (capitalized words near "by", "from", "using")
    const productRefs = c.content.slice(0, 500).match(/\b[A-Z][\w-]+(?:\s+[A-Z][\w-]+){0,2}\b/g)
    if (productRefs) {
      for (const ref of productRefs) groundedTerms.add(ref.toLowerCase())
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

    // Skip common phrases that look like entities but aren't
    if (FALSE_POSITIVE_PHRASES.has(lower)) continue

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

  // Warn at 2+ ungrounded entities — catches fabricated names/products/standards
  return {
    ungroundedEntities,
    hasWarning: ungroundedEntities.length >= 2,
  }
}
