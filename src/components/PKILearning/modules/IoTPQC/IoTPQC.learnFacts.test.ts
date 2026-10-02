// SPDX-License-Identifier: GPL-3.0-only
/**
 * Learn text and exercises must say what the workshop computes.
 *
 *  1. LEARN_FACTS (what the Learn tab prints) re-derived through the workshop
 *     functions.
 *  2. Every number quoted in an exercise's "what to observe" is recomputed
 *     here from the same models with that exercise's own settings.
 *  3. Regression bans: the figures and framings the 2026-10-01 accuracy audit
 *     (findings I1-I24) found wrong may not reappear in the Learn or exercise
 *     source.
 */
import { describe, it, expect } from 'vitest'
import introSource from './components/IoTPQCIntroduction.tsx?raw'
import exercisesSource from './components/IoTPQCExercises.tsx?raw'
import ragSummary from './rag-summary.md?raw'
import { LEARN_FACTS } from './learnFacts'
import { SCENARIOS } from './components/IoTPQCExercises'
import { algorithmById, SUIT_COSE_OVERHEAD_BYTES } from './constants'
import {
  assessFit,
  deliveredChainBytes,
  dtlsHandshake,
  edhocHandshake,
  fitSummary,
  pbAdvSegments,
  sigSizesOf,
  chainSizes,
  uniformChain,
} from './utils/sizing'
import { firmwareAirtime } from './utils/lpwanMath'
import { computeRotationPlan } from './data/fleetData'
import { DEFAULT_FLEET } from './data/fleetTypes'

const fmt = (x: number) => x.toLocaleString('en-US')
const obs = (id: string) => SCENARIOS.find((s) => s.id === id)!.observe

describe('Learn facts equal the workshop', () => {
  it('handshakes and chains', () => {
    expect(LEARN_FACTS.dtlsPq.totalBytes).toBe(dtlsHandshake('ml-kem-768', 'ml-dsa-44').totalBytes)
    expect(LEARN_FACTS.edhocPq.totalBytes).toBe(
      edhocHandshake('ml-kem-768', 'ml-dsa-44').totalBytes
    )
    expect(LEARN_FACTS.chainTable.find((c) => c.name === 'ML-DSA-44')!.sent).toBe(
      uniformChain('ml-dsa-44').sent
    )
  })

  it('fit claims come from fitSummary', () => {
    expect(LEARN_FACTS.class1Verify).toEqual(fitSummary(1, 'verify', 'stack'))
    expect(LEARN_FACTS.class1Kem).toEqual(fitSummary(1, 'kem', 'stack'))
  })

  it('verification ranking: LMS is not the fastest verifier (I10)', () => {
    const names = LEARN_FACTS.verifyRanking.map((r) => r.name)
    expect(names[0]).toMatch(/FN-DSA/)
    expect(names.indexOf('LMS (H10/W4)')).toBeGreaterThan(names.indexOf('ML-DSA-44'))
  })

  it('fleet and airtime figures', () => {
    const f = computeRotationPlan(DEFAULT_FLEET)
    expect(LEARN_FACTS.fleet.bottleneck).toBe(f.bottleneck)
    expect(Number(LEARN_FACTS.airtime.mldsa87SharePct)).toBeLessThan(5)
  })

  it('every manifest learnSections id is a rendered data-section-id', async () => {
    const { default: manifest } = await import('./manifest')
    const anchors = [...introSource.matchAll(/<Section\s+id="([a-z-]+)"/g)].map((m) => m[1])
    expect(anchors).toEqual(manifest.learnSections!.map((s) => s.id))
    expect(introSource).toContain('data-section-id={id}')
  })
})

describe('exercise observations equal what the step computes', () => {
  it('1 verify-vs-sign', () => {
    const o = obs('verify-vs-sign')
    const v44 = assessFit(algorithmById('ml-dsa-44'), 1, 'verify', 'stack')
    const s44 = assessFit(algorithmById('ml-dsa-44'), 1, 'verify', 'speed')
    expect(o).toContain(`${fmt(v44.peakBytes)} B, ${v44.ramPct.toFixed(0)}%`)
    expect(o).toContain(`${fmt(s44.peakBytes)} B`)
    expect(s44.verdict).toBe('too-large')
    const fn = assessFit(algorithmById('fn-dsa-512'), 1, 'sign', 'stack')
    expect(fn.verdict).toBe('too-large')
    expect(o).toContain(fmt(fn.stackBytes))
    expect(fitSummary(1, 'verify', 'stack').fits).toEqual([
      'ECDSA P-256',
      'LMS (H10/W4)',
      'FN-DSA-512 (Falcon-512)',
    ])
  })

  it('2 firmware-lms', () => {
    const o = obs('firmware-lms')
    const lms = algorithmById('lms-h10-w4')
    const share =
      ((lms.outputBytes + SUIT_COSE_OVERHEAD_BYTES) /
        (256 * 1024 + lms.outputBytes + SUIT_COSE_OVERHEAD_BYTES)) *
      100
    expect(o).toContain(`${share.toFixed(2)}%`)
    expect(o).toContain(fmt(lms.outputBytes))
    expect(o).toContain(fmt(algorithmById('ml-dsa-44').outputBytes))
  })

  it('3 dtls-vs-edhoc', () => {
    const o = obs('dtls-vs-edhoc')
    const d = dtlsHandshake('ml-kem-768', 'ml-dsa-44')
    const c = dtlsHandshake('x25519', 'ecdsa-p256')
    const e = edhocHandshake('ml-kem-768', 'ml-dsa-44')
    const ec = edhocHandshake('x25519', 'ecdsa-p256')
    expect(o).toContain(
      `${fmt(d.totalBytes)} B: ${d.datagrams} IPv6 datagrams and ${d.radioFrames}`
    )
    expect(o).toContain(`${(d.totalBytes / c.totalBytes).toFixed(1)}× the ${fmt(c.totalBytes)} B`)
    expect(o).toContain(`${fmt(e.totalBytes)} B (${e.radioFrames} frames)`)
    expect(o).toContain(`${fmt(ec.totalBytes)} B`)
  })

  it('4 chain-class1', () => {
    const o = obs('chain-class1')
    const s = sigSizesOf('ml-dsa-65')
    const full = deliveredChainBytes('full', s, s, s).bytes
    expect(o).toContain(fmt(full))
    expect(full).toBeGreaterThan(10 * 1024)
    expect(o).toContain(`${fmt(full - deliveredChainBytes('compressed', s, s, s).bytes)} B`)
    expect(o).toContain(`${fmt(full - deliveredChainBytes('c509', s, s, s).bytes)} B`)
    expect(o).toContain(fmt(deliveredChainBytes('raw-key', s, s, s).bytes))
    expect(o).toContain(fmt(deliveredChainBytes('mtc', s, s, s, 20).bytes))
    const mixed = chainSizes(
      sigSizesOf('ml-dsa-87'),
      sigSizesOf('ml-dsa-44'),
      sigSizesOf('ml-dsa-44')
    )
    expect(o).toContain(fmt(mixed.intermediate))
  })

  it('5 ble-matter', () => {
    const o = obs('ble-matter')
    expect(o).toContain(`${pbAdvSegments(65).segments} PB-ADV segments`)
    expect(o).toContain(
      `${pbAdvSegments(1184 + 1).segments} segments and its ciphertext ${pbAdvSegments(1088 + 1).segments}`
    )
    expect(o).toContain(
      `${pbAdvSegments(1216 + 1).segments} and ${pbAdvSegments(1120 + 1).segments}`
    )
    expect(o).toContain(fmt(uniformChain('ml-dsa-44').sent))
    expect(o).toContain(fmt(uniformChain('ecdsa-p256').sent))
    expect(SCENARIOS.findIndex((s) => s.id === 'ble-matter')).toBe(4) // "Exercise 5"
    expect(SCENARIOS[4].config).toMatchObject({ step: 2, view: 'provisioning' })
  })

  it('6 fleet-bottleneck', () => {
    const o = obs('fleet-bottleneck')
    const r = computeRotationPlan(DEFAULT_FLEET)
    expect(o).toContain(`about ${Math.round(r.networkHoursPerCell * 60)} minutes`)
    expect(o).toContain(`about ${r.hsmHours.toFixed(1)} hours`)
    expect(o).toContain(fmt(r.pqcBytesPerDevice))
    expect(o).toContain(`${r.sizeMultiplier!.toFixed(1)}×`)
    expect(r.bottleneck).toBe('hsm')
  })

  it('7 lpwan-multicast', () => {
    const o = obs('lpwan-multicast')
    const base = {
      techId: 'nbiot' as const,
      firmwareBytes: 150 * 1024,
      keyBytes: 0,
      devicesPerCell: 2000,
      hops: 3,
      windowHours: 24,
    }
    const pq = firmwareAirtime({ ...base, signatureBytes: 4627, multicast: false })
    const ec = firmwareAirtime({ ...base, signatureBytes: 64, multicast: false })
    const mc = firmwareAirtime({ ...base, signatureBytes: 4627, multicast: true })
    expect(o).toContain(`${(pq.signatureShare * 100).toFixed(1)}%`)
    expect(o).toContain(`about ${Math.round(pq.cellHours)} hours`)
    expect(o).toContain(`about ${Math.round(ec.cellHours)} hours`)
    expect(pq.fitsWindow || ec.fitsWindow).toBe(false)
    expect(mc.cellHours * 60).toBeLessThan(2)
  })
})

describe('audit regressions (I1-I24) stay fixed in Learn, exercises and the RAG summary', () => {
  const BANNED: [RegExp, string][] = [
    [/180\s*KB/, 'I1 FrodoKEM 180 KB'],
    [/690 max|690 B max/, 'I9 FN-DSA "690 max"'],
    [/65,535/, 'I15 MQTT payload limit'],
    [/Class 3\+/, 'I12 RFC 7228 "Class 3+"'],
    [/SUIT manifest \(RFC 9019\)/, 'I13 SUIT = RFC 9019'],
    [/BSI-preferred/, 'I24 XMSS BSI-preferred'],
    [/both (algorithms|components) remain unbroken/, 'I19 hybrid "both"'],
    [/doubles the resource cost/, 'I19 hybrid doubles'],
    [/fastest PQC verifier/i, 'I10 LMS fastest verifier'],
    [/IEC 62443 \+ FIPS/, 'I23 KAT label'],
    [/draft-ietf-tls-merkle-tree-certs/, 'I17 stale MTC draft name'],
    [/~300 bytes vs ~3 KB/, 'I17 MTC proof size'],
    [/Purdue|SCADA Migration Planner|V2X Broadcast|DSRC/, 'content moved out of IoT'],
  ]
  it.each(BANNED)('%s (%s)', (re) => {
    expect(introSource).not.toMatch(re)
    expect(exercisesSource).not.toMatch(re)
    expect(ragSummary).not.toMatch(re)
  })
})
