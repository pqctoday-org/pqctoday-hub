// SPDX-License-Identifier: GPL-3.0-only
/**
 * Entropy Evidence Lab — pure-logic tests, KAT pattern.
 *
 * The fixtures are the pinned NATIVE results of the NIST SP 800-90B tool
 * (W1 parity run, native-arm64-strict ≡ WASM), shipped in
 * public/data/entropy/device-datasets-manifest.json. The lab's own
 * min-of-estimators selection must reproduce the tool's hAssessed for every
 * one of them; the cutoff maths must be entropyTests.ts's and reproduce
 * SP 800-90B's published examples; the conclusion must be able to end in
 * "insufficient evidence" and must never turn conditioned/DRBG output into a
 * noise-source claim.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { NistToolJson } from '@/wasm/entropy90b/resultRecord'
import {
  aptCutoff,
  aptWindowSize,
  rctCutoff,
  SP800_90B_DEFAULT_ALPHA,
} from '../../utils/entropyTests'
import type { DeviceManifest } from './evidenceLabData'
import {
  checkLearnerVerdict,
  compareWithReference,
  concludeEvidence,
  estimatorRows,
  evaluateRestart,
  flattenToolJson,
  healthCutoffs,
  iidTestsPassed,
  selectMinimum,
  toolAssessed,
  type ConclusionInput,
  type Flat,
  type RestartEvaluation,
} from './evidenceLabLogic'

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'public/data/entropy/device-datasets-manifest.json'),
    'utf8'
  )
) as DeviceManifest
const refs = Object.entries(manifest.nativeReference.bySha256)

/** Rebuild tool JSON from a flattened record (inverse of flattenToolJson). */
function toolJsonFrom(flat: Flat, sha256 = 'x'): NistToolJson {
  const cases = new Map<string, Record<string, unknown> & { testCaseDesc: string }>()
  for (const [k, v] of Object.entries(flat)) {
    if (k === 'error') continue
    const i = k.lastIndexOf(' / ')
    const desc = k.slice(0, i)
    if (!cases.has(desc)) cases.set(desc, { testCaseDesc: desc })
    cases.get(desc)![k.slice(i + 3)] = v
  }
  return {
    errorLevel: flat.error ? -1 : 0,
    errorMessage: flat.error ? String(flat.error) : undefined,
    sha256,
    testCases: [...cases.values()],
  }
}

describe('min-of-estimators selection (KAT: pinned native NIST tool results)', () => {
  const nonIid = refs.filter(([, e]) => e.nonIid && !e.nonIid.values.error)
  it('has a pinned non-IID result for every shipped device dataset and the synthetic sets', () => {
    expect(nonIid.length).toBeGreaterThanOrEqual(19)
    for (const d of manifest.datasets.filter((x) => x.kind !== 'restart'))
      expect(manifest.nativeReference.bySha256[d.sha256]?.nonIid, d.id).toBeDefined()
  })

  it.each(nonIid.map(([sha, e]) => [e.parityId, sha, e] as const))(
    '%s: min over all estimators equals the tool’s hAssessed',
    (_id, _sha, e) => {
      const values = e.nonIid!.values
      const rows = estimatorRows(values, e.bits)
      const sel = selectMinimum(rows, toolAssessed(values))
      expect(sel).not.toBeNull()
      expect(sel!.h).toBe(values['Overall / hAssessed'])
      expect(sel!.agreesWithTool).toBe(true)
      // Every estimator row is at or above the minimum.
      for (const r of rows) {
        if (r.literal !== null) expect(r.literal).toBeGreaterThanOrEqual(sel!.h)
        if (r.bitstringPerSample !== null)
          expect(r.bitstringPerSample).toBeGreaterThanOrEqual(sel!.h)
      }
    }
  )

  it('KV260 idle: the binding estimator is Compression on the bit string (8 × 0.35245…)', () => {
    const d = manifest.datasets.find((x) => x.id === 'kv260-idle-sequential')!
    const v = manifest.nativeReference.bySha256[d.sha256].nonIid!.values
    const sel = selectMinimum(estimatorRows(v, 8), toolAssessed(v))!
    expect(sel.h).toBe(2.819614073435354)
    expect(sel.bindingEstimator).toBe('Compression Test (for bit strings only)')
    expect(sel.bindingKind).toBe('bitstring')
  })

  it('1-bit data has no bit-string column; the minimum is over literal values', () => {
    const e = refs.find(([, x]) => x.parityId === 'd4-markov-1bit')![1]
    const rows = estimatorRows(e.nonIid!.values, 1)
    expect(rows.every((r) => r.bitstringPerSample === null)).toBe(true)
    expect(selectMinimum(rows, toolAssessed(e.nonIid!.values))!.h).toBe(0.29269606813553806)
  })

  it('IID track: the Most Common Value estimate reproduces the tool’s hAssessed', () => {
    const iid = refs.filter(([, e]) => e.iid && e.iid.values[' / hAssessed'] !== undefined)
    expect(iid.length).toBeGreaterThan(0)
    for (const [, e] of iid) {
      const v = e.iid!.values
      const sel = selectMinimum(estimatorRows(v, e.bits), toolAssessed(v))!
      expect(sel.h, e.parityId).toBe(v[' / hAssessed'])
      expect(sel.bindingEstimator).toBe('Most Common Value (IID track)')
    }
  })

  it('flattenToolJson is the inverse of the fixture shape', () => {
    const e = refs.find(([, x]) => x.bits === 8 && x.nonIid && !x.nonIid.values.error)![1]
    const v = e.nonIid!.values
    expect(flattenToolJson(toolJsonFrom(v))).toEqual(v)
  })

  it('iidTestsPassed reads the three IID verdict flags', () => {
    const base = { ' / passedChiSquareTests': true, ' / passedLongestRepeatedSubstringTest': true }
    expect(iidTestsPassed({ ...base, ' / passedIidPermutationTests': true })).toBe(true)
    expect(iidTestsPassed({ ...base, ' / passedIidPermutationTests': false })).toBe(false)
    expect(iidTestsPassed({})).toBeNull()
  })
})

describe('native reference comparison', () => {
  it('reports a bit-exact match and catches a last-bit difference', () => {
    const e = refs.find(([, x]) => x.nonIid && !x.nonIid.values.error)![1]
    const v = e.nonIid!.values
    expect(compareWithReference({ ...v }, v).matches).toBe(true)
    const key = 'Overall / hAssessed'
    const nudged = { ...v, [key]: (v[key] as number) + Number.EPSILON }
    const cmp = compareWithReference(nudged, v)
    expect(cmp.matches).toBe(false)
    expect(cmp.diffs.map((d) => d.field)).toEqual([key])
  })
})

describe('health-test cutoffs come from entropyTests.ts and match SP 800-90B', () => {
  it('equals rctCutoff / aptCutoff / aptWindowSize for a spread of H', () => {
    for (const h of [0.25, 0.5, 1, 1.5641523532665877, 2.819614073435354, 4, 7.4, 8]) {
      for (const bits of [1, 8]) {
        if (bits === 1 && h > 1) continue
        const c = healthCutoffs(h, bits)!
        expect(c.rct).toBe(rctCutoff(h, SP800_90B_DEFAULT_ALPHA))
        expect(c.aptWindow).toBe(aptWindowSize(bits === 1))
        expect(c.apt).toBe(aptCutoff(aptWindowSize(bits === 1), h, SP800_90B_DEFAULT_ALPHA))
      }
    }
  })

  it('reproduces the §4.4.1 worked example (H = 2.0, α = 2^-20 → C = 11)', () => {
    expect(healthCutoffs(2, 8)!.rct).toBe(11)
  })

  it('reproduces SP 800-90B Table 2 (W = 512 non-binary, W = 1024 binary)', () => {
    const nonBinary: Array<[number, number]> = [
      [0.5, 410],
      [1, 311],
      [2, 177],
      [4, 62],
      [8, 13],
    ]
    for (const [h, c] of nonBinary) expect(healthCutoffs(h, 8)!.apt).toBe(c)
    const binary: Array<[number, number]> = [
      [0.2, 941],
      [0.4, 840],
      [0.6, 748],
      [0.8, 664],
      [1, 589],
    ]
    for (const [h, c] of binary) expect(healthCutoffs(h, 1)!.apt).toBe(c)
  })

  it('derives no cutoffs when no entropy was awarded', () => {
    expect(healthCutoffs(null, 8)).toBeNull()
    expect(healthCutoffs(0, 8)).toBeNull()
  })
})

describe('restart evaluation (§3.1.4.2)', () => {
  const kvRestart = manifest.datasets.find((x) => x.id === 'kv260-idle-restart')!
  const kvRef = manifest.nativeReference.bySha256[kvRestart.sha256].restart!

  it('passes the KV260 idle matrix and takes min(H_r, H_c, H_I)', () => {
    const ev = evaluateRestart(toolJsonFrom(kvRef.values), kvRef.hI)
    expect(ev.status).toBe('passed')
    expect(ev.h).toBe(Math.min(ev.hR!, ev.hC!, kvRef.hI))
    expect(ev.h).toBe(2.819614073435354)
  })

  it('a sanity-check failure awards nothing', () => {
    const json: NistToolJson = { errorLevel: -1, errorMessage: 'Restart Sanity Check Failed.' }
    const ev = evaluateRestart(json, 2.25)
    expect(ev.status).toBe('sanity-check-failed')
    expect(ev.h).toBeNull()
  })

  it('min(H_r, H_c) below H_I / 2 fails validation', () => {
    const ev = evaluateRestart(
      toolJsonFrom({ 'Overall / h_r': 1.0, 'Overall / h_c': 3.0, 'Overall / h_i': 2.5 }),
      2.5
    )
    expect(ev.status).toBe('validation-failed')
    expect(ev.h).toBeNull()
  })
})

const passedRestart: RestartEvaluation = {
  status: 'passed',
  hI: 2.8,
  hR: 3.6,
  hC: 3.9,
  h: 2.8,
  message: 'ok',
}
const failedRestart: RestartEvaluation = {
  status: 'sanity-check-failed',
  hI: 2.2,
  hR: null,
  hC: null,
  h: null,
  message: 'Restart Sanity Check Failed.',
}
const seqOk = { status: 'ok' as const, h: 2.8, hashConfirmed: true }

function device(over: Partial<ConclusionInput> = {}): ConclusionInput {
  return {
    provenance: 'device-raw-noise',
    track: 'non-iid',
    sequential: seqOk,
    restartAvailable: true,
    restart: passedRestart,
    ...over,
  }
}

describe('conclusion', () => {
  it('can reach "insufficient evidence" on real device data', () => {
    const cases: ConclusionInput[] = [
      device({ sequential: { status: 'not-run', h: null, hashConfirmed: false } }),
      device({ restart: null }),
      device({ restartAvailable: false, restart: null }),
      device({ track: 'iid', sequential: { ...seqOk, iidTestsPassed: false } }),
      device({ track: 'iid', sequential: { ...seqOk, iidTestsPassed: true } }),
      device({ sequential: { ...seqOk, hashConfirmed: false } }),
    ]
    for (const c of cases) {
      const r = concludeEvidence(c)
      expect(r.verdict).toBe('insufficient-evidence')
      expect(r.h).toBeNull()
      expect(r.limits.length).toBeGreaterThan(0)
    }
  })

  it('awards an estimate only after a passed restart test, as min(H_r, H_c, H_I)', () => {
    const r = concludeEvidence(device())
    expect(r.verdict).toBe('estimate-for-dataset')
    expect(r.h).toBe(2.8)
    expect(r.reasons.join(' ')).toMatch(/under the recorded conditions/)
  })

  it('a failed restart test or a tool error awards nothing', () => {
    expect(concludeEvidence(device({ restart: failedRestart })).verdict).toBe('no-entropy-awarded')
    expect(
      concludeEvidence(
        device({ sequential: { status: 'error', h: null, errorMessage: 'x', hashConfirmed: true } })
      ).verdict
    ).toBe('no-entropy-awarded')
  })

  it('contrast (conditioned/DRBG) data NEVER yields a noise-source claim', () => {
    const seqs = [
      { status: 'not-run' as const, h: null, hashConfirmed: false },
      { status: 'ok' as const, h: 7.157023206337434, hashConfirmed: true },
      { status: 'ok' as const, h: 8, hashConfirmed: true, iidTestsPassed: true },
      { status: 'error' as const, h: null, errorMessage: 'x', hashConfirmed: true },
    ]
    for (const sequential of seqs)
      for (const track of ['non-iid', 'iid'] as const)
        for (const restart of [null, passedRestart, failedRestart])
          for (const restartAvailable of [true, false]) {
            const r = concludeEvidence({
              provenance: 'conditioned-output-contrast',
              track,
              sequential,
              restart,
              restartAvailable,
            })
            expect(r.verdict).toBe('not-noise-source-evidence')
            expect(r.h).toBeNull()
          }
  })

  it('synthetic SHA-256-conditioned output is not evidence, however high the estimate', () => {
    const r = concludeEvidence({
      provenance: 'synthetic',
      syntheticConditioned: true,
      track: 'non-iid',
      sequential: { status: 'ok', h: 7.4369474811097325, hashConfirmed: true },
      restartAvailable: false,
      restart: null,
    })
    expect(r.verdict).toBe('not-noise-source-evidence')
    expect(r.reasons.join(' ')).toMatch(/hides a failed source/)
  })

  it('synthetic stuck data (tool error) and restart-correlated data award nothing', () => {
    const base = { provenance: 'synthetic' as const, track: 'non-iid' as const }
    expect(
      concludeEvidence({
        ...base,
        sequential: {
          status: 'error',
          h: null,
          errorMessage: 'Symbol alphabet consists of 1 symbol.',
          hashConfirmed: true,
        },
        restartAvailable: false,
        restart: null,
      }).verdict
    ).toBe('no-entropy-awarded')
    expect(
      concludeEvidence({
        ...base,
        sequential: { ...seqOk, h: 7.416885324722426 },
        restartAvailable: true,
        restart: failedRestart,
      }).verdict
    ).toBe('no-entropy-awarded')
  })

  it('flags a learner conclusion that claims more than the evidence', () => {
    expect(checkLearnerVerdict('estimate-for-dataset', 'not-noise-source-evidence').ok).toBe(false)
    expect(checkLearnerVerdict('estimate-for-dataset', 'insufficient-evidence').ok).toBe(false)
    expect(checkLearnerVerdict('insufficient-evidence', 'insufficient-evidence').ok).toBe(true)
    // Claiming less than the evidence would support is conservative, not wrong.
    expect(checkLearnerVerdict('insufficient-evidence', 'estimate-for-dataset').ok).toBe(true)
  })
})
