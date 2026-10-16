// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { buildRunManifest, type RunManifest, type RunManifestInput } from '@/services/runManifest'
import {
  compareRuns,
  readReproduction,
  REPRODUCTION_SCHEMA,
  reproductionMarkdown,
  reproductionSaveRequest,
  type ReproductionRecord,
} from './reproductionRecord'

const SITE = { appVersion: '4.163.0', commit: 'abc123', wasmHash: 'w1', buildTimestamp: '' }

const input = (over: Partial<RunManifestInput> = {}): RunManifestInput => ({
  tool: { id: 'drbg-demo', title: 'SP 800-90A DRBG', version: '1' },
  executionMode: 'in-browser-implementation',
  inputs: { mechanism: 'HMAC_DRBG' },
  cases: [
    { id: 'c1', expected: 'aa', actual: 'aa', pass: true },
    { id: 'c2', expected: 'bb', actual: 'bb', pass: true },
  ],
  negativeControls: [{ id: 'n1', mutation: 'flip a bit', pass: true }],
  vectors: { source: 'CAVP', url: 'https://example/v.rsp', sha256: 'f00', count: 2 },
  limitations: ['Only HMAC_DRBG'],
  startedAt: '2026-10-16T10:00:00.000Z',
  finishedAt: '2026-10-16T10:00:01.000Z',
  ...over,
})

const run = (over: Partial<RunManifestInput> = {}, site = SITE): RunManifest =>
  buildRunManifest(input(over), site, 'test')

describe('compare runs', () => {
  it('two identical runs have the same results and no setup difference', () => {
    const c = compareRuns(run(), run())
    expect(c.sameTool).toBe(true)
    expect(c.sameResults).toBe(true)
    expect(c.setup).toEqual([])
  })

  it('lists build, vector and input differences', () => {
    const c = compareRuns(
      run(),
      run(
        {
          inputs: { mechanism: 'CTR_DRBG' },
          vectors: { source: 'CAVP', url: 'x', sha256: 'f01', count: 2 },
        },
        { ...SITE, commit: 'def456', wasmHash: 'w2' }
      )
    )
    expect(c.setup.map((d) => d.field)).toEqual([
      'Site commit',
      'WASM hash',
      'Vector file SHA-256',
      'Input: mechanism',
    ])
    expect(c.setup[3]).toEqual({ field: 'Input: mechanism', a: 'HMAC_DRBG', b: 'CTR_DRBG' })
  })

  it('lists per-case and negative-control differences', () => {
    const b = run({
      cases: [
        { id: 'c1', expected: 'aa', actual: 'ab', pass: false },
        { id: 'c3', actual: 'cc', pass: true },
      ],
      negativeControls: [{ id: 'n1', mutation: 'flip a bit', pass: false }],
    })
    const c = compareRuns(run(), b)
    expect(c.sameResults).toBe(false)
    expect(c.cases).toEqual([
      { id: 'c1', kind: 'result', a: 'PASS', b: 'FAIL' },
      { id: 'c2', kind: 'only-in-a', a: 'PASS', b: '' },
      { id: 'c3', kind: 'only-in-b', a: '', b: 'PASS' },
    ])
    expect(c.negativeControls).toEqual([{ id: 'n1', kind: 'result', a: 'PASS', b: 'FAIL' }])
  })

  it('same result with a different output is still a difference', () => {
    const b = run({
      cases: [
        { id: 'c1', expected: 'aa', actual: 'AA', pass: true },
        { id: 'c2', expected: 'bb', actual: 'bb', pass: true },
      ],
    })
    expect(compareRuns(run(), b).cases).toEqual([{ id: 'c1', kind: 'output', a: 'aa', b: 'AA' }])
  })
})

describe('reproduction record', () => {
  const record = (over: Partial<ReproductionRecord> = {}): ReproductionRecord => ({
    schema: REPRODUCTION_SCHEMA,
    runs: [
      { moduleId: 'run-manifest:drbg-demo:a', title: 'Run A', finishedAt: '2026-10-15T09:00:00Z' },
      { moduleId: 'run-manifest:drbg-demo:b', title: 'Run B', finishedAt: '2026-10-16T09:00:00Z' },
    ],
    comparison: compareRuns(run(), run({}, { ...SITE, commit: 'def456' })),
    secondImplementation: '',
    conclusion: 'HMAC_DRBG output repeats across builds',
    falsification: 'Any pinned vector failing on a later build',
    ...over,
  })

  it('states the differences, the falsification condition and what it does not show', () => {
    const md = reproductionMarkdown(record())
    expect(md).toContain('# Reproduction: SP 800-90A DRBG')
    expect(md).toContain('| Site commit | abc123 | def456 |')
    expect(md).toContain('## Differences in results\n\nNone.')
    expect(md).toContain('## Second implementation\n\n_Not stated._')
    expect(md).toContain('## What would falsify it\n\nAny pinned vector failing on a later build')
    expect(md).toContain('A vector match is not a CAVP/ACVP validation.')
  })

  it('round-trips through the store', () => {
    const req = reproductionSaveRequest(record(), 'reproduction-record:1')
    expect(req.title).toBe('SP 800-90A DRBG: 2026-10-15 vs 2026-10-16 (same results)')
    expect(readReproduction({ type: req.type, inputs: req.inputs })).toEqual(record())
    expect(readReproduction({ type: 'reproduction-record', inputs: { schema: 'x' } })).toBeNull()
  })
})
