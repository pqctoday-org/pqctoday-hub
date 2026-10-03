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
  type EvidencePart,
  type EvidenceRecord,
} from './fheEvidence'

const HEX = (c: string) => c.repeat(64)

/** Sorted-key, whitespace-free JSON: the canonical form fixture input hashes are taken over. */
const canonicalJson = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonicalJson).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonicalJson((v as Record<string, unknown>)[k])}`)
          .join(',')}}`
      : JSON.stringify(v)

const base = {
  library: { name: 'TFHE-rs', version: '1.8.1', commit: '187fc0b95a' },
  parameters: 'V1_4_PARAM_MESSAGE_2_CARRY_2_KS_PBS_TUNIFORM_2M128',
  config: 'default',
  parameterHash: HEX('a'),
  environment: { hardware: 'lab', os: 'mixed', toolchain: 'rustc 1.90', features: 'default' },
  method: {
    warmup: 0,
    samples: 1,
    distribution: 'single run',
    peakMemoryMethod: 'getrusage maxrss',
  },
  result: 'pass' as const,
  status: 'measured' as const,
  artifacts: [{ name: 'run.json', sha256: HEX('b'), url: 'https://example.org/run.json' }],
  measuredAt: '2026-10-10',
}
const ENGINE = { repo: 'pqctoday-cacp', commit: '1234567' }

/** TFHE custody end to end: Mac (data owner) → KV260 (FHE server) → MX95 (custodian). */
const e2e = (over: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  ...base,
  id: 'e2e-1',
  scenarioId: 'tfhe-single-hsm',
  level: 'end-to-end',
  stepIds: [
    'generate-client-key',
    'owner-encrypts-locally',
    'upload-ciphertexts',
    'compute-with-pbs',
    'return-encrypted-result',
    'owner-requests-decrypt',
    'decrypt-under-policy',
  ],
  parts: [
    {
      device: 'mac-m4pro',
      role: 'data-owner',
      producer: 'pqctoday-sandbox',
      claimScope: 'owner-device',
      stepIds: ['owner-encrypts-locally'],
    },
    {
      device: 'kv260',
      role: 'fhe-server',
      producer: 'pqctoday-fhe',
      claimScope: 'board-untrusted-compute',
      stepIds: ['compute-with-pbs'],
    },
    {
      device: 'mx95',
      role: 'custodian',
      producer: 'pqctoday-cacp',
      claimScope: 'board-software-token',
      engine: ENGINE,
      stepIds: ['generate-client-key', 'decrypt-under-policy'],
    },
  ],
  ...over,
})

const swap = (i: number, p: Partial<EvidencePart>) => {
  const r = e2e()
  r.parts = r.parts!.map((x, k) => (k === i ? { ...x, ...p } : x))
  return r
}

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
  it('the TFHE client-key KAT fixture is present', () => {
    const f = SCENARIO_CONTRACT.scenarios
      .find((s) => s.id === 'tfhe-single-hsm')!
      .fixtures.find((x) => x.id === 'client-key-kat-v1')!
    expect(f.stepId).toBe('generate-client-key')
    expect(f.expectedOutputHash).toBe(
      '9f5d847e4d1121eef9d75fcc473e89ee5306523f9cb140384eba5aa85a55b77b'
    )
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
        expect(s.steps.map((st) => st.id)).toContain(f.stepId)
        expect(f.inputHash).toBe(
          crypto.createHash('sha256').update(canonicalJson(f.input), 'utf8').digest('hex')
        )
        expect(f.expectedOutputHash).toMatch(/^[0-9a-f]{64}$/)
      }
    }
  })
  it('no claim without a signature: records require the committed .sig', () => {
    const sig = path.resolve(
      __dirname,
      '../../../public/data/fhe-evidence/fhe-evidence.v1.json.sig'
    )
    if (EVIDENCE_MANIFEST.records.length > 0) expect(fs.existsSync(sig)).toBe(true)
  })
  it('budgets are named per actor, so a cloud number cannot satisfy an HSM budget', () => {
    for (const s of SCENARIO_CONTRACT.scenarios)
      for (const k of Object.keys(s.budgets))
        expect(s.actors.map((a) => a.id)).toContain(k.split('.')[0])
  })

  it('an end-to-end run labels each step by the device and role that ran it', () => {
    const at = (step: string) =>
      validationsFor('tfhe-single-hsm', step, [e2e()]).map((v) => v.label)
    expect(at('owner-encrypts-locally')).toEqual([
      'data owner on Mac (M4 Pro) · end-to-end run with the MX95 custodian',
    ])
    expect(at('compute-with-pbs')).toEqual([
      'FHE server on KV260 (untrusted compute, software-held keys) · end-to-end run with the MX95 custodian',
    ])
    expect(at('decrypt-under-policy')).toEqual([
      'custodian: software token on MX95 · end-to-end run',
    ])
    expect(at('upload-ciphertexts')).toEqual(['transfer Mac (M4 Pro) → KV260 · end-to-end run'])
    expect(at('owner-requests-decrypt')).toEqual(['transfer Mac (M4 Pro) → MX95 · end-to-end run'])
  })

  it('a custodian token on the Mac is shown as an earlier run', () => {
    const mac = swap(2, { device: 'mac-m4pro', producer: 'pqctoday-hsm' })
    expect(validateRecord(mac)).toEqual([])
    const at = (step: string) => validationsFor('tfhe-single-hsm', step, [mac]).map((v) => v.label)
    expect(at('decrypt-under-policy')).toEqual([
      'custodian: software token on Mac (earlier run) · end-to-end run',
    ])
    expect(at('owner-requests-decrypt')).toEqual(['transfer on Mac (M4 Pro) · end-to-end run'])
  })

  it('a run qualifier tells runs apart and cannot claim hardware', () => {
    const q = swap(2, { qualifier: ' (board-local, no KMIP)' })
    expect(validateRecord(q)).toEqual([])
    expect(validationsFor('tfhe-single-hsm', 'decrypt-under-policy', [q])[0].label).toBe(
      'custodian: software token on MX95 (board-local, no KMIP) · end-to-end run'
    )
    expect(validateRecord(swap(2, { qualifier: ' (hardware token)' }))).toContain(
      'qualifier may not say hardware or HSM-validated'
    )
    expect(validateRecord(swap(2, { qualifier: 'board-local' }))).toContain(
      'qualifier starts with ", " or " ("'
    )
  })

  it('the MX95 Pro plays custodian only in a failover run, and says so', () => {
    expect(validateRecord(swap(2, { device: 'mx95-pro' }))).toContain(
      'the MX95 Pro is the backup custodian; it plays custodian only in a failover run'
    )
    const fo = swap(2, { device: 'mx95-pro', failover: true })
    expect(validateRecord(fo)).toEqual([])
    expect(validationsFor('tfhe-single-hsm', 'decrypt-under-policy', [fo])[0].label).toBe(
      'custodian (failover): software token on MX95 Pro · end-to-end run'
    )
    expect(validateRecord(swap(0, { failover: true }))).toContain(
      'failover applies only to a board playing custodian'
    )
  })

  it('every run shows on a step, the designed device layout first', () => {
    const mac = { ...swap(2, { device: 'mac-m4pro', producer: 'pqctoday-hsm' }), id: 'mac' }
    const mx95 = { ...e2e(), id: 'mx95', measuredAt: '2026-10-01' }
    const withPro: EvidenceRecord = {
      ...e2e(),
      id: 'mx95+pro',
      measuredAt: '2026-09-01',
      stepIds: [...e2e().stepIds, 'offline-backup-restore'],
      parts: [
        ...e2e().parts!,
        {
          device: 'mx95-pro',
          role: 'backup-custodian',
          producer: 'pqctoday-hsm',
          claimScope: 'board-software-token',
          engine: ENGINE,
          stepIds: ['offline-backup-restore'],
        },
      ],
    }
    const order = validationsFor('tfhe-single-hsm', 'decrypt-under-policy', [mac, mx95, withPro])
    expect(order.map((v) => v.record.id)).toEqual(['mx95+pro', 'mx95', 'mac'])
  })

  it('each device runs only its own producers', () => {
    expect(validateRecord(swap(1, { producer: 'pqctoday-hsm' }))).toContain(
      'kv260 does not run pqctoday-hsm'
    )
    expect(validateRecord(swap(0, { producer: 'pqctoday-cacp' }))).toContain(
      'pqctoday-cacp cannot play data-owner'
    )
  })

  it('the backup HSM is the MX95 Pro; a 2-of-2 threshold run says what it ran', () => {
    const backup: EvidenceRecord = {
      ...base,
      id: 'dev-backup',
      scenarioId: 'tfhe-single-hsm',
      level: 'device',
      stepIds: ['offline-backup-restore'],
      parts: [
        {
          device: 'mx95-pro',
          role: 'backup-custodian',
          producer: 'pqctoday-cacp',
          claimScope: 'board-software-token',
          engine: ENGINE,
          stepIds: ['offline-backup-restore'],
        },
      ],
    }
    expect(validationsFor('tfhe-single-hsm', 'offline-backup-restore', [backup])[0].label).toBe(
      'backup custodian: software token on MX95 Pro'
    )
    const thr: EvidenceRecord = {
      ...base,
      id: 'thr-2of2',
      scenarioId: 'openfhe-threshold',
      level: 'end-to-end',
      stepIds: ['party-a-partial-decrypt', 'party-b-partial-decrypt'],
      parties: {
        threshold: 2,
        total: 2,
        placement: [
          { actor: 'hsmA', device: 'mx95' },
          { actor: 'hsmB', device: 'mx95-pro' },
        ],
      },
      parts: [
        {
          device: 'mx95',
          role: 'party',
          producer: 'pqctoday-cacp',
          claimScope: 'board-software-token',
          engine: ENGINE,
          stepIds: ['party-a-partial-decrypt'],
        },
        {
          device: 'mx95-pro',
          role: 'party',
          producer: 'pqctoday-cacp',
          claimScope: 'board-software-token',
          engine: ENGINE,
          stepIds: ['party-b-partial-decrypt'],
        },
      ],
    }
    expect(validationsFor('openfhe-threshold', 'party-a-partial-decrypt', [thr])[0].label).toBe(
      'key-holder party: software token on MX95 · end-to-end run · 2-of-2 (scenario shows 3-of-3)'
    )
    expect(validateRecord({ ...thr, parties: undefined })).toContain(
      'threshold runs on boards must state parties (threshold, total, placement)'
    )
  })

  it('reference evidence names the library', () => {
    const r: EvidenceRecord = {
      ...base,
      id: 'ref-1',
      scenarioId: 'openfhe-threshold',
      level: 'reference',
      producer: 'pqctoday-sandbox',
      claimScope: 'reference-library',
      library: { name: 'OpenFHE', version: 'v1.6.0', commit: '6206d24f9e' },
      stepIds: ['party-a-keygen'],
    }
    expect(validationsFor('openfhe-threshold', 'party-a-keygen', [r])[0].label).toBe(
      'reference-validated (OpenFHE v1.6.0)'
    )
    expect(
      validationsFor('openfhe-threshold', 'party-a-keygen', [
        { ...r, platformLabel: 'KV260 Cortex-A53' },
      ])[0].label
    ).toBe('reference-validated (OpenFHE v1.6.0, KV260 Cortex-A53)')
  })

  it.each([
    ['failed run', e2e({ result: 'fail' })],
    ['estimate', e2e({ status: 'estimate' })],
    ['KV260 claiming a data-owner step', swap(1, { stepIds: ['owner-encrypts-locally'] })],
    ['KV260 claiming an HSM step', swap(1, { stepIds: ['decrypt-under-policy'] })],
    [
      'Mac claiming the FHE server role',
      swap(0, { role: 'fhe-server', claimScope: 'board-untrusted-compute' }),
    ],
    ['KV260 labelled a software token', swap(1, { claimScope: 'board-software-token' })],
    ['MX95 Pro as primary custodian', swap(2, { device: 'mx95-pro' })],
    ['software-token part without engine commit', swap(2, { engine: undefined })],
    ['part step missing from the record', swap(2, { stepIds: ['live-clone-peer-hsm'] })],
    ['hardware custody claim', e2e({ claimLabel: 'HSM-validated hardware custody' })],
    [
      'artifact without a hash',
      e2e({ artifacts: [{ name: 'x', sha256: 'nope', url: 'https://x' }] }),
    ],
    [
      'method without samples',
      e2e({ method: { warmup: 0, samples: 0, distribution: 'x', peakMemoryMethod: 'x' } }),
    ],
    ['single-device end-to-end', e2e({ parts: e2e().parts!.slice(2) })],
  ])('raises no badge for a %s', (_name, rec) => {
    for (const st of rec.stepIds) expect(validationsFor(rec.scenarioId, st, [rec])).toEqual([])
  })

  it('the valid end-to-end fixture itself passes', () => {
    expect(validateRecord(e2e())).toEqual([])
  })
})
