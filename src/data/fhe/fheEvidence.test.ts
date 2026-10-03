// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  FHE_HSM_FLOWS,
  FLOW_STEP_META,
  engineStatusOf,
} from '../../components/PKILearning/modules/ConfidentialComputing/data/fheHsmFlows'
import {
  EVIDENCE_MANIFEST,
  SCENARIO_CONTRACT,
  validateRecord,
  validationsFor,
  type EvidenceRecord,
} from './fheEvidence'

const HEX = (c: string) => c.repeat(64)

const record = (over: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  id: 'ev-1',
  scenarioId: 'tfhe-single-hsm',
  stepIds: ['decrypt-under-policy'],
  level: 'board',
  producer: 'pqctoday-cacp',
  board: 'mx95',
  library: { name: 'TFHE-rs', version: '1.8.1', commit: 'abcdef1' },
  engine: { repo: 'pqctoday-cacp', commit: '1234567' },
  parameters: 'V1_4_PARAM_MESSAGE_2_CARRY_2_KS_PBS_TUNIFORM_2M128',
  config: 'default',
  parameterHash: HEX('a'),
  environment: {
    hardware: 'i.MX 95 (Cortex-A55)',
    os: 'Yocto',
    toolchain: 'rustc 1.90',
    features: 'aarch64-aes',
  },
  method: {
    warmup: 10,
    samples: 100,
    distribution: 'median, p95',
    peakMemoryMethod: 'getrusage maxrss',
  },
  result: 'pass',
  status: 'measured',
  claimScope: 'board-software-token',
  claimLabel: 'software token on MX95',
  artifacts: [{ name: 'run.json', sha256: HEX('b'), url: 'https://example.org/run.json' }],
  measuredAt: '2026-10-10',
  ...over,
})

describe('FHE scenario contract (fhe-hsm-scenarios.v1)', () => {
  it('lists the same scenarios as the workshop, in order', () => {
    expect(SCENARIO_CONTRACT.schema).toBe('fhe-hsm-scenarios.v1')
    expect(SCENARIO_CONTRACT.scenarios.map((s) => s.id)).toEqual(FHE_HSM_FLOWS.map((f) => f.id))
  })

  it.each(FHE_HSM_FLOWS.map((f) => [f.id, f] as const))(
    '%s: workshop steps match the canonical contract',
    (id, flow) => {
      const c = SCENARIO_CONTRACT.scenarios.find((s) => s.id === id)!
      expect(c.actors).toEqual(flow.actors.map((a) => ({ id: a.id, kind: a.kind, zone: a.zone })))
      expect(c.steps).toEqual(
        flow.steps.map((s, i) => ({
          id: s.id,
          from: s.from,
          to: s.to,
          phase: FLOW_STEP_META[id].phase[i],
          data: FLOW_STEP_META[id].data[i],
          deployment: s.deployment === true,
          engineStatus: engineStatusOf(flow, s),
          ...(s.api ? { api: s.api } : {}),
        }))
      )
    }
  )

  it('step ids are unique kebab-case within each scenario', () => {
    for (const s of SCENARIO_CONTRACT.scenarios) {
      const ids = s.steps.map((st) => st.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })
})

describe('FHE evidence manifest (fhe-evidence.v1)', () => {
  it('every committed record validates against the contract', () => {
    expect(EVIDENCE_MANIFEST.schema).toBe('fhe-evidence.v1')
    for (const r of EVIDENCE_MANIFEST.records) expect(validateRecord(r), r.id).toEqual([])
  })

  it('every committed record’s parameterHash is SHA-256 of "parameters\\nconfig"', () => {
    for (const r of EVIDENCE_MANIFEST.records) {
      const h = crypto.createHash('sha256').update(`${r.parameters}\n${r.config}`).digest('hex')
      expect(r.parameterHash, r.id).toBe(h)
    }
  })

  it('contract v1 fields: §1.1 target labels, disclosures, budget names, fixtures', () => {
    const LABELS = [
      'reference-validated',
      'token-validated',
      'conformance-mapped',
      'wire-interoperable',
      'reference-only',
    ]
    for (const s of SCENARIO_CONTRACT.scenarios) {
      expect(LABELS).toContain(s.validationTargetLabel)
      expect(s.disclosures.length).toBeGreaterThan(0)
      for (const d of s.disclosures) expect(d).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(Object.keys(s.budgets).length).toBeGreaterThan(0)
      for (const f of s.fixtures) {
        expect(f.inputHash).toMatch(/^[0-9a-f]{64}$/)
        expect(f.expectedOutputHash).toMatch(/^[0-9a-f]{64}$/)
      }
    }
  })

  it('no claim without a signature: records require the committed .sig', () => {
    const sig = path.resolve(__dirname, 'fhe-evidence.v1.json.sig')
    if (EVIDENCE_MANIFEST.records.length > 0) expect(fs.existsSync(sig)).toBe(true)
  })

  it('a valid passing board record raises "software token on <board>"', () => {
    const v = validationsFor('tfhe-single-hsm', 'decrypt-under-policy', [record()])
    expect(v.map((x) => x.label)).toEqual(['software token on MX95'])
  })

  it('reference evidence names the library', () => {
    const r = record({
      level: 'reference',
      producer: 'pqctoday-sandbox',
      board: undefined,
      engine: undefined,
      library: { name: 'OpenFHE', version: 'v1.6.0', commit: '6206d24f9e' },
      claimScope: 'reference-library',
      claimLabel: undefined,
    })
    expect(validationsFor('tfhe-single-hsm', 'decrypt-under-policy', [r])[0].label).toBe(
      'reference-validated (OpenFHE v1.6.0)'
    )
  })

  it.each([
    ['failed run', { result: 'fail' as const }],
    ['unknown step', { stepIds: ['no-such-step'] }],
    ['producer claims a board it does not run', { producer: 'pqctoday-fhe' as const }],
    ['board level without a board', { board: undefined }],
    ['artifact without a hash', { artifacts: [{ name: 'x', sha256: 'nope', url: 'https://x' }] }],
    ['hardware custody claim', { claimLabel: 'HSM-validated hardware custody' }],
    ['claim scope that does not match the level', { claimScope: 'browser-emulator' as const }],
    ['estimate', { status: 'estimate' as const }],
    [
      'method without samples',
      { method: { warmup: 0, samples: 0, distribution: 'x', peakMemoryMethod: 'x' } },
    ],
    ['missing engine commit', { engine: undefined }],
  ])('raises no badge for a %s', (_name, over) => {
    expect(validationsFor('tfhe-single-hsm', 'decrypt-under-policy', [record(over)])).toEqual([])
  })
})
