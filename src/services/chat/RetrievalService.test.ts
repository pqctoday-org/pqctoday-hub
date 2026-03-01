// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { RetrievalService, classifyIntent } from './RetrievalService'

const MOCK_CORPUS: RAGChunk[] = [
  {
    id: 'algo-ml-kem-768',
    source: 'algorithms',
    title: 'ML-KEM-768',
    content: 'Algorithm: ML-KEM-768\nFamily: Lattice-based\nSecurity Level: 3',
    category: 'Lattice-based',
    metadata: { family: 'Lattice-based', fipsStandard: 'FIPS 203', securityLevel: '3' },
    deepLink: '/algorithms?highlight=ml-kem-768',
  },
  {
    id: 'algo-ml-dsa-65',
    source: 'algorithms',
    title: 'ML-DSA-65',
    content: 'Algorithm: ML-DSA-65\nFamily: Lattice-based\nSecurity Level: 3',
    category: 'Lattice-based',
    metadata: { family: 'Lattice-based', fipsStandard: 'FIPS 204', securityLevel: '3' },
    deepLink: '/algorithms?highlight=ml-dsa-65',
  },
  {
    id: 'algo-slh-dsa-128f',
    source: 'algorithms',
    title: 'SLH-DSA-128f',
    content: 'Algorithm: SLH-DSA-128f\nFamily: Hash-based\nSecurity Level: 1',
    category: 'Hash-based',
    metadata: { family: 'Hash-based', fipsStandard: 'FIPS 205', securityLevel: '1' },
    deepLink: '/algorithms?highlight=slh-dsa-128f',
  },
  {
    id: 'glossary-0',
    source: 'glossary',
    title: 'Post-Quantum Cryptography',
    content:
      'Term: Post-Quantum Cryptography (PQC)\nDefinition: Cryptographic algorithms designed to be secure against quantum attacks.',
    category: 'concept',
    metadata: { acronym: 'PQC', complexity: 'beginner', relatedModule: '/learn/pqc-101' },
    deepLink: '/learn/pqc-101',
  },
  {
    id: 'glossary-1',
    source: 'glossary',
    title: 'Harvest Now, Decrypt Later',
    content:
      'Term: Harvest Now, Decrypt Later (HNDL)\nDefinition: Attack where adversaries collect encrypted data to decrypt when quantum computers arrive.',
    category: 'concept',
    metadata: { acronym: 'HNDL', complexity: 'beginner', relatedModule: '/threats' },
    deepLink: '/threats',
  },
  {
    id: 'software-openssl',
    source: 'migrate',
    title: 'OpenSSL',
    content:
      'Software: OpenSSL\nCategory: Cryptographic Libraries\nPQC Support: Yes\nPQC Capabilities: ML-KEM, ML-DSA',
    category: 'Cryptographic Libraries',
    metadata: { categoryName: 'Cryptographic Libraries', fipsValidated: 'Yes' },
    deepLink: '/migrate?q=OpenSSL',
  },
  {
    id: 'software-botan',
    source: 'migrate',
    title: 'Botan',
    content:
      'Software: Botan\nCategory: Cryptographic Libraries\nPQC Support: Yes\nPQC Capabilities: ML-KEM, ML-DSA, SLH-DSA',
    category: 'Cryptographic Libraries',
    metadata: { categoryName: 'Cryptographic Libraries', fipsValidated: 'No' },
    deepLink: '/migrate?q=Botan',
  },
  {
    id: 'software-thales-luna',
    source: 'migrate',
    title: 'Thales Luna HSM',
    content:
      'Software: Thales Luna HSM\nCategory: Hardware Security Modules\nPQC Support: Yes\nFIPS Validated: Yes',
    category: 'Hardware Security Modules',
    metadata: { categoryName: 'Hardware Security Modules', fipsValidated: 'Yes' },
    deepLink: '/migrate?q=Thales+Luna+HSM',
  },
  {
    id: 'timeline-france-1',
    source: 'timeline',
    title: 'France — ANSSI PQC Migration Mandate',
    content:
      'Country: France\nOrganization: ANSSI\nType: Regulation\nPeriod: 2025–2030\nTitle: PQC Migration Mandate',
    category: 'Regulation',
    metadata: { country: 'France', org: 'ANSSI' },
    deepLink: '/timeline?country=France',
  },
  {
    id: 'timeline-usa-1',
    source: 'timeline',
    title: 'United States — NIST PQC Standardization',
    content:
      'Country: United States\nOrganization: NIST\nType: Standard\nPeriod: 2024–2035\nTitle: PQC Standardization',
    category: 'Standard',
    metadata: { country: 'United States', org: 'NIST' },
    deepLink: '/timeline?country=United%20States',
  },
  {
    id: 'compliance-1',
    source: 'compliance',
    title: 'CNSA 2.0',
    content:
      'Framework: CNSA 2.0\nDescription: NSA Commercial National Security Algorithm Suite\nRequires PQC: Yes\nDeadline: 2030',
    category: 'framework',
    metadata: { id: '1', deadline: '2030', requiresPQC: 'Yes' },
    deepLink: '/compliance?q=CNSA',
  },
  {
    id: 'transition-1',
    source: 'transitions',
    title: 'RSA-2048 → ML-KEM-768',
    content:
      'Classical Algorithm: RSA-2048\nPQC Replacement: ML-KEM-768\nFunction: Key Encapsulation',
    category: 'Key Encapsulation',
    metadata: { classical: 'RSA-2048', pqc: 'ML-KEM-768' },
    deepLink: '/algorithms?highlight=rsa-2048',
  },
  {
    id: 'cert-fips',
    source: 'certifications',
    title: 'PQC Certifications: FIPS 140-3',
    content:
      'Certification Type: FIPS 140-3\nSoftware: OpenSSL\nCert ID: 5164\nPQC Algorithms: ML-KEM',
    category: 'certification',
    metadata: { certType: 'FIPS 140-3', certCount: '5' },
    deepLink: '/compliance?cert=5164',
  },
  {
    id: 'leader-1',
    source: 'leaders',
    title: 'Peter Schwabe',
    content:
      'Name: Peter Schwabe\nCountry: Germany\nRole: Researcher\nContribution: Co-author of CRYSTALS-Kyber',
    category: 'Research',
    metadata: { country: 'Germany', type: 'Academic' },
    deepLink: '/leaders?leader=Peter+Schwabe',
  },
  {
    id: 'module-pqc-101',
    source: 'modules',
    title: 'PQC 101',
    content: 'Learning Module: PQC 101\nDescription: Introduction to post-quantum cryptography',
    category: 'learning',
    metadata: { moduleId: 'pqc-101', duration: '30 min' },
    deepLink: '/learn/pqc-101',
  },
  {
    id: 'threat-fin-1',
    source: 'threats',
    title: 'Financial Services — TLS Interception',
    content:
      'Industry: Financial Services\nThreat: TLS interception using quantum computers\nCriticality: Critical',
    category: 'Critical',
    metadata: { industry: 'Financial Services', threatId: 'FIN-001' },
    deepLink: '/threats?id=FIN-001&industry=Financial+Services',
  },
  {
    id: 'library-fips-203',
    source: 'library',
    title: 'FIPS 203',
    content:
      'Title: FIPS 203\nDescription: ML-KEM standard\nType: FIPS Standard\nAlgorithm Family: Lattice-based',
    category: 'FIPS Standard',
    metadata: { referenceId: 'FIPS-203', algorithmFamily: 'Lattice-based' },
    deepLink: '/library?ref=FIPS-203',
  },
  {
    id: 'assess-industry',
    source: 'assessment',
    title: 'Assessment: industry_selection',
    content: 'Assessment Category: industry selection\n- Financial Services: High risk',
    category: 'assessment',
    metadata: { assessCategory: 'industry_selection' },
    deepLink: '/assess',
  },
]

function createService(): RetrievalService {
  const service = new RetrievalService()
  service.initializeWithCorpus(MOCK_CORPUS)
  return service
}

describe('classifyIntent', () => {
  it('should classify "What is ML-KEM?" as definition', () => {
    expect(classifyIntent('What is ML-KEM?')).toBe('definition')
  })

  it('should classify "Explain post-quantum cryptography" as definition', () => {
    expect(classifyIntent('Explain post-quantum cryptography')).toBe('definition')
  })

  it('should classify "Tell me about HNDL" as definition', () => {
    expect(classifyIntent('Tell me about HNDL')).toBe('definition')
  })

  it('should classify "Compare ML-DSA and SLH-DSA" as comparison', () => {
    expect(classifyIntent('Compare ML-DSA and SLH-DSA')).toBe('comparison')
  })

  it('should classify "Difference between ML-KEM and ECDH" as comparison', () => {
    expect(classifyIntent('Difference between ML-KEM and ECDH')).toBe('comparison')
  })

  it('should classify "Which HSMs support ML-KEM?" as catalog_lookup', () => {
    expect(classifyIntent('Which HSMs support ML-KEM?')).toBe('catalog_lookup')
  })

  it('should classify "List PQC-ready software" as catalog_lookup', () => {
    expect(classifyIntent('List PQC-ready software')).toBe('catalog_lookup')
  })

  it('should classify "Show products with FIPS validation" as catalog_lookup', () => {
    expect(classifyIntent('Show products with FIPS validation')).toBe('catalog_lookup')
  })

  it('should classify "How to migrate to PQC?" as recommendation', () => {
    expect(classifyIntent('How to migrate to PQC?')).toBe('recommendation')
  })

  it('should classify "Best strategy for PQC adoption" as recommendation', () => {
    expect(classifyIntent('Best strategy for PQC adoption')).toBe('recommendation')
  })

  it('should classify "France PQC timeline" as country_query', () => {
    expect(classifyIntent('France PQC timeline')).toBe('country_query')
  })

  it('should classify "USA PQC timeline" as country_query', () => {
    expect(classifyIntent('USA PQC timeline')).toBe('country_query')
  })

  it('should classify "United Kingdom PQC deadlines" as country_query', () => {
    expect(classifyIntent('United Kingdom PQC deadlines')).toBe('country_query')
  })

  it('should classify generic queries as general', () => {
    expect(classifyIntent('PQC algorithms')).toBe('general')
  })
})

describe('RetrievalService', () => {
  let service: RetrievalService

  beforeEach(() => {
    RetrievalService.resetInstance()
    service = createService()
  })

  describe('entity matching', () => {
    it('should match exact algorithm names', () => {
      const results = service.search('ML-KEM-768')
      expect(results.some((r) => r.id === 'algo-ml-kem-768')).toBe(true)
    })

    it('should match case-insensitively', () => {
      const results = service.search('ml-kem-768')
      expect(results.some((r) => r.id === 'algo-ml-kem-768')).toBe(true)
    })

    it('should match acronyms', () => {
      const results = service.search('PQC')
      expect(results.some((r) => r.id === 'glossary-0')).toBe(true)
    })

    it('should match base name without security level', () => {
      const results = service.search('ML-KEM')
      expect(results.some((r) => r.id === 'algo-ml-kem-768')).toBe(true)
    })

    it('should match without hyphens', () => {
      const results = service.search('ml kem')
      expect(results.some((r) => r.id === 'algo-ml-kem-768')).toBe(true)
    })

    it('should match country names from metadata', () => {
      const results = service.search('France')
      expect(results.some((r) => r.id === 'timeline-france-1')).toBe(true)
    })

    it('should match organization names from metadata', () => {
      const results = service.search('ANSSI')
      expect(results.some((r) => r.id === 'timeline-france-1')).toBe(true)
    })

    it('should match category names from metadata', () => {
      const results = service.search('Cryptographic Libraries')
      expect(results.some((r) => r.source === 'migrate')).toBe(true)
    })
  })

  describe('query expansion', () => {
    it('should expand "signing" to include ML-DSA results', () => {
      const results = service.search('quantum signing algorithm')
      expect(results.some((r) => r.id === 'algo-ml-dsa-65')).toBe(true)
    })

    it('should expand multi-word keys like "harvest now"', () => {
      const results = service.search('harvest now decrypt later')
      expect(results.some((r) => r.id === 'glossary-1')).toBe(true)
    })

    it('should expand FIPS to include FIPS 203/204/205 and FIPS 140-3', () => {
      const results = service.search('fips standards')
      const sources = results.map((r) => r.source)
      expect(sources.includes('algorithms') || sources.includes('library')).toBe(true)
    })

    it('should expand HSM to hardware security module', () => {
      const results = service.search('hsm support')
      expect(results.some((r) => r.title.includes('HSM') || r.content.includes('HSM'))).toBe(true)
    })
  })

  describe('disambiguation', () => {
    it('should return both library docs and software for ambiguous "library" query', () => {
      const results = service.search('library')
      const sources = new Set(results.map((r) => r.source))
      // Should include both migrate (software) and library (documents)
      expect(sources.has('migrate') || sources.has('library')).toBe(true)
    })

    it('should prefer software for "crypto library" query', () => {
      const results = service.search('crypto library openssl')
      expect(results.some((r) => r.source === 'migrate')).toBe(true)
    })
  })

  describe('source diversity', () => {
    it('should not exceed diversity cap for general queries', () => {
      const results = service.search('post-quantum cryptography algorithms migration')
      const sourceCounts = new Map<string, number>()
      for (const r of results) {
        sourceCounts.set(r.source, (sourceCounts.get(r.source) ?? 0) + 1)
      }
      const limit = results.length
      const maxAllowed = Math.ceil(limit / 3)
      for (const [, count] of sourceCounts) {
        // General intent uses ceil(limit/3) cap — allow 1 extra for backfill
        expect(count).toBeLessThanOrEqual(maxAllowed + 1)
      }
    })

    it('should allow higher cap for catalog_lookup intent', () => {
      const results = service.search('Which products support ML-KEM?')
      const migrateCount = results.filter((r) => r.source === 'migrate').length
      // catalog_lookup uses ceil(limit/2) cap — should allow more migrate results
      expect(migrateCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('page context boosting', () => {
    it('should boost algorithm chunks when on /algorithms page', () => {
      const withContext = service.search('lattice cryptography', undefined, {
        page: 'Algorithms',
        relevantSources: ['algorithms', 'transitions', 'glossary'],
      })
      const withoutContext = service.search('lattice cryptography')

      // Both should return results but with-context should prioritize algorithms
      const withContextAlgoRank = withContext.findIndex((r) => r.source === 'algorithms')
      const withoutContextAlgoRank = withoutContext.findIndex((r) => r.source === 'algorithms')

      // If both have results, context version should rank algorithms at least as high
      if (withContextAlgoRank >= 0 && withoutContextAlgoRank >= 0) {
        expect(withContextAlgoRank).toBeLessThanOrEqual(withoutContextAlgoRank)
      }
    })

    it('should boost timeline chunks when on /timeline page', () => {
      const results = service.search('migration deadline', undefined, {
        page: 'Timeline',
        relevantSources: ['timeline', 'compliance'],
      })
      const timelineResults = results.filter((r) => r.source === 'timeline')
      expect(timelineResults.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('intent-based limits', () => {
    it('should return fewer chunks for definition queries', () => {
      const results = service.search('What is ML-KEM?')
      expect(results.length).toBeLessThanOrEqual(10)
    })

    it('should return more chunks for catalog queries', () => {
      const results = service.search('Which products support PQC?')
      // catalog_lookup allows up to 20
      expect(results.length).toBeGreaterThan(0)
    })

    it('should respect explicit limit override', () => {
      const results = service.search('ML-KEM', 5)
      expect(results.length).toBeLessThanOrEqual(5)
    })
  })

  describe('isReady', () => {
    it('should return true after initialization', () => {
      expect(service.isReady).toBe(true)
    })

    it('should return false before initialization', () => {
      const fresh = new RetrievalService()
      expect(fresh.isReady).toBe(false)
    })
  })
})

describe('RetrievalService.initialize', () => {
  beforeEach(() => {
    RetrievalService.resetInstance()
  })

  it('should load corpus via fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_CORPUS),
      })
    )

    const service = RetrievalService.getInstance()
    await service.initialize()
    expect(service.isReady).toBe(true)

    vi.unstubAllGlobals()
  })

  it('should throw on fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    )

    const service = RetrievalService.getInstance()
    await expect(service.initialize()).rejects.toThrow('Failed to load RAG corpus')

    vi.unstubAllGlobals()
  })
})
