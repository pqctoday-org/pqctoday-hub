// SPDX-License-Identifier: GPL-3.0-only
import type MiniSearch from 'minisearch'
import type { RAGChunk } from '@/types/ChatTypes'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'

/**
 * Query intent — determines source boosting and diversity strategy.
 */
export type QueryIntent =
  | 'definition'
  | 'comparison'
  | 'catalog_lookup'
  | 'recommendation'
  | 'country_query'
  | 'standard_query'
  | 'whats_new'
  | 'general'

/**
 * Optional page context for boosting results relevant to the user's current view.
 */
export interface PageContext {
  page: string
  moduleId?: string
  relevantSources: string[]
  conversationContext?: string[]
  persona?: string | null
  industry?: string | null
  region?: string | null
  experienceLevel?: string | null
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
  catalog_lookup: {
    migrate: 3,
    certifications: 2,
    'priority-matrix': 1.5,
    'business-center': 1.5,
    vendors: 2,
  },
  recommendation: {
    assessment: 2,
    'priority-matrix': 2,
    compliance: 1.5,
    migrate: 1.5,
    documentation: 1.5,
    'document-enrichment': 1.3,
    'business-center': 1.5,
    'governance-maturity': 2,
    cswp39: 1.5,
    vendors: 1.5,
  },
  country_query: {
    timeline: 3,
    compliance: 2,
    leaders: 1.5,
    library: 1.2,
    'document-enrichment': 1.5,
  },
  standard_query: {
    library: 3,
    'document-enrichment': 2,
    compliance: 1.5,
    glossary: 1.2,
    'authoritative-sources': 1.5,
    'trusted-sources': 2,
    patents: 1.3,
  },
  whats_new: { changelog: 10, 'app-guide': 1.5 },
  general: {
    leaders: 1.5,
    threats: 1.5,
    'module-qa': 1.3,
    'module-summaries': 1.1,
    patents: 1.2,
    cswp39: 1.2,
    'governance-maturity': 1.1,
    'trusted-sources': 1.1,
    quiz: 1.1,
    tracks: 1.1,
    personas: 1.1,
    achievements: 1.1,
    'playground-guide': 1.1,
    'openssl-guide': 1.1,
    'user-manual': 1.1,
    'right-panel': 1.1,
    'guided-tour': 1.1,
  },
}

/**
 * Persona-specific source boosts — applied on top of intent + page context boosts.
 */
const PERSONA_BOOSTS: Record<string, Record<string, number>> = {
  developer: {
    'module-content': 1.5,
    modules: 1.3,
    algorithms: 1.2,
    migrate: 1.2,
    'module-qa': 1.3,
    patents: 1.2,
  },
  executive: {
    assessment: 1.5,
    threats: 1.4,
    compliance: 1.3,
    timeline: 1.3,
    'priority-matrix': 1.3,
    'business-center': 2,
    leaders: 1.3,
    'governance-maturity': 1.5,
    cswp39: 1.4,
    vendors: 1.3,
  },
  architect: {
    'module-content': 1.3,
    algorithms: 1.3,
    migrate: 1.3,
    transitions: 1.2,
    'business-center': 1.5,
    'governance-maturity': 1.3,
    patents: 1.2,
  },
  researcher: {
    library: 1.5,
    'document-enrichment': 1.4,
    algorithms: 1.3,
    'authoritative-sources': 1.3,
    glossary: 1.4,
    'trusted-sources': 1.5,
    patents: 1.5,
    'module-qa': 1.2,
  },
  ops: {
    migrate: 1.5,
    certifications: 1.3,
    'module-content': 1.2,
    compliance: 1.2,
    vendors: 1.5,
    'governance-maturity': 1.2,
  },
  curious: {
    glossary: 1.3,
    'module-curious': 1.5,
  },
}

/**
 * Industry keyword map — maps persona industry names to lowercase keywords
 * found in threat/compliance chunk metadata.industry fields.
 */
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Finance & Banking': ['financial', 'banking', 'insurance', 'payment', 'cryptocurrency'],
  'Government & Defense': ['government', 'defense', 'legal', 'notary'],
  Healthcare: ['healthcare', 'pharmaceutical'],
  Telecommunications: ['telecommunications', 'telecom'],
  Technology: ['software', 'cloud', 'iot', 'media', 'supply chain'],
  'Energy & Utilities': ['energy', 'critical infrastructure', 'water'],
  Automotive: ['automotive', 'connected vehicles', 'rail', 'transit'],
  Aerospace: ['aerospace', 'aviation'],
  'Retail & E-Commerce': ['retail', 'e-commerce'],
}

/**
 * Region keyword map — maps persona regions to lowercase country name keywords
 * found in timeline/compliance chunk metadata.country fields.
 */
const REGION_KEYWORDS: Record<string, string[]> = {
  americas: ['united states', 'usa', 'canada'],
  eu: ['france', 'germany', 'european', 'uk', 'united kingdom', 'italy', 'spain', 'czech'],
  apac: ['japan', 'singapore', 'australia', 'south korea', 'china', 'india', 'taiwan'],
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

  // Data asset sensitivity
  'data asset': [
    'data-asset-sensitivity',
    'classification',
    'sensitivity',
    'GDPR',
    'HIPAA',
    'DORA',
    'NIS2',
  ],
  sensitivity: [
    'data-asset-sensitivity',
    'classification',
    'data retention',
    'compliance',
    'sensitivity scoring',
  ],
  classification: [
    'data-asset-sensitivity',
    'asset inventory',
    'sensitivity scoring',
    'risk methodology',
  ],
  'asset inventory': ['data-asset-sensitivity', 'classification', 'data asset', 'CBOM'],
  'data retention': ['data-asset-sensitivity', 'data retention', 'compliance', 'GDPR'],

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

  // Command Center (formerly "Business Center") / GRC tools.
  // We accept both phrases as queries so existing bookmarks and search history
  // keep working; entries use "command center" as the canonical synonym.
  business: ['command center', 'GRC', 'governance', 'ROI', 'business case'],
  'business center': [
    'command center',
    'GRC',
    'ROI calculator',
    'board pitch',
    'RACI',
    'policy template',
  ],
  'command center': [
    'GRC',
    'ROI calculator',
    'board pitch',
    'RACI',
    'policy template',
    'executive dashboard',
  ],
  command: ['command center', 'GRC', 'governance', 'ROI'],
  roi: ['ROI calculator', 'business case', 'cost analysis', 'command center'],
  grc: ['governance', 'risk', 'compliance', 'command center', 'audit'],
  governance: ['RACI', 'policy', 'KPI', 'governance', 'command center'],
  'board pitch': ['board pitch', 'executive briefing', 'business case', 'command center'],
  'vendor scorecard': ['vendor scorecard', 'vendor risk', 'supply chain', 'command center'],
  raci: ['RACI', 'roles', 'responsibility', 'governance', 'command center'],
  'policy template': ['policy template', 'cryptographic policy', 'governance', 'command center'],
  'contract clause': ['contract clause', 'vendor risk', 'supply chain', 'command center'],
  kpi: ['KPI', 'dashboard', 'metrics', 'command center'],
  'roadmap builder': ['roadmap builder', 'migration roadmap', 'command center'],
  'deployment playbook': ['deployment playbook', 'migration', 'rollout', 'command center'],
  playbook: ['deployment playbook', 'migration', 'rollout', 'command center'],
  stakeholder: ['stakeholder communication', 'board pitch', 'command center'],
  'audit readiness': ['audit readiness', 'compliance', 'checklist', 'command center'],

  // Site authorship / identity queries
  author: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  authors: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  maintain: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  maintains: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  maintainer: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  maintaining: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  creator: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  built: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  created: ['Eric Amador', 'pqctoday', 'creator', 'maintainer'],
  pqctoday: ['Eric Amador', 'pqctoday', 'creator', 'maintainer', 'softhsmv3'],
  'eric amador': ['Eric Amador', 'pqctoday', 'creator', 'maintainer', 'softhsmv3'],
  softhsmv3: ['Eric Amador', 'softhsmv3', 'pqctoday', 'creator'],
}

/**
 * Classify user query intent via pattern matching.
 */
export function classifyIntent(query: string): QueryIntent {
  const q = query.toLowerCase()

  // What's new / changelog queries — check early before "what" triggers definition
  if (
    /\b(what'?s new|what changed|latest updates?|recent changes?|new features?|what was added|release notes?|latest version)\b/.test(
      q
    )
  )
    return 'whats_new'

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

  // Standard identifier detection — before country detection because
  // "bsi" and "etsi" are in COUNTRY_KEYS and would hijack e.g. "BSI TR-02102"
  if (
    /\b(nist\s+(ir|sp|fips|cswp)\s+\d+|fips[-\s]*\d+|rfc\s+\d+|iso[\s/]iec\s+\d+|etsi\s+(ts|tr)\s+\d+|bsi\s+tr[-\s]*\d+|sp\s+800[-\s]*\d+|cnsa\s+2\.0)\b/i.test(
      q
    )
  )
    return 'standard_query'

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
    case 'standard_query':
      return 12
    case 'whats_new':
      return 10
    default:
      return 15
  }
}

class RetrievalService {
  private static instance: RetrievalService | null = null

  static getInstance(): RetrievalService {
    if (!RetrievalService.instance) {
      RetrievalService.instance = new RetrievalService()
    }
    return RetrievalService.instance
  }

  /** Reset singleton — for testing only. Also resets the underlying
   *  UnifiedSearchService so per-test fetch stubs / corpus injections
   *  start from a clean slate. */
  static resetInstance(): void {
    RetrievalService.instance = null
    UnifiedSearchService.resetInstance()
  }

  /**
   * Index, corpus, and entityIndex are owned by UnifiedSearchService so ⌘K
   * and the Assistant share one MiniSearch instance and one entityIndex.
   */
  private get index(): MiniSearch<RAGChunk> | null {
    return UnifiedSearchService.getInstance().index
  }

  private get corpus(): ReadonlyArray<RAGChunk> {
    return UnifiedSearchService.getInstance().corpus
  }

  private get corpusById(): ReadonlyMap<string, RAGChunk> {
    return UnifiedSearchService.getInstance().corpusById
  }

  private get entityIndex(): ReadonlyMap<string, string[]> {
    return UnifiedSearchService.getInstance().entityIndex
  }

  async initialize(): Promise<void> {
    return UnifiedSearchService.getInstance().initialize()
  }

  /** Initialize with a pre-loaded corpus — for testing */
  initializeWithCorpus(corpus: RAGChunk[]): void {
    UnifiedSearchService.getInstance().initializeWithCorpus(corpus)
  }

  /** Timestamp when the corpus was generated (ISO string), or null for legacy format */
  get corpusDate(): string | null {
    return UnifiedSearchService.getInstance().corpusDate
  }

  search(query: string, limit?: number, pageContext?: PageContext): RAGChunk[] {
    if (!this.index) return []

    const intent = classifyIntent(query)
    const effectiveLimit = limit ?? getLimitForIntent(intent)

    const selectedIds = new Set<string>()
    const selected: RAGChunk[] = []
    const quizExplicit = /\b(quiz|quizzes|test me|practice questions?|flashcards?)\b/i.test(query)

    const isCurious = pageContext?.experienceLevel === 'curious'

    const addChunk = (id: string): boolean => {
      if (selectedIds.has(id)) return false
      const chunk = this.corpusById.get(id)
      if (!chunk) return false
      // Suppress quiz chunks unless the user explicitly asked for a quiz
      if (chunk.source === 'quiz' && !quizExplicit) return false
      // Curious summaries are only served in curious mode; excluded otherwise
      if (chunk.source === 'module-curious' && !isCurious) return false
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

    // Cap per-source contribution in Phase 1 so a single source (e.g. multiple
    // governance-maturity rows that share a refId with a library entry) cannot
    // monopolise the four entity slots at the expense of complementary sources.
    const phase1SourceCounts = new Map<string, number>()
    const PHASE1_MAX_PER_SOURCE = 2
    for (const gram of nGrams) {
      if (selected.length >= 4) break
      const entityIds = this.entityIndex.get(gram)
      if (entityIds) {
        for (const id of entityIds) {
          if (selected.length >= 4) break
          const chunk = this.corpusById.get(id)
          if (!chunk) continue
          const count = phase1SourceCounts.get(chunk.source) ?? 0
          if (count >= PHASE1_MAX_PER_SOURCE) continue
          if (addChunk(id)) phase1SourceCounts.set(chunk.source, count + 1)
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
      // Static priority from corpus (default 1.0)
      multiplier *= chunk.priority ?? 1.0
      // Persona boost
      if (pageContext?.persona) {
        const pBoost = PERSONA_BOOSTS[pageContext.persona]
        if (pBoost?.[chunk.source]) {
          multiplier *= pBoost[chunk.source]
        }
      }
      // Industry boost — boost threats/compliance chunks matching user's industry
      if (pageContext?.industry) {
        const keywords = INDUSTRY_KEYWORDS[pageContext.industry]
        if (keywords && chunk.metadata?.industry) {
          const chunkInd = (chunk.metadata.industry as string).toLowerCase()
          if (keywords.some((kw) => chunkInd.includes(kw))) {
            multiplier *= 1.4
          }
        }
      }
      // Region boost — boost timeline/compliance chunks matching user's region
      if (pageContext?.region && pageContext.region !== 'global' && chunk.metadata?.country) {
        const regionCountries = REGION_KEYWORDS[pageContext.region]
        if (regionCountries) {
          const chunkCountry = (chunk.metadata.country as string).toLowerCase()
          if (regionCountries.some((c) => chunkCountry.includes(c))) {
            multiplier *= 1.3
          }
        }
      }
      // Curious mode: prefer plain-language summaries, demote technical module content
      if (isCurious) {
        if (chunk.source === 'module-curious') multiplier *= 1.5
        else if (chunk.source === 'module-content') multiplier *= 0.6
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

    // Library guarantee: ensure library-sourced chunks are always included when
    // they scored in boostedResults but were crowded out by diversity caps.
    // This guarantees /library?ref= deep links appear for referenced documents.
    const hasLibrary = selected.some(
      (c) =>
        c.source === 'library' ||
        (c.source === 'document-enrichment' && c.metadata?.collection === 'library')
    )
    if (!hasLibrary) {
      for (const r of boostedResults) {
        if (selectedIds.has(r.id)) continue
        const chunk = this.corpusById.get(r.id)
        if (!chunk) continue
        if (
          chunk.source === 'library' ||
          (chunk.source === 'document-enrichment' && chunk.metadata?.collection === 'library')
        ) {
          // Replace last selected chunk to keep within limit
          if (selected.length >= effectiveLimit) {
            const removed = selected.pop()!
            selectedIds.delete(removed.id)
          }
          addChunk(r.id)
          break
        }
      }
    }

    // Timeline guarantee for country_query: surface at least one timeline event
    // in the top 5 so country-scoped queries land on the timeline page even when
    // a referenced document (library / gov-maturity / doc-enrichment) wins the
    // entityIndex race in Phase 1.
    if (intent === 'country_query') {
      const top5 = selected.slice(0, 5)
      const hasTimelineTop5 = top5.some((c) => c.source === 'timeline')
      if (!hasTimelineTop5) {
        const timelineCandidate = boostedResults.find((r) => {
          if (selectedIds.has(r.id)) {
            const chunk = this.corpusById.get(r.id)
            return chunk?.source === 'timeline'
          }
          const chunk = this.corpusById.get(r.id)
          return chunk?.source === 'timeline'
        })
        if (timelineCandidate) {
          const chunk = this.corpusById.get(timelineCandidate.id)
          if (chunk) {
            // Move into rank 5: drop existing rank-5 entry from selection, splice in
            const existingIdx = selected.findIndex((c) => c.id === chunk.id)
            if (existingIdx >= 5) {
              selected.splice(existingIdx, 1)
              selected.splice(4, 0, chunk)
            } else if (existingIdx === -1) {
              if (selected.length >= 5) {
                const removed = selected.splice(4, 1)[0]
                selectedIds.delete(removed.id)
              }
              selected.splice(4, 0, chunk)
              selectedIds.add(chunk.id)
            }
          }
        }
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
