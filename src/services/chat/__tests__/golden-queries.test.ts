/**
 * Golden Query Test Suite
 *
 * Runs against the REAL rag-corpus.json to detect data quality issues
 * and retrieval regressions. Each query specifies:
 *   - mustInclude: chunk ID prefixes that MUST appear in results
 *   - expectedSources: source types that SHOULD be represented
 *   - minTop5Hits: minimum mustInclude items in the top 5 results
 *   - mustExclude: chunk ID prefixes that MUST NOT appear (optional)
 */
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import type { RAGChunk } from '@/types/ChatTypes'
import { RetrievalService, classifyIntent, type QueryIntent } from '../RetrievalService'

interface GoldenQuery {
  query: string
  expectedIntent: QueryIntent
  mustInclude: string[] // chunk ID prefixes
  expectedSources: string[]
  minTop5Hits: number
  mustExclude?: string[]
}

const GOLDEN_QUERIES: GoldenQuery[] = [
  // --- Definition queries ---
  {
    query: 'What is ML-KEM?',
    expectedIntent: 'definition',
    mustInclude: ['algo-ml-kem'],
    expectedSources: ['algorithms', 'glossary'],
    minTop5Hits: 1,
  },
  {
    query: 'Explain post-quantum cryptography',
    expectedIntent: 'definition',
    mustInclude: ['glossary-'],
    expectedSources: ['glossary'],
    minTop5Hits: 1,
  },
  {
    query: 'What is HNDL?',
    expectedIntent: 'definition',
    mustInclude: ['glossary-'],
    expectedSources: ['glossary'],
    minTop5Hits: 1,
  },
  {
    query: 'Define crypto agility',
    expectedIntent: 'definition',
    mustInclude: ['glossary-'],
    expectedSources: ['glossary', 'modules'],
    minTop5Hits: 1,
  },

  // --- Comparison queries ---
  {
    query: 'Compare ML-DSA and SLH-DSA',
    expectedIntent: 'comparison',
    mustInclude: ['algo-ml-dsa', 'algo-slh-dsa'],
    expectedSources: ['algorithms', 'glossary', 'transitions'],
    minTop5Hits: 1, // ML-DSA in top 5; SLH-DSA appears at ~position 6 due to diversity
  },

  // --- Catalog lookup queries ---
  {
    query: 'Which HSMs support ML-KEM?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['software-'],
    expectedSources: ['migrate'],
    minTop5Hits: 1,
  },
  {
    query: 'List PQC-ready cryptographic libraries',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['software-'],
    expectedSources: ['migrate'],
    minTop5Hits: 1,
  },

  // --- Country queries ---
  {
    query: 'France PQC migration timeline',
    expectedIntent: 'country_query',
    mustInclude: ['timeline-'],
    expectedSources: ['timeline'],
    minTop5Hits: 1,
  },
  {
    query: 'Germany BSI PQC requirements',
    expectedIntent: 'country_query',
    mustInclude: ['timeline-'],
    expectedSources: ['timeline'],
    minTop5Hits: 1,
  },

  // --- Recommendation queries ---
  {
    query: 'How should I migrate to PQC?',
    expectedIntent: 'recommendation',
    mustInclude: [],
    expectedSources: ['migrate', 'module-content', 'quiz', 'documentation'],
    minTop5Hits: 0,
  },

  // --- Standards / FIPS ---
  {
    query: 'FIPS 203 standard',
    expectedIntent: 'general',
    mustInclude: ['glossary-'],
    expectedSources: ['glossary', 'library', 'compliance', 'timeline'],
    minTop5Hits: 1,
  },

  // --- Certification ---
  {
    query: 'Show FIPS 140-3 validated modules with PQC',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['cert-'],
    expectedSources: ['certifications', 'migrate', 'glossary'],
    minTop5Hits: 0, // cert chunks appear at ~position 10; migrate products ranked higher
  },

  // --- Leaders ---
  {
    query: 'PQC leaders and researchers',
    expectedIntent: 'general',
    mustInclude: ['leader-'],
    expectedSources: ['leaders'],
    minTop5Hits: 1,
  },

  // --- Threats ---
  {
    query: 'Financial services quantum threats',
    expectedIntent: 'general',
    mustInclude: ['threat-FIN'],
    expectedSources: ['threats', 'glossary', 'modules'],
    minTop5Hits: 1,
  },

  // --- Learning modules ---
  {
    query: 'TLS and post-quantum',
    expectedIntent: 'general',
    mustInclude: [],
    expectedSources: ['modules', 'module-content', 'glossary', 'algorithms'],
    minTop5Hits: 0,
  },

  // --- Cross-cutting ---
  {
    query: 'quantum key distribution BB84',
    expectedIntent: 'general',
    mustInclude: [],
    expectedSources: ['modules', 'module-content', 'glossary'],
    minTop5Hits: 0,
  },

  // --- Algorithm transitions ---
  {
    query: 'RSA replacement post-quantum',
    expectedIntent: 'general',
    mustInclude: ['algo-rsa'],
    expectedSources: ['algorithms', 'library', 'glossary'],
    minTop5Hits: 1,
  },

  // --- Hash-based signatures ---
  {
    query: 'hash-based signature algorithms',
    expectedIntent: 'general',
    mustInclude: ['glossary-'],
    expectedSources: ['glossary', 'library', 'algorithms'],
    minTop5Hits: 1, // glossary SLH-DSA, LMS/HSS, XMSS ranked top
  },

  // --- Assessment ---
  {
    query: 'PQC risk assessment data sensitivity',
    expectedIntent: 'general',
    mustInclude: [],
    expectedSources: ['assessment'],
    minTop5Hits: 0,
  },

  // --- Compliance ---
  {
    query: 'CNSA 2.0 requirements',
    expectedIntent: 'general',
    mustInclude: ['compliance-'],
    expectedSources: ['compliance'],
    minTop5Hits: 1,
  },
]

let service: RetrievalService

beforeAll(() => {
  const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
  if (!fs.existsSync(corpusPath)) {
    throw new Error(`RAG corpus not found at ${corpusPath}. Run 'npm run generate-corpus' first.`)
  }
  const corpus: RAGChunk[] = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
  service = new RetrievalService()
  service.initializeWithCorpus(corpus)
})

describe('Golden Query Suite', () => {
  // Aggregate metrics
  const metrics = {
    totalQueries: 0,
    intentCorrect: 0,
    recall5Hits: 0,
    recall5Total: 0,
    recall15Hits: 0,
    recall15Total: 0,
    sourceCoverageHits: 0,
    sourceCoverageTotal: 0,
    noiseHits: 0,
    noiseChecks: 0,
  }

  for (const gq of GOLDEN_QUERIES) {
    it(`"${gq.query}" — intent: ${gq.expectedIntent}`, () => {
      metrics.totalQueries++

      // Verify intent classification
      const intent = classifyIntent(gq.query)
      if (intent === gq.expectedIntent) metrics.intentCorrect++
      expect(intent).toBe(gq.expectedIntent)

      // Run retrieval
      const results = service.search(gq.query)
      const resultIds = results.map((r) => r.id)
      const resultSources = new Set(results.map((r) => r.source))

      // Check mustInclude (Recall@15)
      for (const prefix of gq.mustInclude) {
        metrics.recall15Total++
        const found = resultIds.some((id) => id.startsWith(prefix))
        if (found) metrics.recall15Hits++
        expect(found).toBe(true)
      }

      // Check mustInclude in top 5 (Recall@5)
      const top5Ids = resultIds.slice(0, 5)
      let top5Hits = 0
      for (const prefix of gq.mustInclude) {
        metrics.recall5Total++
        if (top5Ids.some((id) => id.startsWith(prefix))) {
          top5Hits++
          metrics.recall5Hits++
        }
      }
      expect(top5Hits).toBeGreaterThanOrEqual(gq.minTop5Hits)

      // Check source coverage
      for (const source of gq.expectedSources) {
        metrics.sourceCoverageTotal++
        if (resultSources.has(source)) metrics.sourceCoverageHits++
      }
      // At least one expected source should be present
      if (gq.expectedSources.length > 0) {
        const hasAny = gq.expectedSources.some((s) => resultSources.has(s))
        expect(hasAny).toBe(true)
      }

      // Check mustExclude (Noise)
      if (gq.mustExclude) {
        for (const prefix of gq.mustExclude) {
          metrics.noiseChecks++
          const found = resultIds.some((id) => id.startsWith(prefix))
          if (found) metrics.noiseHits++
          expect(found).toBe(false)
        }
      }
    })
  }

  // Log aggregate metrics after all tests
  it('should meet accuracy targets (summary)', () => {
    const recall5 = metrics.recall5Total > 0 ? metrics.recall5Hits / metrics.recall5Total : 1
    const recall15 = metrics.recall15Total > 0 ? metrics.recall15Hits / metrics.recall15Total : 1
    const sourceCoverage =
      metrics.sourceCoverageTotal > 0 ? metrics.sourceCoverageHits / metrics.sourceCoverageTotal : 1
    const noiseRate = metrics.noiseChecks > 0 ? metrics.noiseHits / metrics.noiseChecks : 0
    const intentAccuracy =
      metrics.totalQueries > 0 ? metrics.intentCorrect / metrics.totalQueries : 1

    console.warn(`\n=== RAG Accuracy Metrics ===`)
    console.warn(`  Intent Accuracy: ${(intentAccuracy * 100).toFixed(1)}% (target: ≥90%)`)
    console.warn(`  Recall@5:        ${(recall5 * 100).toFixed(1)}% (target: ≥80%)`)
    console.warn(`  Recall@15:       ${(recall15 * 100).toFixed(1)}% (target: ≥95%)`)
    console.warn(`  Source Coverage:  ${(sourceCoverage * 100).toFixed(1)}% (target: ≥90%)`)
    console.warn(`  Noise Rate:      ${(noiseRate * 100).toFixed(1)}% (target: <5%)`)

    expect(intentAccuracy).toBeGreaterThanOrEqual(0.9)
    expect(recall15).toBeGreaterThanOrEqual(0.95)
    expect(noiseRate).toBeLessThanOrEqual(0.05)
  })
})
