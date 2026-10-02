// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Algorithm Explorer's fit verdicts are computed from benchmark stack +
 * buffers (utils/sizing.ts assessFit), and the summary and Learn prose are
 * generated from the same function — there is no hand-written fit table or
 * per-class prose left to drift. These tests pin the model's invariants and
 * the specific audit findings it resolves (I6, I7, I8, I12).
 *
 * History: the pre-split module kept a hand-maintained suitableForClass array
 * next to hand-written guidance; FrodoKEM-640 was once shown at 180 KB and
 * "ML-KEM-768 exceeds Class 1" survived until the 2026-10-01 audit.
 */
import { describe, it, expect } from 'vitest'
import { CONSTRAINED_ALGORITHMS, DEVICE_CLASSES, algorithmById } from './constants'
import { assessFit, fitSummary, type DeviceRole } from './utils/sizing'

const ROLES: DeviceRole[] = ['verify', 'sign', 'kem']
const BUILDS = ['stack', 'speed'] as const

describe('device classes', () => {
  it('lists RFC 7228 Classes 0-2 and the 7228bis Classes 3-4, in increasing size', () => {
    expect(DEVICE_CLASSES.map((c) => c.name)).toEqual([
      'Class 0',
      'Class 1',
      'Class 2',
      'Class 3',
      'Class 4',
    ])
    expect(DEVICE_CLASSES.slice(0, 3).every((c) => c.definedIn === 'RFC 7228')).toBe(true)
    expect(DEVICE_CLASSES.slice(3).every((c) => c.definedIn === 'draft-ietf-iotops-7228bis')).toBe(
      true
    )
    for (let i = 1; i < DEVICE_CLASSES.length; i++) {
      expect(DEVICE_CLASSES[i].ramBytes).toBeGreaterThan(DEVICE_CLASSES[i - 1].ramBytes)
      expect(DEVICE_CLASSES[i].flashBytes).toBeGreaterThan(DEVICE_CLASSES[i - 1].flashBytes)
    }
  })
})

describe('fit model', () => {
  it('a "fits" or "tight" verdict never exceeds the class RAM', () => {
    for (const alg of CONSTRAINED_ALGORITHMS)
      for (let c = 0; c < DEVICE_CLASSES.length; c++)
        for (const r of ROLES)
          for (const b of BUILDS) {
            const f = assessFit(alg, c, r, b)
            if (!f.applicable || f.verdict === 'too-large') continue
            expect(f.peakBytes, `${alg.id} ${r} ${b} class ${c}`).toBeLessThanOrEqual(
              DEVICE_CLASSES[c].ramBytes
            )
          }
  })

  it('is monotonic: anything that fits a class fits every larger class', () => {
    const rank = { fits: 0, tight: 1, 'too-large': 2 }
    for (const alg of CONSTRAINED_ALGORITHMS)
      for (const r of ROLES)
        for (const b of BUILDS)
          for (let c = 1; c < DEVICE_CLASSES.length; c++) {
            const prev = assessFit(alg, c - 1, r, b)
            const cur = assessFit(alg, c, r, b)
            if (!cur.applicable) continue
            expect(rank[cur.verdict], `${alg.id} ${r} ${b} ${c}`).toBeLessThanOrEqual(
              rank[prev.verdict]
            )
          }
  })

  it('peak = benchmark stack + the buffers the role holds', () => {
    const a = algorithmById('ml-dsa-44')
    const f = assessFit(a, 1, 'verify', 'stack')
    expect(f.stackBytes).toBe(a.builds.stack.ops.verify!.stackBytes)
    expect(f.bufferBytes).toBe(a.publicKeyBytes + a.outputBytes)
    expect(f.peakBytes).toBe(f.stackBytes + f.bufferBytes)
  })

  it('I6: ML-KEM-768 fits Class 1 with the stack build, not with the speed build', () => {
    const a = algorithmById('ml-kem-768')
    expect(assessFit(a, 1, 'kem', 'stack').verdict).not.toBe('too-large')
    expect(assessFit(a, 1, 'kem', 'speed').verdict).toBe('too-large')
  })

  it('I7: ML-DSA-44 verify and sign are separate figures', () => {
    const a = algorithmById('ml-dsa-44')
    const v = assessFit(a, 1, 'verify', 'stack')
    const s = assessFit(a, 1, 'sign', 'stack')
    expect(v.stackBytes).toBeLessThan(s.stackBytes)
  })

  it('I8: FN-DSA-512 verifies on Class 1 but cannot sign there', () => {
    const a = algorithmById('fn-dsa-512')
    expect(assessFit(a, 1, 'verify', 'stack').verdict).toBe('fits')
    const sign = assessFit(a, 1, 'sign', 'stack')
    expect(sign.verdict).toBe('too-large')
    expect(sign.stackBytes).toBeGreaterThan(40_000)
    expect(sign.codeBytes).toBeGreaterThan(100_000)
  })

  it('I1: FrodoKEM-640 uses the measured pqm4 figures, not 180 KB, and fits only Class 4', () => {
    const a = algorithmById('frodokem-640')
    expect(a.builds.stack.ops.decaps!.stackBytes).toBeLessThan(100_000)
    const verdicts = DEVICE_CLASSES.map((_, c) => assessFit(a, c, 'kem', 'stack').verdict)
    expect(verdicts.slice(0, 4).every((v) => v === 'too-large')).toBe(true)
    expect(verdicts[4]).not.toBe('too-large')
  })

  it('Class 0 fits nothing — those devices rely on a gateway', () => {
    for (const r of ROLES) {
      const s = fitSummary(0, r, 'stack')
      expect(s.fits).toEqual([])
      expect(s.tight).toEqual([])
    }
  })

  it('the explorer renders its summary from fitSummary, not from per-class literals', async () => {
    const src = (await import('./workshop/ConstrainedAlgorithmExplorer.tsx?raw')).default as string
    expect(src).toContain('fitSummary(')
    expect(src).not.toMatch(/selectedClassIdx === \d+ &&\s*'/)
  })
})
