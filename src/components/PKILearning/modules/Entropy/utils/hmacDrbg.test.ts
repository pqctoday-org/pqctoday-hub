// SPDX-License-Identifier: GPL-3.0-only
//
// Known-answer tests for the Entropy module's HMAC_DRBG (SHA-256).
//
// The vectors are NIST's, pinned in hmacDrbgSha256.kat.json with their
// provenance: a subset of usnistgov/ACVP-Server gen-val/json-files/hmacDRBG-1.0
// (prompt.json + expectedResults.json @ 975de31e) plus a subset of the NIST CAVP
// HMAC_DRBG.rsp files for the cases ACVP's SHA2-256 groups do not cover (empty
// personalization string, empty additional input, no reseed).
//
// Every assertion is a byte-equal comparison against a published answer. The
// sabotage block flips ONE bit in each kind of input and requires the output to
// stop matching — a stub that ignored that input would pass the plain KATs but
// fail here.
import { describe, it, expect } from 'vitest'
import fixture from './hmacDrbgSha256.kat.json'
import {
  bytesToHex,
  hexToBytes,
  hmacDrbgGenerate,
  hmacDrbgInstantiate,
  runHmacDrbgKatCase,
  runHmacDrbgKatSuite,
  sabotageVariants,
  type HmacDrbgKatCase,
  type HmacDrbgKatStep,
} from './hmacDrbg'

const CASES = fixture.cases as HmacDrbgKatCase[]

function byId(id: string): HmacDrbgKatCase {
  const c = CASES.find((x) => x.id === id)
  if (!c) throw new Error(`fixture case ${id} missing`)
  return c
}

/** Flip the least-significant bit of the first byte of a hex string. */
function flipBit(hex: string): string {
  expect(hex.length).toBeGreaterThan(0)
  const b = hexToBytes(hex)
  b[0] ^= 0x01
  return bytesToHex(b)
}

function clone(c: HmacDrbgKatCase): HmacDrbgKatCase {
  return JSON.parse(JSON.stringify(c)) as HmacDrbgKatCase
}

describe('HMAC_DRBG fixture provenance', () => {
  it('records the upstream commit, file hashes and subset policy', () => {
    const p = fixture._provenance
    const acvp = p.sources.find((s) => s.id === 'acvp')!
    const cavp = p.sources.find((s) => s.id === 'cavp')!
    expect(acvp.commit).toBe('975de31eb83d87039ec88934fdc47d8c312b892d')
    expect(acvp.files.map((f) => f.sha256)).toEqual([
      '3613b3b990904ed9c98ea05ce223e660e29d45f370b03618e0e4cc8c0c43e004', // prompt.json
      '0d3a6e0d7bed5ef84ab9f2a27a0ad04b9478b38617ade7c9d9cd058a7a7f6598', // expectedResults.json
    ])
    expect(cavp.zipSha256).toBe('5f7e5658ebd5b4e6785a7b12fa32333511d2acc2f2d9c5ae1ffa16b699377769')
    expect(p.retrieved).toBe('2026-09-24')
  })

  it('covers prediction resistance on/off, reseed, and empty/non-empty inputs', () => {
    expect(CASES.some((c) => c.predictionResistance)).toBe(true)
    expect(CASES.some((c) => !c.predictionResistance)).toBe(true)
    expect(CASES.some((c) => c.steps.some((s) => s.op === 'reseed'))).toBe(true)
    expect(CASES.some((c) => c.steps.every((s) => s.op === 'generate'))).toBe(true)
    expect(CASES.some((c) => c.personalizationString === '')).toBe(true)
    expect(CASES.some((c) => c.personalizationString !== '')).toBe(true)
    expect(CASES.some((c) => c.steps.every((s) => s.additionalInput === ''))).toBe(true)
    expect(CASES.some((c) => c.steps.some((s) => s.additionalInput !== ''))).toBe(true)
    expect(CASES.filter((c) => c.source === 'acvp').length).toBe(4)
    expect(CASES.filter((c) => c.source === 'cavp').length).toBe(12)
  })
})

describe('HMAC_DRBG-SHA-256 — NIST known answers (byte-equal)', () => {
  for (const c of CASES) {
    it(`${c.id} matches the published returnedBits`, async () => {
      const out = await runHmacDrbgKatCase(c)
      expect(out.length * 8).toBe(c.returnedBitsLen)
      expect(bytesToHex(out)).toBe(c.returnedBits.toLowerCase())
    })
  }

  it('runHmacDrbgKatSuite reports every case as passed', async () => {
    const outcomes = await runHmacDrbgKatSuite(CASES)
    expect(outcomes.filter((o) => !o.passed)).toEqual([])
    expect(outcomes).toHaveLength(CASES.length)
  })

  it('runHmacDrbgKatSuite reports a FAIL when the expected answer is wrong', async () => {
    const c = clone(byId('cavp-no-reseed-P0-A0-c0'))
    c.returnedBits = flipBit(c.returnedBits)
    const [o] = await runHmacDrbgKatSuite([c])
    expect(o.passed).toBe(false)
  })
})

describe('HMAC_DRBG sabotage — a one-bit change to any input must break the answer', () => {
  async function expectMismatch(mutated: HmacDrbgKatCase) {
    const out = bytesToHex(await runHmacDrbgKatCase(mutated))
    expect(out).not.toBe(mutated.returnedBits.toLowerCase())
  }

  // ACVP tg14 (no prediction resistance, reseed): every field is non-empty.
  const BASE = 'acvp-tg14-tc196'

  it('entropy input', async () => {
    const c = clone(byId(BASE))
    c.entropyInput = flipBit(c.entropyInput)
    await expectMismatch(c)
  })

  it('nonce', async () => {
    const c = clone(byId(BASE))
    c.nonce = flipBit(c.nonce)
    await expectMismatch(c)
  })

  it('personalization string', async () => {
    const c = clone(byId(BASE))
    c.personalizationString = flipBit(c.personalizationString)
    await expectMismatch(c)
  })

  it('additional input on generate', async () => {
    const c = clone(byId(BASE))
    const gen = c.steps.find((s) => s.op === 'generate')!
    gen.additionalInput = flipBit(gen.additionalInput)
    await expectMismatch(c)
  })

  it('reseed entropy input', async () => {
    const c = clone(byId(BASE))
    const rs = c.steps.find((s) => s.op === 'reseed') as Extract<HmacDrbgKatStep, { op: 'reseed' }>
    rs.entropyInput = flipBit(rs.entropyInput)
    await expectMismatch(c)
  })

  it('reseed additional input', async () => {
    const c = clone(byId(BASE))
    const rs = c.steps.find((s) => s.op === 'reseed') as Extract<HmacDrbgKatStep, { op: 'reseed' }>
    rs.additionalInput = flipBit(rs.additionalInput)
    await expectMismatch(c)
  })

  it('prediction-resistance entropy input (ACVP tg3)', async () => {
    const c = clone(byId('acvp-tg3-tc31'))
    const gen = c.steps[c.steps.length - 1] as Extract<HmacDrbgKatStep, { op: 'generate' }>
    gen.entropyInput = flipBit(gen.entropyInput!)
    await expectMismatch(c)
  })

  it('dropping the reseed step', async () => {
    const c = clone(byId(BASE))
    c.steps = c.steps.filter((s) => s.op !== 'reseed')
    await expectMismatch(c)
  })
})

describe('HMAC_DRBG state rules — SP 800-90A Rev. 1 §10.1.2', () => {
  it('sets reseed_counter to 1 on instantiate and increments it per generate', async () => {
    const s0 = await hmacDrbgInstantiate(new Uint8Array(32), new Uint8Array(16), new Uint8Array(0))
    expect(s0.reseedCounter).toBe(1)
    const r = await hmacDrbgGenerate(s0, 32)
    expect(r.status).toBe('SUCCESS')
    expect(r.state.reseedCounter).toBe(2)
  })

  it('refuses to generate once reseed_counter exceeds reseed_interval (step 1)', async () => {
    let s = await hmacDrbgInstantiate(new Uint8Array(32), new Uint8Array(16), new Uint8Array(0))
    const interval = 3
    for (let i = 0; i < interval; i++) {
      const r = await hmacDrbgGenerate(s, 16, new Uint8Array(0), interval)
      expect(r.status).toBe('SUCCESS')
      s = r.state
    }
    expect(s.reseedCounter).toBe(interval + 1)
    const blocked = await hmacDrbgGenerate(s, 16, new Uint8Array(0), interval)
    expect(blocked.status).toBe('RESEED_REQUIRED')
  })
})

// Review pass 2, L3: the demo flipped only the entropy input. The UI now runs
// sabotageVariants(), which this block checks covers every input kind.
describe('sabotageVariants — the list the demo runs', () => {
  it('covers every input kind across tc196 (reseed) and tg3 tc31 (prediction resistance)', async () => {
    const variants = [byId('acvp-tg14-tc196'), byId('acvp-tg3-tc31')].flatMap((c) =>
      sabotageVariants(c)
    )
    expect(new Set(variants.map((v) => v.input))).toEqual(
      new Set([
        'entropy input',
        'nonce',
        'personalization string',
        'generate additional input',
        'reseed entropy input',
        'reseed additional input',
        'prediction-resistance entropy input',
      ])
    )
    const outcomes = await runHmacDrbgKatSuite(variants.map((v) => v.mutated))
    for (const [i, o] of outcomes.entries()) {
      expect(o.passed, `${variants[i].caseId} / ${variants[i].input}`).toBe(false)
    }
  })

  it('does not mutate the pinned fixture', () => {
    const before = JSON.stringify(byId('acvp-tg14-tc196'))
    sabotageVariants(byId('acvp-tg14-tc196'))
    expect(JSON.stringify(byId('acvp-tg14-tc196'))).toBe(before)
  })
})
