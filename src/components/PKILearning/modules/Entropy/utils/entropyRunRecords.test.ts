// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { RUN_MANIFEST_SCHEMA } from '@/services/runManifest'
import { runManifestToJson } from '@/services/runRecordExport'
import { EDUCATION_NOTICE } from '@/data/educationNotice'
import type { KATResult } from '@/utils/katRunner'
import katFile from './hmacDrbgSha256.kat.json'
import { runKatWithSabotage, type KatVectorFile } from './drbgKatRun'
import {
  DRBG_KAT_FILE_PATH,
  DRBG_KAT_FILE_SHA256,
  DRBG_TOOL,
  ENTROPY_TESTING_TOOL,
  SOURCE_COMBINING_TOOL,
  drbgRunManifest,
  entropyTestingRunManifest,
  evidenceLabRunManifest,
  sourceCombiningRunManifest,
} from './entropyRunRecords'
import { assessRawSource, simulateRawSamples } from '../workshop/sourceAssessment'
import { SP800_90B_STARTUP_SAMPLES } from './entropyTests'

const SITE = {
  appVersion: '4.163.0',
  commit: '83cac797332d362fdefb00f6c57913ede2bf9a83',
  wasmHash: 'w',
  buildTimestamp: 't',
}

describe('run record tool versions', () => {
  it('equal the workshopRegistry entries', () => {
    for (const tool of [DRBG_TOOL, ENTROPY_TESTING_TOOL, SOURCE_COMBINING_TOOL]) {
      const entry = WORKSHOP_TOOLS.find((t) => t.id === tool.id)
      expect(entry, tool.id).toBeDefined()
      expect(entry!.version).toBe(tool.version)
    }
  })
})

describe('DRBG run record (real pinned NIST vectors)', () => {
  it('pins the SHA-256 of the vector file bytes as committed', () => {
    const bytes = fs.readFileSync(path.join(process.cwd(), DRBG_KAT_FILE_PATH))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(DRBG_KAT_FILE_SHA256)
  })

  it('records 16 passing cases and 11 passing one-bit negative controls', async () => {
    const run = await runKatWithSabotage(katFile as unknown as KatVectorFile)
    const m = await drbgRunManifest(run, SITE, 'UA')
    expect(m.schema).toBe(RUN_MANIFEST_SCHEMA)
    expect(m.tool).toEqual(DRBG_TOOL)
    expect(m.executionMode).toBe('in-browser-implementation')
    expect(m.cases).toHaveLength(16)
    expect(m.cases.every((c) => c.pass)).toBe(true)
    expect(m.summary).toEqual({ passed: 16, failed: 0 })
    expect(m.negativeControls).toHaveLength(11)
    expect(m.negativeControls!.every((n) => n.pass)).toBe(true)
    expect(m.vectors).toEqual({
      source: expect.stringContaining('ACVP-Server'),
      url: `https://github.com/pqctoday-org/pqctoday-hub/blob/${SITE.commit}/${DRBG_KAT_FILE_PATH}`,
      sha256: DRBG_KAT_FILE_SHA256,
      count: 16,
    })
    expect(m.limitations.join(' ')).toContain('A vector match is not a CAVP/ACVP validation')
    expect(m.limitations.join(' ')).toContain('Not an entropy-source test')
  })

  it('records outputs as digests of the published answer, byte for byte', async () => {
    const run = await runKatWithSabotage(katFile as unknown as KatVectorFile)
    const m = await drbgRunManifest(run, SITE, 'UA')
    const first = (katFile as unknown as KatVectorFile).cases[0]
    const digest = createHash('sha256').update(Buffer.from(first.returnedBits, 'hex')).digest('hex')
    const c = m.cases.find((x) => x.id === first.id)!
    expect(c.expected).toBe(`sha256:${digest} (${first.returnedBitsLen / 8} bytes)`)
    expect(c.actual).toBe(c.expected)
    // The upstream sources and their file digests travel with the record.
    const sources = m.inputs.upstreamSources as Array<{ id: string; files: { sha256: string }[] }>
    expect(sources.map((s) => s.id)).toEqual(['acvp', 'cavp'])
    expect(sources[0].files[0].sha256).toBe(
      '3613b3b990904ed9c98ea05ce223e660e29d45f370b03618e0e4cc8c0c43e004'
    )
  })

  it('downloads as JSON led by the education notice', async () => {
    const run = await runKatWithSabotage(katFile as unknown as KatVectorFile)
    const m = await drbgRunManifest(run, SITE, 'UA')
    const parsed = JSON.parse(runManifestToJson(m))
    expect(Object.keys(parsed)[0]).toBe('notice')
    expect(parsed.notice).toBe(EDUCATION_NOTICE)
    delete parsed.notice
    expect(parsed).toEqual(JSON.parse(JSON.stringify(m)))
  })
})

describe('Entropy Testing run record', () => {
  const result = (id: string, status: KATResult['status']): KATResult => ({
    id,
    useCase: id,
    algorithm: 'SHA-256',
    standard: 'FIPS 180-4',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    status,
    details: status === 'pass' ? 'all vectors validated' : 'not tested',
    evidence: 'nist-sample' as KATResult['evidence'],
  })

  it('records each self-check as a case; a skipped check is not a pass', () => {
    const m = entropyTestingRunManifest(
      {
        specs: [],
        results: [result('entropy-sha256-empty', 'pass'), result('entropy-hmac512-health', 'skip')],
        startedAt: '2026-10-16T10:00:00.000Z',
        finishedAt: '2026-10-16T10:00:01.000Z',
      },
      SITE,
      'UA'
    )
    expect(m.tool).toEqual(ENTROPY_TESTING_TOOL)
    expect(m.cases.map((c) => [c.id, c.pass])).toEqual([
      ['entropy-sha256-empty', true],
      ['entropy-hmac512-health', false],
    ])
    expect(m.summary).toEqual({ passed: 1, failed: 1 })
    expect(m.limitations[0]).toBe('Primitive self-checks only; not an SP 800-90B entropy estimate.')
    expect(m.inputs.sampleChecks).toBeUndefined()
  })
})

describe('Source Combining run record', () => {
  it('records scenario, sources, per-check outcomes and the verdict', () => {
    const stuck = simulateRawSamples('stuck', SP800_90B_STARTUP_SAMPLES + 64, (n) =>
      new Uint8Array(n).fill(7)
    )
    const healthy = simulateRawSamples('healthy', SP800_90B_STARTUP_SAMPLES + 64, (n) =>
      crypto.getRandomValues(new Uint8Array(n))
    )
    const a = assessRawSource(stuck)
    const b = assessRawSource(healthy)
    const m = sourceCombiningRunManifest(
      {
        scenario: 'Counterexample loaded: Stuck source, detected',
        sources: [
          {
            name: 'Source A',
            condition: 'stuck',
            includedInRequest: false,
            ...a,
          },
          {
            name: 'Source B',
            condition: 'healthy',
            includedInRequest: true,
            ...b,
          },
        ],
        assumptions: { independence: 'independent', rbgClass: 'RBG2(P)' },
        combination: 'concat',
        conditioning: 'hash-df',
        seedPath: 'conditioned-block',
        entropyAccount: { creditedInputBits: 256, seedEntropyBits: 256 },
        conditionedOutputChecks: null,
        verdict: { id: 'not-enough-evidence', label: 'Not enough evidence', reasons: ['r'] },
        startedAt: '2026-10-16T10:00:00.000Z',
        finishedAt: '2026-10-16T10:00:01.000Z',
      },
      SITE,
      'UA'
    )
    expect(a.failed).toBe(true)
    expect(m.executionMode).toBe('simulation')
    expect(m.inputs.scenario).toContain('Stuck source')
    expect((m.inputs.verdict as { label: string }).label).toBe('Not enough evidence')
    const expected = a.startup.length + a.continuous.length + b.startup.length + b.continuous.length
    expect(m.cases).toHaveLength(expected)
    expect(m.cases.some((c) => c.id.startsWith('Source A startup') && !c.pass)).toBe(true)
    expect(m.limitations.join(' ')).toContain('simulated')
    expect(m.limitations.join(' ')).toContain('Not a validation')
  })
})

describe('Entropy Evidence Lab run record', () => {
  it('keeps the lab export under inputs and adds site provenance', () => {
    const evidence = {
      schema: 'pqctoday.entropy.evidence-lab-export/1',
      case: { id: 'kv260', title: 'KV260 idle', provenance: 'device' },
      track: 'non-iid',
    }
    const m = evidenceLabRunManifest(
      {
        moduleVersion: 'entropy-randomness content 9',
        evidence,
        sequential: { ran: true, ok: true, h: 2.8, hashConfirmedByTool: true },
        nativeReference: { sequential: { matches: true, identical: 40, compared: 40 } },
        restart: null,
        learnerCheck: { ok: true, message: 'matches' },
        conclusion: {
          verdict: 'insufficient-evidence',
          label: 'Insufficient evidence',
          limits: ['L1'],
        },
        startedAt: '2026-10-16T10:00:00.000Z',
        finishedAt: '2026-10-16T10:00:01.000Z',
      },
      SITE,
      'UA'
    )
    expect(m.site).toEqual(SITE)
    expect(m.inputs).toEqual(evidence)
    expect(m.tool.version).toBe('entropy-randomness content 9')
    expect(m.cases.map((c) => c.id)).toEqual([
      'sequential estimator run',
      'dataset hash confirmed by the tool',
      'matches pinned native NIST tool result',
      'learner conclusion',
    ])
    expect(m.limitations).toContain('L1')
  })
})
