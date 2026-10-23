// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The NIST ACVP-Server LMS sigVer samples shown in the Stateful Signatures workshop panel.
 *
 *  1. The vendored file is what its provenance says: pinned commit, upstream
 *     paths and hashes recorded for both sample folders, nothing renamed.
 *  2. Its expected results agree with an independent verifier written from RFC 8554
 *     (below, node:crypto SHA-256 truncated to 192 bits as SP 800-208 defines), so a
 *     wrong flag in the sample, or a wrong reading of the format, would show here
 *     without involving the engine.
 *  3. The runner compares the engine's answer with NIST's expected result: a
 *     disagreement is a fail, an unexpected return value or an exception is an error,
 *     never a pass. (The real-engine replay is lmsAcvpSigVer.local.test.ts.)
 */
import { createHash } from 'node:crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import sample from '../data/lmsAcvpSigVerSample.json'
import { hsm_importStatefulPublicKey, hsm_statefulVerifyBytes } from '@/wasm/softhsm'
import { CKR_SIGNATURE_INVALID, CKR_SIGNATURE_LEN_RANGE } from '@/wasm/softhsm/constants'
import { runLmsSigVerSample } from './lmsAcvpSigVer'

vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_importStatefulPublicKey: vi.fn(() => 7),
  hsm_statefulVerifyBytes: vi.fn(),
}))

const PINNED_COMMIT = '975de31eb83d87039ec88934fdc47d8c312b892d'
const allCases = sample.testGroups.flatMap((g) => g.tests.map((t) => ({ g, t })))
const hex = (s: string) => Uint8Array.from(Buffer.from(s, 'hex'))

describe('vendored NIST LMS sigVer samples', () => {
  it('records its upstream identity for both sample folders', () => {
    const p = sample._provenance
    expect(p.commit).toBe(PINNED_COMMIT)
    expect(p.evidenceClass).toBe('nist-acvp-reference-sample')
    expect(p.files.map((f) => f.upstreamPath)).toEqual(
      ['LMS-sigVer-SP800-208', 'LMS-sigVer-1.0'].flatMap((d) =>
        ['prompt', 'expectedResults', 'internalProjection'].map(
          (f) => `gen-val/json-files/${d}/${f}.json`
        )
      )
    )
    for (const f of p.files) {
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(f.gitBlobSha).toMatch(/^[0-9a-f]{40}$/)
      expect(f.sourceUrl).toBe(
        `https://raw.githubusercontent.com/usnistgov/ACVP-Server/${PINNED_COMMIT}/${f.upstreamPath}`
      )
    }
    expect(p.specification.url).toBe('https://pages.nist.gov/ACVP/draft-celi-acvp-lms.txt')
    expect(p.note).toMatch(/not vectors issued by an ACVTS session/)
  })

  it('holds all 16 cases of the two folders: valid and must-fail in every group', () => {
    expect(allCases).toHaveLength(16)
    expect(sample.testGroups.map((g) => [g.revision, g.tgId, g.lmsMode, g.lmOtsMode])).toEqual([
      ['SP800-208', 1, 'LMS_SHA256_M24_H5', 'LMOTS_SHA256_N24_W1'],
      ['SP800-208', 2, 'LMS_SHA256_M24_H10', 'LMOTS_SHA256_N24_W2'],
      ['1.0', 1, 'LMS_SHA256_M24_H5', 'LMOTS_SHA256_N24_W1'],
      ['1.0', 2, 'LMS_SHA256_M24_H10', 'LMOTS_SHA256_N24_W2'],
    ])
    for (const g of sample.testGroups) {
      expect(g.testType).toBe('AFT')
      expect(g.tests.filter((t) => t.testPassed)).toHaveLength(1)
      expect(g.tests.filter((t) => !t.testPassed)).toHaveLength(3)
    }
    const reasons = new Set(allCases.map(({ t }) => t.reason))
    for (const r of [
      'no modification',
      'modify message',
      'modify signature',
      'modify signature header',
    ])
      expect(reasons.has(r), r).toBe(true)
    for (const { g, t } of allCases)
      expect(t.testPassed, `${g.revision} tg${g.tgId}/tc${t.tcId}`).toBe(
        t.reason === 'no modification'
      )
  })

  it('has hex in the case NIST wrote it and a message length that matches (where NIST gives one)', () => {
    for (const { g, t } of allCases) {
      const where = `${g.revision} tg${g.tgId}/tc${t.tcId}`
      expect(g.publicKey + t.message + t.signature, where).toMatch(/^[0-9A-F]*$/)
      if ('messageLength' in t) expect(t.message.length * 4, where).toBe(t.messageLength)
    }
  })
})

// ── An independent LMS verifier, from RFC 8554 Algorithms 4b and 6a ──────────

const H24 = (...parts: Uint8Array[]): Buffer =>
  createHash('sha256').update(Buffer.concat(parts)).digest().subarray(0, 24)
const u32 = (n: number) =>
  Buffer.from([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255])
const u16 = (n: number) => Buffer.from([(n >>> 8) & 255, n & 255])

// SP 800-208 Table 3: n = 24, parameter p and checksum shift ls (RFC 8554 Section 4.1) per w
const OTS = {
  5: { w: 1, p: 200, ls: 8 },
  6: { w: 2, p: 101, ls: 6 },
  7: { w: 4, p: 51, ls: 4 },
  8: { w: 8, p: 26, ls: 0 },
} as Record<number, { w: number; p: number; ls: number }>
const LMS_H: Record<number, number> = { 10: 5, 11: 10, 12: 15, 13: 20, 14: 25 }

const coef = (s: Uint8Array, i: number, w: number) =>
  (s[Math.floor((i * w) / 8)] >> (8 - w * ((i % (8 / w)) + 1))) & ((1 << w) - 1)

function lmsVerify(pub: Buffer, msg: Buffer, sig: Buffer): boolean {
  const n = 24
  const lmsType = pub.readUInt32BE(0)
  const otsType = pub.readUInt32BE(4)
  const h = LMS_H[lmsType]
  const ots = OTS[otsType]
  if (!h || !ots || pub.length !== 24 + n) return false
  const I = pub.subarray(8, 24)
  const T1 = pub.subarray(24)
  if (sig.length !== 12 + n * (ots.p + 1) + n * h) return false
  const q = sig.readUInt32BE(0)
  const otsLen = 4 + n + ots.p * n
  const otsSig = sig.subarray(4, 4 + otsLen)
  if (sig.readUInt32BE(4 + otsLen) !== lmsType || otsSig.readUInt32BE(0) !== otsType) return false
  if (q >= 2 ** h) return false
  const C = otsSig.subarray(4, 4 + n)
  const Q = H24(I, u32(q), u16(0x8181), C, msg)
  let sum = 0
  for (let i = 0; i < (8 * n) / ots.w; i++) sum += (1 << ots.w) - 1 - coef(Q, i, ots.w)
  const Qc = Buffer.concat([Q, u16((sum << ots.ls) & 0xffff)])
  const zs: Buffer[] = []
  for (let i = 0; i < ots.p; i++) {
    let tmp: Buffer = Buffer.from(otsSig.subarray(4 + n + i * n, 4 + n + (i + 1) * n))
    for (let j = coef(Qc, i, ots.w); j < (1 << ots.w) - 1; j++)
      tmp = H24(I, u32(q), u16(i), Buffer.from([j]), tmp)
    zs.push(tmp)
  }
  const Kc = H24(I, u32(q), u16(0x8080), ...zs)
  let node = 2 ** h + q
  let tmp: Buffer = H24(I, u32(node), u16(0x8282), Kc)
  for (let i = 0; i < h; i++) {
    const sib = sig.subarray(8 + otsLen + i * n, 8 + otsLen + (i + 1) * n)
    tmp =
      node % 2 === 1
        ? H24(I, u32(Math.floor(node / 2)), u16(0x8383), sib, tmp)
        : H24(I, u32(Math.floor(node / 2)), u16(0x8383), tmp, sib)
    node = Math.floor(node / 2)
  }
  return tmp.equals(T1)
}

describe('an independent RFC 8554 verifier', () => {
  it('agrees with NIST on all 16 cases (valid accepted, every modified one rejected)', () => {
    for (const { g, t } of allCases)
      expect(
        lmsVerify(
          Buffer.from(g.publicKey, 'hex'),
          Buffer.from(t.message, 'hex'),
          Buffer.from(t.signature, 'hex')
        ),
        `${g.revision} tg${g.tgId}/tc${t.tcId} (${t.reason})`
      ).toBe(t.testPassed)
  })

  it('is not a verifier that accepts everything: flipping one message bit of a valid case turns it down', () => {
    const { g, t } = allCases.find(({ t }) => t.testPassed)!
    const msg = Buffer.from(t.message, 'hex')
    msg[0] ^= 1
    expect(lmsVerify(Buffer.from(g.publicKey, 'hex'), msg, Buffer.from(t.signature, 'hex'))).toBe(
      false
    )
  })
})

describe('runLmsSigVerSample', () => {
  const M = { _C_DestroyObject: vi.fn() } as unknown as SoftHSMModule
  const verify = vi.mocked(hsm_statefulVerifyBytes)
  const importKey = vi.mocked(hsm_importStatefulPublicKey)
  const OK = 0

  beforeEach(() => {
    verify.mockReset()
    importKey.mockClear()
    vi.mocked(M._C_DestroyObject).mockClear()
  })

  /** An engine that agrees with NIST on every case, except those listed (positions in run order). */
  const engine = (disagree: number[] = []) => {
    const queue = allCases.map(({ t }, i) =>
      t.testPassed !== disagree.includes(i) ? OK : CKR_SIGNATURE_INVALID
    )
    verify.mockImplementation(() => queue.shift() as number)
  }

  it('passes every case when the engine answers as NIST expects', async () => {
    engine()
    const out = await runLmsSigVerSample(M, 1)
    expect(out).toHaveLength(16)
    expect(out.every((r) => r.status === 'pass')).toBe(true)
    expect(out.filter((r) => r.accepted)).toHaveLength(4)
    expect(M._C_DestroyObject).toHaveBeenCalledTimes(16)
  })

  it('sends NIST’s key and signature unchanged behind the one-level HSS prefixes, and NIST’s message as is', async () => {
    engine()
    await runLmsSigVerSample(M, 1)
    const { g, t } = allCases[0]
    const key = importKey.mock.calls[0][3]
    expect(Array.from(key.subarray(0, 4))).toEqual([0, 0, 0, 1])
    expect(Array.from(key.subarray(4))).toEqual(Array.from(hex(g.publicKey)))
    const call = verify.mock.calls[0]
    expect(Array.from(call[4] as Uint8Array)).toEqual(Array.from(hex(t.message)))
    const sig = call[5]
    expect(Array.from(sig.subarray(0, 4))).toEqual([0, 0, 0, 0])
    expect(Array.from(sig.subarray(4))).toEqual(Array.from(hex(t.signature)))
  })

  it('counts CKR_SIGNATURE_LEN_RANGE as a rejection, like CKR_SIGNATURE_INVALID', async () => {
    const queue = allCases.map(({ t }) => (t.testPassed ? OK : CKR_SIGNATURE_LEN_RANGE))
    verify.mockImplementation(() => queue.shift() as number)
    const out = await runLmsSigVerSample(M, 1)
    expect(out.every((r) => r.status === 'pass')).toBe(true)
    expect(out.find((r) => !r.testPassed)!.returned).toBe('CKR_SIGNATURE_LEN_RANGE')
  })

  it('fails exactly the cases where the engine disagrees with NIST (accepting an invalid one, rejecting a valid one)', async () => {
    const valid = allCases.findIndex(({ t }) => t.testPassed)
    const invalid = allCases.findIndex(({ t }) => !t.testPassed)
    engine([valid, invalid])
    const out = await runLmsSigVerSample(M, 1)
    expect(out.map((r, i) => (r.status === 'fail' ? i : -1)).filter((i) => i >= 0)).toEqual([
      valid,
      invalid,
    ])
    expect(out[invalid].details).toMatch(/ACCEPTED/)
    expect(out[valid].details).toMatch(/REJECTED/)
    expect(out.filter((r) => r.status === 'pass')).toHaveLength(14)
  })

  it('reports any other return value as an error, never as a successful rejection', async () => {
    verify.mockImplementation(() => 0x5) // CKR_GENERAL_ERROR
    const out = await runLmsSigVerSample(M, 1)
    expect(out.every((r) => r.status === 'error' && r.accepted === null)).toBe(true)
    expect(out[0].details).toMatch(/neither acceptance nor an invalid-signature answer/)
  })

  it('reports an exception from the engine as an error', async () => {
    verify.mockImplementation(() => {
      throw new Error('engine unavailable')
    })
    const out = await runLmsSigVerSample(M, 1)
    expect(out.every((r) => r.status === 'error' && r.accepted === null)).toBe(true)
    expect(out[0].details).toMatch(/engine unavailable/)
  })
})
