// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { AMD_SNP_SAMPLE_SOURCE } from '@/data/attestation-samples/amdSnpMilanSample'
import { loadAmdSnpSampleEvidence } from './amdSnpSampleEvidence'
import {
  ChallengeLedger,
  DEFAULT_POLICY,
  RECORDED_CHALLENGE,
  TAMPER_OFFSET_GUEST_SVN,
  buildAttackerEvidence,
  channelEstablished,
  flipBit,
  parseChain,
  parseSnpReport,
  policyWithWrongMeasurement,
  verifySnpEvidence,
  type CheckId,
  type VerificationResult,
} from './amdSnpVerifier'
import { X509Certificate } from '@peculiar/x509'
import { bindingDigest, channelStatement, checkChannelBinding } from './channelBinding'

const NOW = new Date('2026-11-12T00:00:00Z')
const fresh = () => {
  const l = new ChallengeLedger()
  l.issue(RECORDED_CHALLENGE)
  return l
}
const byId = (r: VerificationResult, id: CheckId) => r.checks.find((c) => c.id === id)!
const failing = (r: VerificationResult) => r.checks.filter((c) => !c.passed).map((c) => c.id)

describe('recorded AMD SEV-SNP sample', () => {
  it('embeds the upstream files unchanged', () => {
    const e = loadAmdSnpSampleEvidence()
    expect(bytesToHex(sha256(e.report))).toBe(AMD_SNP_SAMPLE_SOURCE.files.report.sha256)
    expect(bytesToHex(sha256(e.vcekDer))).toBe(AMD_SNP_SAMPLE_SOURCE.files.vcek.sha256)
    expect(bytesToHex(sha256(new TextEncoder().encode(e.chainPem)))).toBe(
      AMD_SNP_SAMPLE_SOURCE.files.chain.sha256
    )
    expect(AMD_SNP_SAMPLE_SOURCE.commit).toBe('a30aab2ec76981a7ab4d6909df57f2ca9051d2b4')
  })

  it('parses the documented fields', () => {
    const r = parseSnpReport(loadAmdSnpSampleEvidence().report)
    expect(r.version).toBe(2)
    expect(r.signatureAlgorithm).toBe(1)
    expect(bytesToHex(r.measurement)).toBe(DEFAULT_POLICY.expectedMeasurementHex)
    expect(bytesToHex(r.reportData.subarray(0, 5))).toBe('0102030405')
    expect(r.reportedTcb).toEqual({ bl: 2, tee: 0, snp: 5, ucode: 68 })
  })
})

describe('1. success path: every real check runs, passes and is attributed', () => {
  it('passes chain, validity, VCEK binding, signature, measurement and challenge', async () => {
    const r = await verifySnpEvidence(loadAmdSnpSampleEvidence(), DEFAULT_POLICY, fresh(), NOW)
    expect(r.checks.map((c) => c.id)).toEqual([
      'chain',
      'validity',
      'vcek-binding',
      'signature',
      'measurement',
      'challenge',
    ])
    for (const c of r.checks) {
      expect(c.ran).toBe(true)
      expect(c.passed, `${c.id}: ${c.detail}`).toBe(true)
      expect(c.attributedTo.length).toBeGreaterThan(10)
    }
    expect(r.allPassed).toBe(true)
  })
})

describe('2. replayed challenge fails on that check alone', () => {
  it('second presentation of the same report is rejected as a replay', async () => {
    const ledger = fresh()
    const ev = loadAmdSnpSampleEvidence()
    expect((await verifySnpEvidence(ev, DEFAULT_POLICY, ledger, NOW)).allPassed).toBe(true)
    const again = await verifySnpEvidence(ev, DEFAULT_POLICY, ledger, NOW)
    expect(failing(again)).toEqual(['challenge'])
    expect(byId(again, 'challenge').detail).toMatch(/replay/)
    expect(byId(again, 'signature').passed).toBe(true)
    expect(byId(again, 'chain').passed).toBe(true)
  })

  it('a challenge the verifier never issued is rejected', async () => {
    const ledger = new ChallengeLedger()
    ledger.issue(new Uint8Array(64).fill(9))
    const r = await verifySnpEvidence(loadAmdSnpSampleEvidence(), DEFAULT_POLICY, ledger, NOW)
    expect(failing(r)).toEqual(['challenge'])
    expect(byId(r, 'challenge').detail).toMatch(/not the challenge this verifier issued/)
  })
})

describe('3. valid signature on the wrong measurement fails on the measurement alone', () => {
  it('rejects a policy that differs by one bit', async () => {
    const r = await verifySnpEvidence(
      loadAmdSnpSampleEvidence(),
      policyWithWrongMeasurement(DEFAULT_POLICY),
      fresh(),
      NOW
    )
    expect(failing(r)).toEqual(['measurement'])
    expect(byId(r, 'signature').passed).toBe(true)
    expect(byId(r, 'chain').passed).toBe(true)
  })
})

describe('4. a valid attacker-key signature fails the trust-root check', () => {
  it('signature verifies under the attacker key, the chain does not reach the pinned ARK', async () => {
    const forged = await buildAttackerEvidence(loadAmdSnpSampleEvidence())
    const r = await verifySnpEvidence(forged, DEFAULT_POLICY, fresh(), NOW)
    expect(byId(r, 'signature').passed).toBe(true)
    expect(byId(r, 'chain').passed).toBe(false)
    expect(byId(r, 'chain').detail).toMatch(/VCEK signed by ASK: FAIL/)
    // The issuer name is the real ASK's, so the failure comes from the signature check.
    const parsed = new X509Certificate(forged.vcekDer.slice().buffer as ArrayBuffer)
    expect(parsed.issuer).toBe(parseChain(forged.chainPem).ask.subject)
    expect(byId(r, 'vcek-binding').passed).toBe(true)
    expect(failing(r)).toEqual(['chain'])
    expect(r.allPassed).toBe(false)
  })

  it('a real VCEK with one bit changed in its signed content or its signature fails the chain only', async () => {
    const real = loadAmdSnpSampleEvidence()
    const at = bytesToHex(real.vcekDer).indexOf(bytesToHex(new TextEncoder().encode('SEV-VCEK')))
    expect(at).toBeGreaterThan(0)
    for (const offset of [at / 2, real.vcekDer.length - 5]) {
      const vcekDer = Uint8Array.from(real.vcekDer)
      vcekDer[offset] ^= 1
      const r = await verifySnpEvidence({ ...real, vcekDer }, DEFAULT_POLICY, fresh(), NOW)
      expect(byId(r, 'chain').passed, `offset ${offset}`).toBe(false)
      expect(byId(r, 'chain').detail).toMatch(/ARK self-signed: ok.*ASK signed by ARK: ok/)
    }
  })

  it('a different pinned root rejects the genuine chain too', async () => {
    const r = await verifySnpEvidence(
      loadAmdSnpSampleEvidence(),
      { ...DEFAULT_POLICY, arkSha256: '0'.repeat(64) },
      fresh(),
      NOW
    )
    expect(failing(r)).toEqual(['chain'])
    expect(byId(r, 'chain').detail).toMatch(/pinned root.*FAIL/)
  })
})

describe('6. tampered bytes fail the signature and nothing else', () => {
  it('flipping one bit of the signed body fails only the signature check', async () => {
    const r = await verifySnpEvidence(
      flipBit(loadAmdSnpSampleEvidence(), TAMPER_OFFSET_GUEST_SVN),
      DEFAULT_POLICY,
      fresh(),
      NOW
    )
    expect(failing(r)).toEqual(['signature'])
  })

  it('flipping a bit in report_data fails the signature and the challenge, each on its own', async () => {
    const r = await verifySnpEvidence(
      flipBit(loadAmdSnpSampleEvidence(), 0x50),
      DEFAULT_POLICY,
      fresh(),
      NOW
    )
    expect(failing(r)).toEqual(['signature', 'challenge'])
  })

  it('flipping a bit of the signature itself fails the signature', async () => {
    const r = await verifySnpEvidence(
      flipBit(loadAmdSnpSampleEvidence(), 0x2a0),
      DEFAULT_POLICY,
      fresh(),
      NOW
    )
    expect(failing(r)).toEqual(['signature'])
  })

  it('an expired evaluation time fails the validity check only', async () => {
    const r = await verifySnpEvidence(
      loadAmdSnpSampleEvidence(),
      DEFAULT_POLICY,
      fresh(),
      new Date('2031-01-01T00:00:00Z')
    )
    expect(failing(r)).toEqual(['validity'])
  })
})

describe('5. channel binding (simulated report_data)', () => {
  const kp = ml_kem768.keygen()
  const other = ml_kem768.keygen()
  const context = 'tee-hsm-kek-v1'
  const reportData = bindingDigest(kp.publicKey, RECORDED_CHALLENGE, context)
  const enc = ml_kem768.encapsulate(kp.publicKey)
  const committed = channelStatement(reportData, enc.cipherText)
  const input = {
    reportData,
    recipientEk: kp.publicKey,
    challenge: RECORDED_CHALLENGE,
    context,
    ciphertext: enc.cipherText,
    committedStatement: committed,
  }

  it('passes for the right key and the committed ciphertext', () => {
    const r = checkChannelBinding(input)
    expect(r.passed).toBe(true)
    expect(r.checks.map((c) => c.id)).toEqual(['key-binding', 'ciphertext-binding'])
    expect(r.checks.every((c) => c.simulated && c.ran)).toBe(true)
  })

  it('fails the key binding for a wrong recipient key', () => {
    const r = checkChannelBinding({ ...input, recipientEk: other.publicKey })
    expect(r.checks.find((c) => c.id === 'key-binding')!.passed).toBe(false)
    expect(r.passed).toBe(false)
  })

  it('fails the ciphertext binding for a different ciphertext of the same length', () => {
    const swapped = ml_kem768.encapsulate(kp.publicKey).cipherText
    expect(swapped.length).toBe(enc.cipherText.length)
    expect(bytesToHex(swapped)).not.toBe(bytesToHex(enc.cipherText))
    const r = checkChannelBinding({ ...input, ciphertext: swapped })
    expect(r.checks.find((c) => c.id === 'ciphertext-binding')!.passed).toBe(false)
    expect(r.checks.find((c) => c.id === 'key-binding')!.passed).toBe(true)
  })

  it('fails the key binding for a different challenge or context', () => {
    expect(checkChannelBinding({ ...input, challenge: new Uint8Array(64).fill(7) }).passed).toBe(
      false
    )
    expect(checkChannelBinding({ ...input, context: 'other-context' }).passed).toBe(false)
  })

  it('rejects malformed key or challenge lengths instead of hashing them', () => {
    expect(() => bindingDigest(new Uint8Array(32), RECORDED_CHALLENGE, context)).toThrow()
    expect(() => bindingDigest(kp.publicKey, new Uint8Array(8), context)).toThrow()
  })
})

describe('7. every check must run, pass and be attributed before a channel is established', () => {
  const ok = checkChannelBinding(
    (() => {
      const kp = ml_kem768.keygen()
      const rd = bindingDigest(kp.publicKey, RECORDED_CHALLENGE, 'c')
      const ct = ml_kem768.encapsulate(kp.publicKey).cipherText
      return {
        reportData: rd,
        recipientEk: kp.publicKey,
        challenge: RECORDED_CHALLENGE,
        context: 'c',
        ciphertext: ct,
        committedStatement: channelStatement(rd, ct),
      }
    })()
  )

  it('establishes only when all real checks and both binding checks pass', async () => {
    const r = await verifySnpEvidence(loadAmdSnpSampleEvidence(), DEFAULT_POLICY, fresh(), NOW)
    expect(channelEstablished(r, ok.checks)).toEqual({ established: true, missing: [], failed: [] })
  })

  it('a signature pass alone cannot establish the channel', async () => {
    const r = await verifySnpEvidence(loadAmdSnpSampleEvidence(), DEFAULT_POLICY, fresh(), NOW)
    const sigOnly = { checks: r.checks.filter((c) => c.id === 'signature') }
    const res = channelEstablished(sigOnly, [])
    expect(res.established).toBe(false)
    expect(res.missing).toEqual(
      expect.arrayContaining([
        'chain',
        'measurement',
        'challenge',
        'key-binding',
        'ciphertext-binding',
      ])
    )
  })

  it('one failed check stops it and names the check', async () => {
    const r = await verifySnpEvidence(
      loadAmdSnpSampleEvidence(),
      policyWithWrongMeasurement(DEFAULT_POLICY),
      fresh(),
      NOW
    )
    expect(channelEstablished(r, ok.checks)).toMatchObject({
      established: false,
      failed: ['measurement'],
    })
  })
})
