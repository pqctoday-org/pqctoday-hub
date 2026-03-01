// SPDX-License-Identifier: GPL-3.0-only
import MiniSearch from 'minisearch'
import type { RAGChunk } from '@/types/ChatTypes'

/**
 * Query intent — determines source boosting and diversity strategy.
 */
export type QueryIntent =
  | 'definition'
  | 'comparison'
  | 'catalog_lookup'
  | 'recommendation'
  | 'country_query'
  | 'general'

/**
 * Optional page context for boosting results relevant to the user's current view.
 */
export interface PageContext {
  page: string
  moduleId?: string
  relevantSources: string[]
  conversationContext?: string[]
}

/**
 * Source boost multipliers per intent — used to re-rank MiniSearch results.
 */
const INTENT_BOOSTS: Record<QueryIntent, Record<string, number>> = {
  definition: {
    glossary: 3,
    algorithms: 2,
    modules: 1.5,
    'module-content': 1.5,
    leaders: 1.5,
    'document-enrichment': 1.2,
  },
  comparison: { algorithms: 2, transitions: 3, glossary: 1.5 },
  catalog_lookup: { migrate: 3, certifications: 2, 'priority-matrix': 1.5 },
  recommendation: {
    assessment: 2,
    'priority-matrix': 2,
    compliance: 1.5,
    migrate: 1.5,
    documentation: 1.5,
    'document-enrichment': 1.3,
  },
  country_query: {
    timeline: 3,
    compliance: 2,
    leaders: 1.5,
    library: 1.2,
    'document-enrichment': 1.5,
  },
  general: { leaders: 1.5 },
}

const COUNTRY_KEYS = new Set([
  'france',
  'anssi',
  'germany',
  'bsi',
  'united states',
  'usa',
  'united kingdom',
  'uk',
  'china',
  'japan',
  'australia',
  'canada',
  'south korea',
  'korea',
  'india',
  'singapore',
  'eu',
  'europe',
  'enisa',
  'etsi',
  // Added countries from corpus
  'spain',
  'ccn',
  'israel',
  'italy',
  'czech republic',
  'czech',
  'new zealand',
  'taiwan',
  'hong kong',
  'malaysia',
  'uae',
  'united arab emirates',
  'saudi arabia',
  'bahrain',
  'jordan',
  'nato',
  'g7',
  'sweden',
  // Adjectival forms
  'french',
  'german',
  'american',
  'british',
  'chinese',
  'japanese',
  'australian',
  'canadian',
  'korean',
  'indian',
  'singaporean',
  'european',
  'spanish',
  'israeli',
  'italian',
  'swedish',
])

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
  fips: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'FIPS 140-3', 'ML-KEM', 'ML-DSA', 'SLH-DSA'],
  nist: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'NIST', 'ML-KEM', 'ML-DSA', 'SLH-DSA'],
  standard: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'standardization'],
  standardization: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'NIST'],

  // Concepts
  'harvest now': ['harvest now decrypt later', 'HNDL', 'SNDL'],
  hndl: ['harvest now decrypt later', 'HNDL'],
  migration: ['crypto agility', 'migration', 'transition', 'migration priority'],
  replacement: ['transition', 'migration', 'post-quantum alternative', 'upgrade'],
  replace: ['transition', 'migration', 'post-quantum alternative', 'upgrade'],
  replacing: ['transition', 'migration', 'post-quantum alternative', 'upgrade'],
  'crypto agility': ['crypto agility', 'agility', 'hybrid cryptography'],
  hybrid: ['hybrid cryptography', 'hybrid key exchange', 'composite'],
  quantum: ['post-quantum cryptography', 'quantum computing', 'Q-Day'],
  'quantum threat': ['quantum computing', 'Q-Day', 'harvest now decrypt later'],
  threat: ['vulnerability', 'risk', 'attack', 'quantum threat'],
  threats: ['vulnerability', 'risk', 'attack', 'quantum threat'],
  financial: ['Financial Services', 'Banking', 'payment', 'SWIFT'],
  tls: ['TLS', 'hybrid key exchange', 'ML-KEM', 'transport layer security', 'OpenSSL'],
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
  validated: ['FIPS 140-3', 'ACVP', 'Common Criteria', 'certification', 'validated'],
  certified: ['FIPS 140-3', 'ACVP', 'Common Criteria', 'certification', 'validated'],
  module: ['cryptographic module', 'FIPS 140-3', 'HSM', 'certification'],
  'fips 140': ['FIPS 140-3', 'cryptographic module', 'certification', 'validated', 'ACVP'],
  'fips 140-3': ['FIPS 140-3', 'cryptographic module', 'certification', 'validated', 'ACVP'],
  acvp: ['ACVP', 'algorithm validation', 'CAVP'],
  'common criteria': ['Common Criteria', 'certification', 'protection profile'],

  // Leaders & organizations
  leader: ['leader', 'contributor', 'researcher', 'organization', 'PQC leader'],
  leaders: ['leader', 'contributor', 'researcher', 'organization', 'PQC leader'],
  academic: ['Academic', 'university', 'researcher', 'professor', 'PQC leader'],
  researcher: ['researcher', 'Academic', 'professor', 'university', 'PQC leader'],
  industry: ['Private', 'Industry', 'vendor', 'company', 'PQC leader'],
  government: ['Public', 'Government', 'agency', 'PQC leader'],
  organization: ['organization', 'company', 'agency', 'institution', 'PQC leader'],

  // Software products & catalog
  library: ['Cryptographic Libraries', 'software', 'product', 'OpenSSL', 'Botan'],
  libraries: ['Cryptographic Libraries', 'software', 'product', 'OpenSSL', 'Botan'],
  software: ['software', 'product', 'Cryptographic Libraries', 'migrate'],
  product: ['software', 'product', 'Cryptographic Libraries', 'migrate'],
  products: ['software', 'product', 'Cryptographic Libraries', 'migrate'],
  tool: ['software', 'product', 'tool', 'Cryptographic Libraries'],
  tools: ['software', 'product', 'tool', 'Cryptographic Libraries'],
  ready: ['PQC Support', 'Yes', 'software', 'product', 'migrate'],
  'pqc-ready': ['PQC Support', 'Yes', 'software', 'product', 'migrate'],

  // Migration readiness
  readiness: ['readiness', 'gap analysis', 'priority matrix', 'migration priority'],
  'gap analysis': ['gap analysis', 'readiness', 'urgency score', 'priority matrix'],
  priority: ['migration priority', 'urgency', 'priority matrix', 'readiness'],

  // Timeline & country queries
  timeline: ['migration timeline', 'roadmap', 'deadline', 'phase', 'milestone'],
  roadmap: ['migration timeline', 'roadmap', 'phase', 'milestone', 'deadline'],
  deadline: ['deadline', 'migration timeline', 'deprecation', 'disallowed'],
  france: ['France', 'ANSSI', 'French PQC', 'Agence nationale'],
  anssi: ['ANSSI', 'France', 'Agence nationale', 'French PQC'],
  germany: ['Germany', 'BSI', 'German PQC', 'Bundesamt'],
  bsi: ['BSI', 'Germany', 'Bundesamt', 'German PQC'],
  'united states': ['United States', 'NIST', 'NSA', 'CNSA', 'CISA'],
  usa: ['United States', 'NIST', 'NSA', 'CNSA', 'CISA'],
  'united kingdom': ['United Kingdom', 'NCSC', 'UK PQC', 'British'],
  uk: ['United Kingdom', 'NCSC', 'UK PQC'],
  china: ['China', 'Chinese PQC', 'OSCCA'],
  japan: ['Japan', 'CRYPTREC', 'Japanese PQC'],
  australia: ['Australia', 'ASD', 'Australian PQC'],
  canada: ['Canada', 'CCCS', 'Canadian PQC'],
  'south korea': ['South Korea', 'Korean PQC', 'KISA'],
  korea: ['South Korea', 'Korean PQC', 'KISA'],
  india: ['India', 'Indian PQC'],
  singapore: ['Singapore', 'CSA', 'Singaporean PQC'],
  eu: ['European Union', 'ENISA', 'ETSI', 'EU PQC'],
  europe: ['European Union', 'ENISA', 'ETSI', 'EU PQC'],
  enisa: ['ENISA', 'European Union', 'EU PQC'],
  etsi: ['ETSI', 'European Union', 'EU PQC'],
  // Added countries from corpus
  spain: ['Spain', 'CCN', 'Spanish PQC'],
  ccn: ['CCN', 'Spain', 'Centro Criptológico'],
  israel: ['Israel', 'Israeli PQC', 'Bank of Israel'],
  italy: ['Italy', 'Italian PQC', 'ACN'],
  'czech republic': ['Czech Republic', 'Czech PQC', 'NUKIB'],
  czech: ['Czech Republic', 'Czech PQC', 'NUKIB'],
  'new zealand': ['New Zealand', 'GCSB', 'NZ PQC'],
  taiwan: ['Taiwan', 'Taiwanese PQC'],
  'hong kong': ['Hong Kong', 'HKMA', 'Hong Kong PQC'],
  malaysia: ['Malaysia', 'Malaysian PQC', 'CyberSecurity Malaysia'],
  uae: ['United Arab Emirates', 'UAE PQC'],
  'united arab emirates': ['United Arab Emirates', 'UAE PQC'],
  'saudi arabia': ['Saudi Arabia', 'Saudi PQC', 'NCA'],
  bahrain: ['Bahrain', 'Bahraini PQC'],
  jordan: ['Jordan', 'Jordanian PQC'],
  nato: ['NATO', 'North Atlantic Treaty Organization', 'NATO PQC'],
  g7: ['G7', 'Group of Seven'],
  sweden: ['Sweden', 'Swedish PQC'],
  // Adjectival country forms
  french: ['France', 'ANSSI', 'French PQC'],
  german: ['Germany', 'BSI', 'German PQC'],
  american: ['United States', 'NIST', 'NSA', 'CNSA', 'CISA'],
  british: ['United Kingdom', 'NCSC', 'UK PQC'],
  chinese: ['China', 'Chinese PQC', 'OSCCA'],
  japanese: ['Japan', 'CRYPTREC', 'Japanese PQC'],
  australian: ['Australia', 'ASD', 'Australian PQC'],
  canadian: ['Canada', 'CCCS', 'Canadian PQC'],
  korean: ['South Korea', 'Korean PQC', 'KISA'],
  indian: ['India', 'Indian PQC'],
  singaporean: ['Singapore', 'CSA', 'Singaporean PQC'],
  european: ['European Union', 'ENISA', 'ETSI', 'EU PQC'],
  spanish: ['Spain', 'CCN', 'Spanish PQC'],
  israeli: ['Israel', 'Israeli PQC', 'Bank of Israel'],
  italian: ['Italy', 'Italian PQC', 'ACN'],
  swedish: ['Sweden', 'Swedish PQC'],
}

/**
 * Classify user query intent via pattern matching.
 */
export function classifyIntent(query: string): QueryIntent {
  const q = query.toLowerCase()

  if (/^(what is|define|explain|what does|what are|tell me about)\b/.test(q)) return 'definition'
  if (/\b(compare|comparison|difference|vs\.?|versus|better)\b/.test(q)) return 'comparison'
  if (
    /\b(which|list|show|what)\b.*\b(products?|software|tools?|hsms?|libraries|vendors?|browsers?)\b/.test(
      q
    )
  )
    return 'catalog_lookup'
  if (/\b(what|show|list|which)\b.*\b(validated|certified|certifications?)\b/.test(q))
    return 'catalog_lookup'

  // Country detection — check before recommendation since country names are more specific
  const tokens = q.split(/\s+/)
  for (const token of tokens) {
    if (COUNTRY_KEYS.has(token)) return 'country_query'
  }
  for (const key of COUNTRY_KEYS) {
    if (key.includes(' ') && q.includes(key)) return 'country_query'
  }

  if (/\b(should|recommend|best|how to|how do i|how can i|migrate|strategy|plan)\b/.test(q))
    return 'recommendation'

  return 'general'
}

/**
 * Get the recommended chunk limit for a given intent.
 */
function getLimitForIntent(intent: QueryIntent): number {
  switch (intent) {
    case 'definition':
      return 10
    case 'comparison':
      return 15
    case 'catalog_lookup':
      return 20
    default:
      return 15
  }
}

class RetrievalService {
  private static instance: RetrievalService | null = null
  private index: MiniSearch<RAGChunk> | null = null
  private corpus: RAGChunk[] = []
  private corpusById = new Map<string, RAGChunk>()
  private initPromise: Promise<void> | null = null
  private generatedAt: string | null = null

  // Pre-built entity lookup: lowercased title → chunk IDs
  private entityIndex = new Map<string, string[]>()

  static getInstance(): RetrievalService {
    if (!RetrievalService.instance) {
      RetrievalService.instance = new RetrievalService()
    }
    return RetrievalService.instance
  }

  /** Reset singleton — for testing only */
  static resetInstance(): void {
    RetrievalService.instance = null
  }

  async initialize(): Promise<void> {
    if (this.index) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.load()
    return this.initPromise
  }

  /** Initialize with a pre-loaded corpus — for testing */
  initializeWithCorpus(corpus: RAGChunk[]): void {
    this.corpus = corpus
    this.buildIndex()
  }

  /** Timestamp when the corpus was generated (ISO string), or null for legacy format */
  get corpusDate(): string | null {
    return this.generatedAt
  }

  private async load(): Promise<void> {
    const response = await fetch('/data/rag-corpus.json')
    if (!response.ok) {
      throw new Error(`Failed to load RAG corpus: ${response.status}`)
    }

    const data = await response.json()

    // Support both legacy flat-array and new wrapper format
    if (Array.isArray(data)) {
      this.corpus = data
    } else {
      this.corpus = data.chunks ?? []
      this.generatedAt = data.generatedAt ?? null
    }

    this.buildIndex()
  }

  private buildIndex(): void {
    // Build fast lookup by ID
    this.corpusById.clear()
    this.entityIndex.clear()

    for (const chunk of this.corpus) {
      this.corpusById.set(chunk.id, chunk)
    }

    // Build entity index for direct title matching
    for (const chunk of this.corpus) {
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

      // Index metadata categoryName for migrate/software chunks
      if (chunk.metadata?.categoryName) {
        const catLower = chunk.metadata.categoryName.toLowerCase()
        const catExisting = this.entityIndex.get(catLower) ?? []
        catExisting.push(chunk.id)
        this.entityIndex.set(catLower, catExisting)
      }

      // Index metadata country and org for timeline/threats chunks
      if (chunk.metadata?.country) {
        const countryLower = chunk.metadata.country.toLowerCase()
        const cExisting = this.entityIndex.get(countryLower) ?? []
        cExisting.push(chunk.id)
        this.entityIndex.set(countryLower, cExisting)
      }
      if (chunk.metadata?.org) {
        const orgLower = chunk.metadata.org.toLowerCase()
        const oExisting = this.entityIndex.get(orgLower) ?? []
        oExisting.push(chunk.id)
        this.entityIndex.set(orgLower, oExisting)
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

  search(query: string, limit?: number, pageContext?: PageContext): RAGChunk[] {
    if (!this.index) return []

    const intent = classifyIntent(query)
    const effectiveLimit = limit ?? getLimitForIntent(intent)

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

    // For country_query intent, keep only country-specific expansions to prevent
    // generic terms (timeline→roadmap/deadline/phase) from diluting country results
    if (intent === 'country_query') {
      const countryTerms = new Set<string>()
      for (const token of queryTokens) {
        if (COUNTRY_KEYS.has(token)) {
          const expansions = QUERY_EXPANSIONS[token]
          if (expansions) for (const t of expansions) countryTerms.add(t)
        }
      }
      for (const key of Object.keys(QUERY_EXPANSIONS)) {
        if (key.includes(' ') && COUNTRY_KEYS.has(key) && queryLower.includes(key)) {
          for (const t of QUERY_EXPANSIONS[key]) countryTerms.add(t)
        }
      }
      expandedTerms.clear()
      for (const t of countryTerms) expandedTerms.add(t)
    }

    // Disambiguation: "library" without software context → also include reference docs
    if (
      queryLower.includes('library') &&
      !/\b(crypto|openssl|botan|software|product|migrate)\b/.test(queryLower)
    ) {
      expandedTerms.add('reference documents')
      expandedTerms.add('publications')
      expandedTerms.add('standards')
    }

    // Disambiguation: "module" with learning context → learning modules, not FIPS modules
    if (
      queryLower.includes('module') &&
      /\b(learn|course|tutorial|covers?|teach|lesson|study|training|quiz)\b/.test(queryLower)
    ) {
      // Remove FIPS-oriented expansions added by the 'module' key
      expandedTerms.delete('cryptographic module')
      expandedTerms.delete('FIPS 140-3')
      expandedTerms.delete('HSM')
      expandedTerms.delete('certification')
      // Add learning-oriented terms
      expandedTerms.add('learning module')
      expandedTerms.add('PQC 101')
      expandedTerms.add('workshop')
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

    // --- Phase 3: MiniSearch keyword search with intent-aware boosting ---
    // Incorporate conversation context (prior user messages) for multi-turn queries
    if (pageContext?.conversationContext?.length) {
      const stopWords = new Set([
        'what',
        'about',
        'with',
        'this',
        'that',
        'from',
        'have',
        'does',
        'tell',
        'show',
        'more',
        'also',
        'then',
        'them',
        'they',
        'their',
        'there',
        'these',
        'those',
        'been',
        'being',
        'would',
        'could',
      ])
      const contextTerms = pageContext.conversationContext
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 3 && !stopWords.has(t))
      const uniqueTerms = [...new Set(contextTerms)].slice(0, 5)
      for (const term of uniqueTerms) expandedTerms.add(term)
    }

    const expandedQuery =
      expandedTerms.size > 0 ? `${query} ${[...expandedTerms].join(' ')}` : query

    const rawResults = this.index.search(expandedQuery)

    // Apply intent-based and page-context source boost multipliers to scores
    const boosts = INTENT_BOOSTS[intent]
    const boostedResults = rawResults.map((r) => {
      const chunk = this.corpusById.get(r.id)
      if (!chunk) return { ...r, boostedScore: r.score }

      let multiplier = boosts[chunk.source] ?? 1
      // Page context boost: 1.5× for sources matching current page
      if (pageContext?.relevantSources.includes(chunk.source)) {
        multiplier *= 1.5
      }
      return { ...r, boostedScore: r.score * multiplier }
    })

    // Sort by boosted score
    boostedResults.sort((a, b) => b.boostedScore - a.boostedScore)

    // Source-diverse fill for remaining slots
    const sourceCounts = new Map<string, number>()
    for (const chunk of selected) {
      sourceCounts.set(chunk.source, (sourceCounts.get(chunk.source) ?? 0) + 1)
    }

    // Intent-aware diversity cap: catalog/country/comparison queries allow more from primary source
    const maxPerSource =
      intent === 'catalog_lookup' || intent === 'country_query' || intent === 'comparison'
        ? Math.ceil(effectiveLimit * 0.6)
        : Math.ceil(effectiveLimit / 3)

    for (const r of boostedResults) {
      if (selected.length >= effectiveLimit) break
      if (selectedIds.has(r.id)) continue

      const chunk = this.corpusById.get(r.id)
      if (!chunk) continue

      const count = sourceCounts.get(chunk.source) ?? 0
      if (count >= maxPerSource) continue

      addChunk(chunk.id)
      sourceCounts.set(chunk.source, count + 1)
    }

    // Backfill if diversity caps left gaps — use relaxed cap (1.5×) to avoid single-source dominance
    if (selected.length < effectiveLimit) {
      const relaxedMax = Math.ceil(maxPerSource * 1.5)
      for (const r of boostedResults) {
        if (selected.length >= effectiveLimit) break
        if (selectedIds.has(r.id)) continue
        const chunk = this.corpusById.get(r.id)
        if (!chunk) continue
        const count = sourceCounts.get(chunk.source) ?? 0
        if (count >= relaxedMax) continue
        addChunk(r.id)
        sourceCounts.set(chunk.source, count + 1)
      }
    }

    return selected
  }

  get isReady(): boolean {
    return this.index !== null
  }
}

export const retrievalService = RetrievalService.getInstance()
export { RetrievalService }
