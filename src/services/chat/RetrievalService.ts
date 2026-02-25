import MiniSearch from 'minisearch'
import type { RAGChunk } from '@/types/ChatTypes'

/**
 * Query expansion: maps natural-language concepts to technical terms
 * so that "quantum signing algorithm" retrieves ML-DSA chunks.
 */
const QUERY_EXPANSIONS: Record<string, string[]> = {
  // Signing / signatures
  signing: ['ML-DSA', 'SLH-DSA', 'FN-DSA', 'digital signature', 'ECDSA', 'EdDSA'],
  signature: ['ML-DSA', 'SLH-DSA', 'FN-DSA', 'digital signature', 'ECDSA', 'EdDSA'],
  'digital signature': ['ML-DSA', 'SLH-DSA', 'FN-DSA', 'ECDSA', 'EdDSA'],

  // Key exchange / encapsulation
  'key exchange': ['ML-KEM', 'ECDH', 'Diffie-Hellman', 'key encapsulation'],
  'key encapsulation': ['ML-KEM', 'FrodoKEM', 'HQC', 'Classic-McEliece'],
  encryption: ['ML-KEM', 'key encapsulation', 'AES'],
  kem: ['ML-KEM', 'FrodoKEM', 'HQC', 'Classic-McEliece', 'key encapsulation'],

  // Algorithm families
  lattice: ['ML-KEM', 'ML-DSA', 'FN-DSA', 'FrodoKEM', 'lattice-based'],
  'hash-based': ['SLH-DSA', 'LMS', 'XMSS', 'hash-based signatures', 'stateful'],
  'code-based': ['HQC', 'Classic-McEliece', 'code-based'],

  // Standards
  fips: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'ML-KEM', 'ML-DSA', 'SLH-DSA'],
  nist: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'NIST', 'ML-KEM', 'ML-DSA', 'SLH-DSA'],
  standard: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'standardization'],
  standardization: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'NIST'],

  // Concepts
  'harvest now': ['harvest now decrypt later', 'HNDL', 'SNDL'],
  hndl: ['harvest now decrypt later', 'HNDL'],
  migration: ['crypto agility', 'migration', 'transition', 'migration priority'],
  'crypto agility': ['crypto agility', 'agility', 'hybrid cryptography'],
  hybrid: ['hybrid cryptography', 'hybrid key exchange', 'composite'],
  quantum: ['post-quantum cryptography', 'quantum computing', 'Q-Day'],
  'quantum threat': ['quantum computing', 'Q-Day', 'harvest now decrypt later'],
  tls: ['TLS', 'hybrid key exchange', 'ML-KEM', 'transport layer security'],
  pki: ['public key infrastructure', 'certificate', 'X.509'],
  certificate: ['X.509', 'certificate authority', 'PKI', 'certificate signing request'],

  // Module content topics
  shor: ["Shor's Algorithm", 'RSA', 'factoring', 'quantum threat'],
  grover: ["Grover's Algorithm", 'AES', 'symmetric', 'search'],
  '5g': ['5G', 'SUCI', 'authentication', 'telecom', 'USIM'],
  suci: ['SUCI', '5G', 'concealment', 'ECIES'],
  vpn: ['VPN', 'IPsec', 'IKEv2', 'WireGuard', 'tunnel'],
  ssh: ['SSH', 'key exchange', 'ML-KEM', 'hybrid'],
  email: ['S/MIME', 'CMS', 'email signing', 'email encryption'],
  entropy: ['entropy', 'randomness', 'DRBG', 'SP 800-90', 'QRNG'],
  qkd: ['quantum key distribution', 'BB84', 'QKD'],
  merkle: ['Merkle tree', 'certificate transparency', 'inclusion proof'],
  hsm: ['hardware security module', 'HSM', 'key storage', 'PKCS#11'],
  jwt: ['JSON Web Token', 'JWT', 'JWS', 'JWE', 'API security'],
  blockchain: ['blockchain', 'Bitcoin', 'Ethereum', 'digital assets', 'secp256k1'],
  'code signing': ['code signing', 'Sigstore', 'binary signing', 'package signing'],
  'digital identity': ['digital identity', 'mDL', 'SD-JWT', 'verifiable credential'],
  iot: ['IoT', 'OT', 'industrial', 'constrained devices', 'embedded'],
  cbom: ['CBOM', 'cryptographic bill of materials', 'crypto agility'],

  // Assessment & quiz
  assessment: ['risk score', 'migration priority', 'HNDL relevance', 'data sensitivity'],
  quiz: ['quiz', 'question', 'answer', 'explanation'],
  risk: ['risk score', 'migration priority', 'urgency', 'HNDL'],

  // Certification & compliance
  certification: ['FIPS 140-3', 'ACVP', 'Common Criteria', 'certification', 'validated'],
  acvp: ['ACVP', 'algorithm validation', 'CAVP'],
  'common criteria': ['Common Criteria', 'certification', 'protection profile'],

  // Migration readiness
  readiness: ['readiness', 'gap analysis', 'priority matrix', 'migration priority'],
  'gap analysis': ['gap analysis', 'readiness', 'urgency score', 'priority matrix'],
  priority: ['migration priority', 'urgency', 'priority matrix', 'readiness'],
}

class RetrievalService {
  private static instance: RetrievalService | null = null
  private index: MiniSearch<RAGChunk> | null = null
  private corpus: RAGChunk[] = []
  private corpusById = new Map<string, RAGChunk>()
  private initPromise: Promise<void> | null = null

  // Pre-built entity lookup: lowercased title → chunk IDs
  private entityIndex = new Map<string, string[]>()

  static getInstance(): RetrievalService {
    if (!RetrievalService.instance) {
      RetrievalService.instance = new RetrievalService()
    }
    return RetrievalService.instance
  }

  async initialize(): Promise<void> {
    if (this.index) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.load()
    return this.initPromise
  }

  private async load(): Promise<void> {
    const response = await fetch('/data/rag-corpus.json')
    if (!response.ok) {
      throw new Error(`Failed to load RAG corpus: ${response.status}`)
    }

    this.corpus = await response.json()

    // Build fast lookup by ID
    for (const chunk of this.corpus) {
      this.corpusById.set(chunk.id, chunk)
    }

    // Build entity index for direct title matching
    // Priority sources get indexed: algorithms, glossary, transitions, modules
    const prioritySources = new Set([
      'algorithms',
      'glossary',
      'transitions',
      'modules',
      'module-content',
      'documentation',
      'quiz',
      'assessment',
      'certifications',
      'priority-matrix',
    ])
    for (const chunk of this.corpus) {
      if (!prioritySources.has(chunk.source)) continue

      const titleLower = chunk.title.toLowerCase()
      const existing = this.entityIndex.get(titleLower) ?? []
      existing.push(chunk.id)
      this.entityIndex.set(titleLower, existing)

      // Also index without hyphens/numbers for fuzzy entity match
      // "ML-DSA-44" → also indexed as "ml-dsa", "ml dsa"
      const baseName = titleLower.replace(/-\d+.*$/, '').trim()
      if (baseName !== titleLower) {
        const baseExisting = this.entityIndex.get(baseName) ?? []
        baseExisting.push(chunk.id)
        this.entityIndex.set(baseName, baseExisting)
      }

      // Index without hyphens: "ml-kem" → also "ml kem"
      const noHyphens = titleLower.replace(/-/g, ' ')
      if (noHyphens !== titleLower) {
        const nhExisting = this.entityIndex.get(noHyphens) ?? []
        nhExisting.push(chunk.id)
        this.entityIndex.set(noHyphens, nhExisting)
      }

      // Index metadata acronyms
      if (chunk.metadata?.acronym) {
        const acronymLower = chunk.metadata.acronym.toLowerCase()
        const aExisting = this.entityIndex.get(acronymLower) ?? []
        aExisting.push(chunk.id)
        this.entityIndex.set(acronymLower, aExisting)
      }
    }

    this.index = new MiniSearch<RAGChunk>({
      fields: ['title', 'content', 'category'],
      storeFields: ['id', 'source', 'title', 'content', 'category', 'metadata'],
      searchOptions: {
        boost: { title: 3, category: 1.5 },
        fuzzy: 0.2,
        prefix: true,
      },
    })

    this.index.addAll(this.corpus)
  }

  search(query: string, limit = 10): RAGChunk[] {
    if (!this.index) return []

    const selectedIds = new Set<string>()
    const selected: RAGChunk[] = []

    const addChunk = (id: string): boolean => {
      if (selectedIds.has(id)) return false
      const chunk = this.corpusById.get(id)
      if (!chunk) return false
      selectedIds.add(id)
      selected.push(chunk)
      return true
    }

    // --- Phase 1: Direct entity matching ---
    // Extract potential entity names from the query
    const queryLower = query.toLowerCase()
    const queryTokens = queryLower.split(/\s+/)

    // Try matching full query, then progressively smaller n-grams
    const nGrams: string[] = [queryLower]
    for (let n = Math.min(queryTokens.length, 4); n >= 1; n--) {
      for (let i = 0; i <= queryTokens.length - n; i++) {
        const gram = queryTokens.slice(i, i + n).join(' ')
        if (gram !== queryLower) nGrams.push(gram)
      }
    }

    for (const gram of nGrams) {
      if (selected.length >= 4) break // reserve slots for keyword search
      const entityIds = this.entityIndex.get(gram)
      if (entityIds) {
        for (const id of entityIds) {
          if (selected.length >= 4) break
          addChunk(id)
        }
      }
    }

    // --- Phase 2: Query expansion ---
    // Find matching expansions and run additional searches
    const expandedTerms = new Set<string>()
    for (const token of queryTokens) {
      const expansions = QUERY_EXPANSIONS[token]
      if (expansions) {
        for (const term of expansions) expandedTerms.add(term)
      }
    }
    // Also check multi-word expansion keys
    for (const key of Object.keys(QUERY_EXPANSIONS)) {
      if (key.includes(' ') && queryLower.includes(key)) {
        for (const term of QUERY_EXPANSIONS[key]) expandedTerms.add(term)
      }
    }

    // Search expanded terms and add entity matches
    for (const term of expandedTerms) {
      if (selected.length >= 6) break // leave room for original keyword results
      const termLower = term.toLowerCase()
      const entityIds = this.entityIndex.get(termLower)
      if (entityIds) {
        for (const id of entityIds) {
          if (selected.length >= 6) break
          addChunk(id)
        }
      }
    }

    // --- Phase 3: MiniSearch keyword search with source diversity ---
    const expandedQuery =
      expandedTerms.size > 0 ? `${query} ${[...expandedTerms].join(' ')}` : query

    const results = this.index.search(expandedQuery)

    // Source-diverse fill for remaining slots
    const sourceCounts = new Map<string, number>()
    // Count already-selected sources
    for (const chunk of selected) {
      sourceCounts.set(chunk.source, (sourceCounts.get(chunk.source) ?? 0) + 1)
    }
    const maxPerSource = Math.ceil(limit / 3)

    for (const r of results) {
      if (selected.length >= limit) break
      if (selectedIds.has(r.id)) continue

      const chunk = this.corpusById.get(r.id)
      if (!chunk) continue

      const count = sourceCounts.get(chunk.source) ?? 0
      if (count >= maxPerSource) continue

      addChunk(chunk.id)
      sourceCounts.set(chunk.source, count + 1)
    }

    // Backfill if diversity caps left gaps
    if (selected.length < limit) {
      for (const r of results) {
        if (selected.length >= limit) break
        if (!selectedIds.has(r.id)) addChunk(r.id)
      }
    }

    return selected
  }

  get isReady(): boolean {
    return this.index !== null
  }
}

export const retrievalService = RetrievalService.getInstance()
