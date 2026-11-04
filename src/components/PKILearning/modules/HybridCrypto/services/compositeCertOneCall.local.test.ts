// SPDX-License-Identifier: AGPL-3.0-only
//
// The composite certificate flow's two ways to sign, on the REAL Rust engine:
//   before 3.3  generateCompositeCert: M' built in the browser, two separate
//               HSM signs (ML-DSA with its context, then the traditional half);
//   after 3.3   generateCompositeCertOneCall: one combined key
//               (CKM_COMP_SIG_KEY_PAIR_GEN) and one C_Sign(CKM_COMP_SIG)
//               over the TBS bytes (PKCS#11 v3.3 working draft).
//
// Both directions, as the JOSE adapter requires of its two backends:
//   - a certificate signed by the one-call path verifies under the existing
//     JavaScript composite verifier (verifyCompositeCert), both components;
//   - a certificate signed by the by-hand path verifies in the engine with
//     C_Verify(CKM_COMP_SIG) over its own TBS bytes;
//   - a corrupted half is rejected by BOTH verifiers (sabotage control).
//
// Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate } from '@peculiar/asn1-x509'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  COMPOSITE_SIG_SETS,
  hsm_compositeVerifyRv,
  hsm_importCompositeKeyRv,
} from '@/wasm/softhsm/v33'
import { hybridCryptoService } from './HybridCryptoService'
import { COMPOSITE_PROFILE_CHOICES } from './certBuilder'
import { verifyCompositeCert } from './compositeVerifier'

const pemToDer = (pem: string): Uint8Array => {
  const b64 = pem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s+/g, '')
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}
const derToPem = (der: Uint8Array): string =>
  `-----BEGIN CERTIFICATE-----\n${Buffer.from(der).toString('base64')}\n-----END CERTIFICATE-----\n`

const parts = (der: Uint8Array) => {
  const cert = AsnConvert.parse(der, Certificate)
  return {
    cert,
    tbs: new Uint8Array(AsnConvert.serialize(cert.tbsCertificate)),
    signature: new Uint8Array(cert.signatureValue),
    publicValue: new Uint8Array(cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey),
  }
}

describe('composite certificate: two HSM calls (before 3.3) and one CKM_COMP_SIG call (after 3.3)', () => {
  let M: SoftHSMModule
  let hSession = 0
  const subject = '/CN=Hybrid Certificate Demo/O=PQC Today/OU=Hybrid Certificate Sandbox'

  beforeAll(async () => {
    M = (await S.getSoftHSMRustModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'CompCert')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  /** Verify a certificate's own TBS and signature in the engine with CKM_COMP_SIG. */
  const engineVerifies = (
    der: Uint8Array,
    profileOid: string,
    tamper?: (sig: Uint8Array) => void
  ) => {
    const set = COMPOSITE_SIG_SETS.find((x) => x.oid === profileOid)!
    const { tbs, signature, publicValue } = parts(der)
    const pub = hsm_importCompositeKeyRv(M, hSession, 'sig', 'public', set.ckp, publicValue)
    expect(pub.rv).toBe(0)
    const sig = Uint8Array.from(signature)
    tamper?.(sig)
    return hsm_compositeVerifyRv(M, hSession, pub.handle, tbs, sig).rv === 0
  }

  it.each(COMPOSITE_PROFILE_CHOICES.map((c) => [c.profile.label, c] as const))(
    '%s: one-call certificate verifies in JavaScript; by-hand certificate verifies in the engine',
    async (_label, choice) => {
      const profile = choice.profile

      // after 3.3: one combined key, one call; judged by the independent JavaScript verifier
      const one = await hybridCryptoService.generateCompositeCertOneCall(
        subject,
        M,
        hSession,
        undefined,
        profile
      )
      expect(one.error).toBeUndefined()
      const oneDer = pemToDer(one.pem)
      const js = await verifyCompositeCert(oneDer)
      expect(js.recognized).toBe(true)
      expect(js.mldsa?.verified).toBe(true)
      expect(js.classical?.verified).toBe(true)
      expect(js.valid).toBe(true)

      // before 3.3: two calls; judged by the engine's own composite verifier
      const hand = await hybridCryptoService.generateCompositeCert(
        subject,
        M,
        hSession,
        undefined,
        profile
      )
      expect(hand.error).toBeUndefined()
      const handDer = pemToDer(hand.pem)
      expect(engineVerifies(handDer, profile.compositeOid)).toBe(true)

      // and each side also accepts its own
      expect(engineVerifies(oneDer, profile.compositeOid)).toBe(true)
      expect((await verifyCompositeCert(handDer)).valid).toBe(true)

      // Sabotage control: damage one half; BOTH verifiers must refuse.
      const mlLen = profile.mldsaSigBytes
      for (const [name, index] of [
        ['ML-DSA half', 0],
        ['traditional half', mlLen],
      ] as const) {
        expect(
          engineVerifies(oneDer, profile.compositeOid, (sig) => {
            sig[index] ^= 1
          }),
          `engine accepts a corrupted ${name}`
        ).toBe(false)
        const bad = parts(oneDer)
        const sig = Uint8Array.from(bad.signature)
        sig[index] ^= 1
        bad.cert.signatureValue = sig.buffer as ArrayBuffer
        const jsBad = await verifyCompositeCert(
          pemToDer(derToPem(new Uint8Array(AsnConvert.serialize(bad.cert))))
        )
        expect(jsBad.valid, `JavaScript verifier accepts a corrupted ${name}`).toBe(false)
      }
    }
  )

  it('the two ways produce certificates that name the same composite algorithm and key layout', async () => {
    const profile = COMPOSITE_PROFILE_CHOICES[0].profile
    const one = parts(
      pemToDer(
        (
          await hybridCryptoService.generateCompositeCertOneCall(
            subject,
            M,
            hSession,
            undefined,
            profile
          )
        ).pem
      )
    )
    const hand = parts(
      pemToDer(
        (await hybridCryptoService.generateCompositeCert(subject, M, hSession, undefined, profile))
          .pem
      )
    )
    expect(one.cert.signatureAlgorithm.algorithm).toBe(hand.cert.signatureAlgorithm.algorithm)
    expect(one.publicValue.length).toBe(hand.publicValue.length)
    expect(one.signature.length).toBeGreaterThan(profile.mldsaSigBytes)
  })
})
