// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import canonical from '@/components/PKILearning/modules/OpsQuantumImpact/rag-summary.md?raw'
import { RetrievalService } from './RetrievalService'
import type { RAGChunk } from '@/types/ChatTypes'

let service: RetrievalService
beforeAll(() => {
  const filename = process.env.RAG_CORPUS_TEST_PATH || path.resolve('public/data/rag-corpus.json')
  // Explicit local test fixture override; never exposed as an application file-read API.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const corpus = JSON.parse(fs.readFileSync(filename, 'utf8')) as { chunks: RAGChunk[] }
  expect(corpus.chunks.length).toBeGreaterThan(100)
  RetrievalService.resetInstance()
  service = RetrievalService.getInstance()
  service.initializeWithCorpus(corpus.chunks)
}, 30_000)
afterAll(() => RetrievalService.resetInstance())

describe('retrieved Ops operational recipes', () => {
  it.each([
    [
      'nginx TLS1.3 cipher suites X25519MLKEM768 classical fallback operations',
      'ssl_conf_command Ciphersuites',
    ],
    [
      'OCSP must-staple certificate chain compressed device TLS budget operations',
      '11,096-byte Certificate body',
    ],
  ])('retrieves the maintained recipe for %s', (query, expected) => {
    const chunk = service
      .search(query, 12)
      .find((result) => result.id === 'module-summary-ops-quantum-impact')
    expect(chunk, `Ops summary missing for decision query: ${query}`).toBeDefined()
    expect(chunk!.source).toBe('module-summaries')
    expect(chunk!.metadata.moduleId).toBe('ops-quantum-impact')
    expect(chunk!.deepLink).toBe('/learn/ops-quantum-impact')
    expect(chunk!.content.trim()).toBe(canonical.trim())
    expect(chunk!.content).toContain(expected)
  })
})
