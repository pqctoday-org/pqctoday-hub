// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import devSummary from '@/components/PKILearning/modules/DevQuantumImpact/rag-summary.md?raw'
import archSummary from '@/components/PKILearning/modules/ArchQuantumImpact/rag-summary.md?raw'
import opsSummary from '@/components/PKILearning/modules/OpsQuantumImpact/rag-summary.md?raw'
import { RetrievalService } from './RetrievalService'

// Load the complete generated corpus once: ranking must compete with real sources,
// and neither a synthetic subset nor a per-test rebuild should hide regressions.
let service: RetrievalService
const summaries = [
  {
    moduleId: 'dev-quantum-impact',
    canonical: devSummary,
    query:
      'Developer Quantum Impact workshop token size Authorization header line budget sample tools',
  },
  {
    moduleId: 'arch-quantum-impact',
    canonical: archSummary,
    query: 'Architect Quantum Impact workshop certificate payload root excluded sample tools',
  },
  {
    moduleId: 'ops-quantum-impact',
    canonical: opsSummary,
    query: 'Ops DevOps Quantum Impact envelope ReEncrypt RSA AES wrapped DEK ML-KEM operation',
  },
] as const

beforeAll(() => {
  const filename = process.env.RAG_CORPUS_TEST_PATH || path.resolve('public/data/rag-corpus.json')
  const corpus = JSON.parse(fs.readFileSync(filename, 'utf8')) as { chunks: RAGChunk[] }
  expect(Array.isArray(corpus.chunks)).toBe(true)
  expect(corpus.chunks.length).toBeGreaterThan(100)
  RetrievalService.resetInstance()
  service = RetrievalService.getInstance()
  service.initializeWithCorpus(corpus.chunks)
}, 30_000)

afterAll(() => RetrievalService.resetInstance())

function retrieve(moduleId: string, query: string): RAGChunk {
  const results = service.search(query, 12)
  const chunk = results.find((result) => result.id === `module-summary-${moduleId}`)
  expect(chunk, `Missing ${moduleId} for decision query: ${query}`).toBeDefined()
  return chunk!
}
function workshop(content: string): string {
  return (
    content.split('## Workshop / Interactive Activities')[1]?.split('## Related Standards')[0] ?? ''
  )
}

describe('retrieved role resource source integrity', () => {
  it.each(summaries)(
    '$moduleId retrieves the actual canonical summary and its module route',
    ({ moduleId, canonical, query }) => {
      const chunk = retrieve(moduleId, query)
      expect(chunk.source).toBe('module-summaries')
      expect(chunk.metadata.moduleId).toBe(moduleId)
      expect(chunk.deepLink).toBe(`/learn/${moduleId}`)
      expect(chunk.content.trim()).toBe(canonical.trim())
    }
  )

  it('retrieves developer decisions with separate working tool routes and honest input-analysis scope', () => {
    const chunk = retrieve('dev-quantum-impact', summaries[0].query)
    const activities = workshop(chunk.content)
    for (const route of [
      '/learn/api-security-jwt?tab=workshop&step=4',
      '/playground/tls-simulator',
      '/playground/hybrid-encrypt',
      '/learn/acvp-lab-workflow?tab=workshop&step=1',
      '/learn/crypto-dev-apis?tab=workshop&step=7',
      '/learn/code-signing?tab=workshop&step=0',
    ])
      expect(activities).toContain(`](${route})`)
    expect(activities).toContain('Code-signing sample')
    expect(activities).toMatch(/header-line bytes.*entered line budget/)
    expect(activities).toMatch(/does not measure every header/)
    expect(activities).toMatch(/runs no engine/)
    expect(activities).toMatch(/not a source-code scan or measured readiness assessment/)
    expect(activities).not.toMatch(
      /signature size impact calculator|TLS handshake size estimator|code signing tool migration matrix|ACVP test vector gap analysis/
    )
  })

  it('retrieves architect decisions with payload and certificate tools without claiming computed feasibility', () => {
    const activities = workshop(retrieve('arch-quantum-impact', summaries[1].query).content)
    for (const route of [
      '/playground/cert-capacity',
      '/playground/tls-simulator',
      '/playground/hybrid-certs',
    ]) {
      expect(activities).toContain(`](${route})`)
    }
    expect(activities).toContain('The root is excluded from TLS payload')
    expect(activities).toMatch(
      /does not predict CPU capacity, P99 latency, OCSP response size or MTU fragmentation/
    )
    expect(activities).toMatch(/not a measured readiness scan/)
    expect(activities).toMatch(/does not establish client, vendor HSM or certification support/)
    expect(activities).not.toMatch(
      /TLS performance budget calculator|certificate chain size calculator|Architecture Design Lab/
    )
  })

  it('retrieves the bounded AWS operation instead of a generic batch or KEM re-encryption promise', () => {
    const chunk = retrieve('ops-quantum-impact', summaries[2].query)
    const envelope = chunk.content
      .split('\n')
      .find((line) => line.startsWith('- **Envelope Re-encryption at Scale**'))!
    expect(envelope).toContain('aws kms re-encrypt --ciphertext-blob fileb://dek.enc')
    expect(envelope).toContain('--source-encryption-algorithm RSAES_OAEP_SHA_256')
    expect(envelope).toContain('--destination-key-id <aes-256-key-id>')
    expect(envelope).toContain('one compatible KMS ciphertext blob per request')
    expect(envelope).toContain(
      'bounded batches, checkpoints and retries are orchestrated by the calling application'
    )
    expect(envelope).toContain('`Encapsulate`/`Decapsulate` to establish a shared secret')
    expect(envelope).toContain(
      'not `ReEncrypt` destinations or a drop-in wrapped-DEK ciphertext format'
    )
    expect(envelope).not.toContain('when migrating KMS KEKs to ML-KEM, all DEKs')
    expect(envelope).not.toContain('AWS KMS re-encrypt API supports batch operations')
    expect(chunk.content).toContain('`kms-pqc`')
    // Other Ops passages have separate pending scope; neither this check nor
    // retrieval tests execute a cloud command or establish cryptographic validation.
  })
})
