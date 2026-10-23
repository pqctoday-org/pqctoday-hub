// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The NIST ACVP-Server SLH-DSA sigVer sample shown in the SLH-DSA workshop panel.
 *
 *  1. The vendored file is what its provenance says: pinned commit, upstream
 *     paths and hashes recorded, nothing renamed. Cases that the shared, manifest-
 *     gated NIST sigVer files (src/data/acvp) also hold are byte-identical there.
 *  2. Every case carries a signature whose length matches its own label, so a
 *     "too small" case cannot silently be a full-length signature.
 *  3. The runner compares the engine's answer with NIST's expected result: a
 *     disagreement is a fail, an engine error is an error, never a pass. (The
 *     real-engine replay is slhdsaAcvpSigVer.local.test.ts.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import sample from '../data/slhdsaAcvpSigVerSample.json'
import sharedSha2 from '@/data/acvp/slhdsa_sigver_sha2_test.json'
import sharedShake from '@/data/acvp/slhdsa_sigver_shake_test.json'
import { hsm_importSLHDSAPublicKey, hsm_slhdsaVerifyBytes } from '@/wasm/softhsm'
import { runSigVerSample } from './slhdsaAcvpSigVer'

vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_importSLHDSAPublicKey: vi.fn(() => 7),
  hsm_slhdsaVerifyBytes: vi.fn(),
}))

const PINNED_COMMIT = '975de31eb83d87039ec88934fdc47d8c312b892d'
const SIG_BYTES = 7856 // FIPS 205 Table 2, SLH-DSA-*-128s
const allCases = sample.testGroups.flatMap((g) => g.tests.map((t) => ({ g, t })))

describe('vendored NIST sigVer sample', () => {
  it('records its upstream identity', () => {
    const p = sample._provenance
    expect(p.commit).toBe(PINNED_COMMIT)
    expect(p.evidenceClass).toBe('nist-acvp-reference-sample')
    expect(p.files.map((f) => f.upstreamPath)).toEqual([
      'gen-val/json-files/SLH-DSA-sigVer-FIPS205/prompt.json',
      'gen-val/json-files/SLH-DSA-sigVer-FIPS205/expectedResults.json',
      'gen-val/json-files/SLH-DSA-sigVer-FIPS205/internalProjection.json',
    ])
    for (const f of p.files) {
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(f.gitBlobSha).toMatch(/^[0-9a-f]{40}$/)
      expect(f.sourceUrl).toBe(
        `https://raw.githubusercontent.com/usnistgov/ACVP-Server/${PINNED_COMMIT}/${f.upstreamPath}`
      )
    }
    expect(p.note).toMatch(/not vectors issued by an ACVTS session/)
  })

  it('names the same upstream internal projection as the shared NIST sigVer files', () => {
    const internal = sample._provenance.files[2]
    for (const shared of [sharedSha2, sharedShake]) {
      expect(shared._provenance.source_commit).toBe(PINNED_COMMIT)
      expect(shared._provenance.source_sha256).toBe(internal.sha256)
      expect(shared._provenance.source_git_blob_sha).toBe(internal.gitBlobSha)
    }
  })

  it('agrees byte for byte with every case the shared NIST sigVer files also hold', () => {
    const sharedCases = [sharedSha2, sharedShake].flatMap((f) =>
      f.testGroups.flatMap((g) => g.tests.map((t) => ({ tgId: g.tgId, ...t })))
    )
    let overlap = 0
    for (const { g, t } of allCases) {
      const other = sharedCases.find((c) => c.tgId === g.tgId && c.tcId === t.tcId)
      if (!other) continue
      overlap += 1
      expect(other.testPassed, `tg${g.tgId}/tc${t.tcId}`).toBe(t.testPassed)
      expect(other.reason, `tg${g.tgId}/tc${t.tcId}`).toBe(t.reason)
      expect(other.pk, `tg${g.tgId}/tc${t.tcId}`).toBe(t.pk)
      expect(other.message, `tg${g.tgId}/tc${t.tcId}`).toBe(t.message)
      expect(other.signature, `tg${g.tgId}/tc${t.tcId}`).toBe(t.signature)
    }
    expect(overlap).toBeGreaterThan(0)
  })

  it('has 8 cases in 2 pure, external-interface groups, with valid and must-fail cases', () => {
    expect(allCases).toHaveLength(8)
    expect(sample.testGroups.map((g) => g.parameterSet)).toEqual([
      'SLH-DSA-SHA2-128s',
      'SLH-DSA-SHAKE-128s',
    ])
    for (const g of sample.testGroups) {
      expect([g.testType, g.signatureInterface, g.preHash]).toEqual(['AFT', 'external', 'pure'])
      expect(g.tests.some((t) => t.testPassed)).toBe(true)
      expect(g.tests.some((t) => !t.testPassed)).toBe(true)
    }
    const reasons = new Set(allCases.map(({ t }) => t.reason))
    for (const r of [
      'modified message',
      'modified signature - R',
      'modified signature - SIGFORS',
      'invalid signature - too small',
      'invalid signature - too large',
    ])
      expect(reasons.has(r), r).toBe(true)
  })

  it('gives every case a signature of the length its label implies', () => {
    for (const { g, t } of allCases) {
      const n = t.signature.length / 2
      const where = `tg${g.tgId}/tc${t.tcId} (${t.reason})`
      if (/too small/.test(t.reason)) expect(n, where).toBeLessThan(SIG_BYTES)
      else if (/too large/.test(t.reason)) expect(n, where).toBeGreaterThan(SIG_BYTES)
      else expect(n, where).toBe(SIG_BYTES)
      expect(t.testPassed, where).toBe(/^valid signature/.test(t.reason))
      expect(t.pk.length / 2, where).toBe(32)
      expect(t.context.length / 2, where).toBeLessThanOrEqual(255)
      expect(t.pk + t.message + t.context + t.signature, where).toMatch(/^[0-9A-F]*$/)
    }
  })
})

describe('runSigVerSample', () => {
  const M = { _C_DestroyObject: vi.fn() } as unknown as SoftHSMModule
  const verify = vi.mocked(hsm_slhdsaVerifyBytes)

  beforeEach(() => {
    verify.mockReset()
    vi.mocked(hsm_importSLHDSAPublicKey).mockClear()
    vi.mocked(M._C_DestroyObject).mockClear()
  })

  /** An engine that agrees with NIST on every case, except those listed (tcIds). */
  const engine = (disagree: number[] = []) => {
    const queue = allCases.map(({ t }) => t.testPassed !== disagree.includes(t.tcId))
    verify.mockImplementation(() => queue.shift() as boolean)
  }

  it('passes every case when the engine answers as NIST expects', async () => {
    engine()
    const out = await runSigVerSample(M, 1)
    expect(out).toHaveLength(8)
    expect(out.every((r) => r.status === 'pass')).toBe(true)
    expect(out.filter((r) => r.accepted).map((r) => r.tcId)).toEqual(
      allCases.filter(({ t }) => t.testPassed).map(({ t }) => t.tcId)
    )
    // the NIST context and signature reach the engine, and each imported key is destroyed
    const first = verify.mock.calls[0]
    expect(first[5]?.context).toHaveLength(allCases[0].t.context.length / 2)
    expect(first[4]).toHaveLength(SIG_BYTES)
    expect(M._C_DestroyObject).toHaveBeenCalledTimes(8)
  })

  it('fails exactly the cases where the engine disagrees with NIST (accepting an invalid one, rejecting a valid one)', async () => {
    const valid = allCases.find(({ t }) => t.testPassed)!.t.tcId
    const invalid = allCases.find(({ t }) => !t.testPassed)!.t.tcId
    engine([valid, invalid])
    const out = await runSigVerSample(M, 1)
    expect(out.filter((r) => r.status === 'fail').map((r) => r.tcId)).toEqual([valid, invalid])
    expect(out.find((r) => r.tcId === invalid)!.details).toMatch(/ACCEPTED/)
    expect(out.find((r) => r.tcId === valid)!.details).toMatch(/REJECTED/)
    expect(out.filter((r) => r.status === 'pass')).toHaveLength(6)
  })

  it('reports an engine error as an error, never as a successful rejection', async () => {
    const invalid = allCases.find(({ t }) => !t.testPassed)!.t.tcId
    verify.mockImplementation(() => {
      throw new Error('engine unavailable')
    })
    const out = await runSigVerSample(M, 1)
    expect(out.every((r) => r.status === 'error' && r.accepted === null)).toBe(true)
    expect(out.find((r) => r.tcId === invalid)!.details).toMatch(/engine unavailable/)
  })
})
